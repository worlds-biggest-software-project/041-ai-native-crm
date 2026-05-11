import { test, expect } from "@playwright/test";

test.describe("Contacts", () => {
  test.skip("navigates to contacts page", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page).toHaveURL(/.*contacts/);
  });

  test.skip("creates a new contact", async ({ page }) => {
    await page.goto("/contacts");
    // TODO: Click create button, fill out form, verify contact appears in list
  });

  test.skip("searches for a contact", async ({ page }) => {
    await page.goto("/contacts");
    // TODO: Type in search input, verify filtered results
  });

  test.skip("views contact detail", async ({ page }) => {
    await page.goto("/contacts");
    // TODO: Click a contact row, verify detail page loads with correct data
  });
});
