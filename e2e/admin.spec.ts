import { test, expect, type Page } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "";
const password = process.env.TEST_USER_PASSWORD ?? "";
const hasCredentials = !!email && !!password;

async function loginAs(page: Page, userEmail: string, userPassword: string) {
  await page.goto("/login");
  await page.fill("#email", userEmail);
  await page.fill("#password", userPassword);
  await page.click('button[type="submit"]');
}

test.describe("Admin access control", () => {
  test.skip(!hasCredentials, "TEST_USER_EMAIL / TEST_USER_PASSWORD not configured");

  test.beforeAll(async ({ browser }) => {
    // Warm up: login once so the server action + /chat + /admin routes compile.
    const page = await browser.newPage();
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/chat/, { timeout: 90_000 }).catch(() => {});
    await page.close();
  });

  test("non-admin user loading /admin/rag gets 403 from the documents API", async ({ page }) => {
    await loginAs(page, email, password);
    await page.waitForURL(/\/chat/, { timeout: 30_000 });

    // Intercept the admin documents API to assert the forbidden status reaches the client
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/rag/documents") && resp.request().method() === "GET",
      { timeout: 15_000 }
    );
    await page.goto("/admin/rag");
    const response = await responsePromise;

    // Non-admin must be rejected by requireAdmin()
    expect([401, 403]).toContain(response.status());
  });

  test("non-admin user loading /admin/rag does not crash the page", async ({ page }) => {
    await loginAs(page, email, password);
    await page.waitForURL(/\/chat/, { timeout: 30_000 });

    await page.goto("/admin/rag");
    // Page should render (the app must handle the API 403 gracefully via error boundary or toast)
    await expect(page.locator("body")).toBeVisible();
    // Should not have crashed to an unhandled Next.js error page
    await expect(page.locator("text=/Application error|Unhandled Runtime Error/i")).toHaveCount(0);
  });

  test("authenticated user can navigate between /chat and /progress without re-login", async ({
    page,
  }) => {
    await loginAs(page, email, password);
    await page.waitForURL(/\/chat/, { timeout: 30_000 });

    await page.goto("/progress");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/login");

    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/chat");
  });
});
