import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.skip("displays KPI cards with placeholder data", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByText("Total Deals")).toBeVisible();
    await expect(page.getByText("Total Value")).toBeVisible();
    await expect(page.getByText("Avg Deal Size")).toBeVisible();
    await expect(page.getByText("Win Rate")).toBeVisible();
  });

  test.skip("displays pipeline funnel chart", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByText("Pipeline Funnel")).toBeVisible();
    // TODO: Verify individual stage bars are rendered
  });
});
