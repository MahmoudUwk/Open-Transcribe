import { test, expect } from "@playwright/test";

test.describe("Open-Transcribe", () => {
  test("loads and shows core UI elements", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /open-transcribe/i })).toBeVisible();
    await expect(page.getByText(/ai-powered audio transcription/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /start recording/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /run/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /copy/i })).toBeDisabled();
    await expect(page.getByLabel(/model pool/i)).toBeVisible();
    await expect(page.getByText(/3.1 flash-lite/i)).toBeVisible();
    await expect(page.getByText(/3 flash preview/i)).toBeVisible();
  });

  test("shows API key form when no key is set", async ({ page }) => {
    await page.goto("/");

    const apiKeyInput = page.getByLabel(/gemini api key/i);
    await expect(apiKeyInput).toBeVisible();
    await expect(page.getByRole("button", { name: /save api key/i })).toBeVisible();
  });

  test("recording button click produces a response", async ({ page }) => {
    await page.goto("/");

    const startBtn = page.getByRole("button", { name: /start recording/i });
    await startBtn.click();

    const stopped = page.getByRole("button", { name: /stop recording/i }).waitFor({ timeout: 3_000 }).then(() => true).catch(() => false);
    const errored = page.getByRole("alert").waitFor({ timeout: 3_000 }).then(() => true).catch(() => false);

    const result = await Promise.race([stopped, errored]);
    expect(result).toBe(true);
  });

  test("prompt preset selector is present and functional", async ({ page }) => {
    await page.goto("/");

    const select = page.getByLabel(/prompt preset/i);
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("transcribe-autodetect");

    await select.selectOption("transcribe-plan");
    await expect(select).toHaveValue("transcribe-plan");
  });
});
