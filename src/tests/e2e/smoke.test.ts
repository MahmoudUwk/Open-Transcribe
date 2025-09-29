import { test, expect } from "@playwright/test";

// Phase 1 TDD: this intentionally fails until the Tauri shell is wired up.
test("launches Open-Transcribe window", async ({ page }) => {
  await page.goto("http://localhost:1420");
  await expect(page.locator("body")).toContainText("Open-Transcribe");
});
