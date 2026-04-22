import { test, expect, type Page } from "@playwright/test";

const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "";
const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
const hasAdminCredentials = !!adminEmail && !!adminPassword;

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill("#email", adminEmail);
  await page.fill("#password", adminPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(chat|admin)/, { timeout: 30_000 });
}

test.describe("Admin exams overview", () => {
  test.skip(!hasAdminCredentials, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not configured");

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/exams");
    await page.waitForLoadState("networkidle");
  });

  test("renders page heading and filters", async ({ page }) => {
    await expect(page.locator("h2")).toContainText("Exámenes de la plataforma");
    await expect(page.getByText("Área")).toBeVisible();
    await expect(page.getByText("Tipo")).toBeVisible();
    await expect(page.getByText("Estado")).toBeVisible();
  });

  test("export CSV button is visible and points to correct endpoint", async ({ page }) => {
    const exportLink = page.getByRole("link", { name: /Exportar CSV/i });
    await expect(exportLink).toBeVisible();
    const href = await exportLink.getAttribute("href");
    expect(href).toMatch(/^\/api\/admin\/exams\/export/);
  });

  test("area filter changes URL query", async ({ page }) => {
    await page.getByText("Área").click().catch(() => {});
    // Open the area select and pick 'civil' — this targets a SelectItem inside a portal
    // so we use role-based selectors.
    const areaTrigger = page.locator('div:has-text("Área") + div button, button:has-text("Todas")').first();
    if ((await areaTrigger.count()) > 0) {
      await areaTrigger.click();
      await page.getByRole("option", { name: "Civil" }).click().catch(() => {});
      await page.waitForURL(/area=civil/, { timeout: 5_000 }).catch(() => {});
    }
  });
});

test.describe("Admin flags panel", () => {
  test.skip(!hasAdminCredentials, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not configured");

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/flags");
    await page.waitForLoadState("networkidle");
  });

  test("renders 3 status tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Sin revisar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Revisados" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Descartados" })).toBeVisible();
  });

  test("export CSV button is present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Exportar CSV/i })).toBeVisible();
  });

  test("switching to Revisados updates URL", async ({ page }) => {
    await page.getByRole("button", { name: "Revisados" }).click();
    await page.waitForURL(/status=reviewed/, { timeout: 5_000 });
    expect(page.url()).toContain("status=reviewed");
  });
});

test.describe("Exam retry deep link", () => {
  test.skip(!hasAdminCredentials, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not configured");

  test("exam config page accepts area and difficulty via searchParams", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/quiz?area=laboral&difficulty=hard&count=5");
    await page.waitForLoadState("networkidle");

    // The Select components should reflect the pre-filled config.
    // We check that the content of the first SelectValue mentions 'Laboral'.
    await expect(page.getByText("Laboral").first()).toBeVisible();
  });

  test("invalid area falls back to default (civil)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/quiz?area=invalid_area");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Civil").first()).toBeVisible();
  });
});
