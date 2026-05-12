import { test, expect } from "@playwright/test";

test.describe("Contact Import", () => {
  test.skip("navigates through the import wizard steps", async ({ page }) => {
    await page.goto("/contacts/import");
    await expect(page.getByText("Import Contacts")).toBeVisible();
    // TODO: Upload a file and verify step progression
  });

  test.skip("imports a CSV file and shows success message", async ({
    page,
  }) => {
    await page.goto("/contacts/import");
    // TODO: Upload a CSV fixture, map columns, confirm, verify success step
  });
});
