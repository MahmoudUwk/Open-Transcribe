import { test, expect } from "@playwright/test";

test.describe("Open-Transcribe", () => {
  test("loads and shows core UI elements", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /open-transcribe/i })).toBeVisible();
    // Subtitle was changed; keep this in sync with App.tsx branding copy.
    await expect(page.getByText(/configure free api/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /start recording/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /run/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /copy/i })).toBeDisabled();
    await expect(page.getByLabel(/model pool/i)).toBeVisible();
    await expect(page.getByText(/3\.1 flash-lite/i)).toBeVisible();
    await expect(page.getByText(/3\.5 flash/i)).toBeVisible();
  });

  test("shows API key form when no key is set", async ({ page }) => {
    await page.goto("/");

    const apiKeyInput = page.getByLabel(/gemini api key/i);
    await expect(apiKeyInput).toBeVisible();
    await expect(page.getByRole("button", { name: /save api key/i })).toBeVisible();
  });

  test("prompt preset selector is present and functional", async ({ page }) => {
    await page.goto("/");

    const select = page.getByLabel(/prompt preset/i);
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("transcribe-autodetect");

    await select.selectOption("transcribe-plan");
    await expect(select).toHaveValue("transcribe-plan");
  });

  test("no horizontal overflow at mobile width (iPhone-class viewport)", async ({
    page,
  }) => {
    // Non-trivial: verifies the mobile-first CSS keeps everything within the
    // viewport (no rogue fixed widths, no overflowing tables/pre, no scroll-x).
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const metrics = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };
    });

    // Allow a tiny sub-pixel tolerance for rounding.
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });

  test("PWA manifest and icons are linked for installability", async ({ page }) => {
    await page.goto("/");

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.webmanifest");

    // Theme color for mobile browser chrome
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#0b0f14"
    );

    // Apple touch icon present
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(2);

    // Fetch the manifest and confirm it's valid JSON with required fields
    const manifestResponse = await page.request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBeTruthy();
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  // Recording depends on microphone access which varies by browser/engine in CI.
  // We accept either a successful stop OR a surfaced error alert.
  test("record button produces a response (success or surfaced error)", async ({
    page,
  }) => {
    // Grant mic permission where supported (Chromium). WebKit/Firefox may ignore.
    await page.context().grantPermissions(["microphone"]).catch(() => {});

    await page.goto("/");

    const startBtn = page.getByRole("button", { name: /start recording/i });
    await startBtn.click();

    const stopped = page
      .getByRole("button", { name: /stop recording/i })
      .waitFor({ timeout: 5_000 })
      .then(() => "stopped" as const);
    const errored = page
      .getByRole("alert")
      .first()
      .waitFor({ timeout: 5_000 })
      .then(() => "errored" as const);

    const result = await Promise.race([stopped, errored]);
    expect(["stopped", "errored"]).toContain(result);
  });
});
