import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verify the app boots and unauthenticated flows work.
 * These run against a live dev server (see playwright.config.ts webServer).
 */

test("home page loads", async ({ page }) => {
  await page.goto("/");
  // Should not hit a 5xx error.
  await expect(page).not.toHaveURL(/error/);
});

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toBeVisible();
});

test("protected route redirects to /login when unauthenticated", async ({ page }) => {
  await page.goto("/chat");
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  expect(page.url()).toContain("/login");
});

test("admin route redirects to /login when unauthenticated", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  expect(page.url()).toContain("/login");
});
