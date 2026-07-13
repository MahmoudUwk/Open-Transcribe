import { test, expect } from "@playwright/test";

test.describe("Client-side State Persistence Integration Tests", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip WebKit-based profiles due to Playwright WebKit headless IndexedDB / mic limits
    if (testInfo.project.name.includes("webkit") || testInfo.project.name.includes("ios")) {
      test.skip();
    }

    // Pipe page logs and errors to terminal for debugging
    page.on("console", (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.log(`[Browser PageError] ${err.stack || err.message}`);
    });

    // Navigate to page to initialize environment
    await page.goto("/");
    // Clear the store instead of deleting the database to prevent connections from blocking and timing out
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.open("OpenTranscribeDB", 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("AppStateStore")) {
            db.createObjectStore("AppStateStore");
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          if (db.objectStoreNames.contains("AppStateStore")) {
            const tx = db.transaction("AppStateStore", "readwrite");
            const store = tx.objectStore("AppStateStore");
            const clearReq = store.clear();
            clearReq.onsuccess = () => {
              db.close();
              resolve();
            };
            clearReq.onerror = () => {
              db.close();
              resolve();
            };
          } else {
            db.close();
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    });
  });

  test("restores transcription text from IndexedDB", async ({ page }) => {
    await page.evaluate(async () => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("OpenTranscribeDB", 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("AppStateStore", "readwrite");
          const store = transaction.objectStore("AppStateStore");
          store.put("Hello, this is a persisted transcription.", "transcription");
          
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
        request.onerror = () => reject(request.error);
      });
    });

    // Reload the page
    await page.reload();

    // Verify it is restored in the markdown preview
    const preview = page.locator(".markdown-preview");
    await expect(preview).toHaveText("Hello, this is a persisted transcription.");
  });

  test("restores last completed recording state from IndexedDB", async ({ page }) => {
    await page.evaluate(async () => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("OpenTranscribeDB", 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("AppStateStore", "readwrite");
          const store = transaction.objectStore("AppStateStore");
          const dummyBlob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/webm" });
          const record = {
            blob: dummyBlob,
            format: "audio/webm",
            durationMs: 12500
          };
          store.put(record, "last_recording");
          
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
        request.onerror = () => reject(request.error);
      });
    });

    // Reload the page
    await page.reload();

    // Verify last capture is restored and shows details
    const captureInfo = page.locator("text=/Last capture:.*webm/i");
    await expect(captureInfo).toBeVisible();
    await expect(captureInfo).toContainText("13s");

    // Verify download button is enabled
    const downloadBtn = page.getByRole("button", { name: /download/i });
    await expect(downloadBtn).toBeEnabled();
  });

  test("recovers interrupted recording session on startup", async ({ page }) => {
    await page.evaluate(async () => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("OpenTranscribeDB", 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("AppStateStore", "readwrite");
          const store = transaction.objectStore("AppStateStore");
          const dummyBlob1 = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
          const dummyBlob2 = new Blob([new Uint8Array([4, 5, 6])], { type: "audio/webm" });
          
          store.put([dummyBlob1, dummyBlob2], "active_chunks");
          store.put({
            startedAt: Date.now() - 15000,
            mimeType: "audio/webm"
          }, "active_metadata");
          
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
        request.onerror = () => reject(request.error);
      });
    });

    // Reload the page
    await page.reload();

    // Verify recovery status message
    const statusText = page.locator("text=/Recovered interrupted recording/i");
    await expect(statusText).toBeVisible();

    // Verify restored recording is now active
    const captureInfo = page.locator("text=/Last capture:.*webm/i");
    await expect(captureInfo).toBeVisible();

    // Verify active_chunks keys were deleted after recovery
    const activeChunks = await page.evaluate(async () => {
      return new Promise<any>((resolve, reject) => {
        const request = indexedDB.open("OpenTranscribeDB", 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("AppStateStore", "readonly");
          const store = transaction.objectStore("AppStateStore");
          const getReq = store.get("active_chunks");
          getReq.onsuccess = () => {
            db.close();
            resolve(getReq.result ?? null);
          };
          getReq.onerror = () => {
            db.close();
            reject(getReq.error);
          };
        };
        request.onerror = () => reject(request.error);
      });
    });
    expect(activeChunks).toBeNull();
  });

  test("saves recording chunks periodically to IndexedDB during live recording", async ({ page, context }) => {
    // Grant microphone permission and setup fake mic
    await context.grantPermissions(["microphone"]).catch(() => {});

    await page.goto("/");

    const startBtn = page.getByRole("button", { name: /start recording/i });
    await startBtn.click();

    // Wait for at least 11 seconds to ensure timesliced chunks (every 5s) are written to IndexedDB
    await page.waitForTimeout(11000);

    // Read active chunks from IndexedDB
    const activeChunksCount = await page.evaluate(async () => {
      return new Promise<number>((resolve, reject) => {
        const request = indexedDB.open("OpenTranscribeDB", 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("AppStateStore", "readonly");
          const store = transaction.objectStore("AppStateStore");
          const getReq = store.get("active_chunks");
          getReq.onsuccess = () => {
            db.close();
            const chunks = getReq.result;
            resolve(chunks ? chunks.length : 0);
          };
          getReq.onerror = () => {
            db.close();
            reject(getReq.error);
          };
        };
        request.onerror = () => reject(request.error);
      });
    });

    // Expect at least 2 chunks to have been saved (1 per second)
    expect(activeChunksCount).toBeGreaterThanOrEqual(2);

    // Clean up by stopping
    const stopBtn = page.getByRole("button", { name: /stop recording/i });
    await stopBtn.click();
  });
});
