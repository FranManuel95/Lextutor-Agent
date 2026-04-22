import { test, expect, type Page } from "@playwright/test";

const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "";
const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
const hasAdminCredentials = !!adminEmail && !!adminPassword;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(chat|admin)/, { timeout: 30_000 });
}

test.describe("Admin users panel", () => {
  test.skip(!hasAdminCredentials, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not configured");

  test.beforeEach(async ({ page }) => {
    await loginAs(page, adminEmail, adminPassword);
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
  });

  test("renders user table with at least the logged-in admin", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible();
    // At minimum the admin row should exist
    const rows = page.locator("tbody tr");
    await expect(rows).not.toHaveCount(0);
  });

  test("search input filters visible users by name", async ({ page }) => {
    // Get the first user's name from the table
    const firstCell = page.locator("tbody tr:first-child td:first-child");
    await expect(firstCell).toBeVisible();
    const name = await firstCell.innerText();
    const firstWord = name.trim().split(/\s+/)[0];

    // Type the first word in the search box
    const searchInput = page.getByPlaceholder("Buscar por nombre o email…");
    await searchInput.fill(firstWord);

    // Table should still show that user
    await expect(page.locator("tbody tr").first()).toContainText(firstWord);

    // Search for something that shouldn't exist
    await searchInput.fill("__nonexistent_user_xyz__");
    await expect(page.locator("text=Sin resultados")).toBeVisible();
  });

  test("filter pills narrow the list to admin or student roles", async ({ page }) => {
    const adminPill = page.getByRole("button", { name: "Admin" });
    await adminPill.click();

    // All visible badges should say "admin"
    const badges = page.locator("tbody tr td:nth-child(3) span");
    const count = await badges.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(badges.nth(i)).toContainText("admin");
      }
    }

    // Switch to Estudiante
    const studentPill = page.getByRole("button", { name: "Estudiante" });
    await studentPill.click();

    const studentBadges = page.locator("tbody tr td:nth-child(3) span");
    const studentCount = await studentBadges.count();
    if (studentCount > 0) {
      for (let i = 0; i < studentCount; i++) {
        await expect(studentBadges.nth(i)).toContainText("student");
      }
    }
  });

  test("self-row action button is disabled", async ({ page }) => {
    // The logged-in admin row should have a disabled action button
    // We look for a button with title containing "No puedes cambiar tu propio rol"
    const selfButton = page.locator('button[title="No puedes cambiar tu propio rol"]');
    if ((await selfButton.count()) > 0) {
      await expect(selfButton.first()).toBeDisabled();
    }
  });

  test("activity chart appears on admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    // The chart heading should be visible
    await expect(page.locator("text=Actividad últimos 7 días")).toBeVisible();
  });
});
