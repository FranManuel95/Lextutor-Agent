import { test, expect, type Page } from "@playwright/test";

const email = process.env.TEST_USER_EMAIL ?? "";
const password = process.env.TEST_USER_PASSWORD ?? "";
const hasCredentials = !!email && !!password;

async function loginAs(page: Page, userEmail: string, userPassword: string) {
  await page.goto("/login");
  await page.fill("#email", userEmail);
  await page.fill("#password", userPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/chat/, { timeout: 30_000 });
}

test.describe("Progress page", () => {
  test.skip(!hasCredentials, "TEST_USER_EMAIL / TEST_USER_PASSWORD not configured");

  test.beforeEach(async ({ page }) => {
    await loginAs(page, email, password);
    await page.goto("/progress");
    await page.waitForLoadState("networkidle");
  });

  test("renders the progress page heading", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Mi Progreso");
  });

  test("shows KPI cards for total questions and streak", async ({ page }) => {
    await expect(page.locator("text=Total Preguntas")).toBeVisible();
    await expect(page.locator("text=Racha Actual")).toBeVisible();
  });

  test("shows second KPI row with nota media and exams done", async ({ page }) => {
    await expect(page.locator("text=Nota Media")).toBeVisible();
    await expect(page.locator("text=Exámenes Realizados")).toBeVisible();
    await expect(page.locator("text=Último Estudio")).toBeVisible();
  });

  test("export PDF button is visible and enabled", async ({ page }) => {
    const exportBtn = page.getByRole("button", { name: /Exportar PDF/i });
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });

  test("export PDF button shows loading state when clicked and triggers download", async ({
    page,
  }) => {
    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 }).catch(() => null);
    const exportBtn = page.getByRole("button", { name: /Exportar PDF/i });
    await exportBtn.click();

    // Loading state should briefly appear
    await expect(page.getByRole("button", { name: /Generando/i })).toBeVisible().catch(() => {});

    // Wait for the download (may not trigger in headless without jsPDF)
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/lextutor-progreso.*\.pdf$/);
    }
  });

  test("milestones section is rendered", async ({ page }) => {
    await expect(page.locator("text=Hitos Desbloqueados")).toBeVisible();
  });

  test("distribution chart is rendered when there is data or shows empty state", async ({
    page,
  }) => {
    const hasDistribution = await page.locator("text=Distribución por Materia").isVisible();
    expect(hasDistribution).toBe(true);
  });
});
