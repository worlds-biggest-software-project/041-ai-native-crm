import { test, expect } from "@playwright/test";

test.describe("Activity Timeline", () => {
  test.skip("contact detail Activity tab shows timeline with mixed types", async ({
    page,
  }) => {
    await page.goto("/contacts");
    // TODO: Navigate to a contact detail, switch to Activity tab,
    // verify timeline renders with email, meeting, call, note, and stage_change items
  });

  test.skip("load more pagination works", async ({ page }) => {
    await page.goto("/activities");
    // TODO: Verify "Load more" button is present, click it,
    // verify additional activities are appended to the timeline
  });

  test.skip("activity type filter works", async ({ page }) => {
    await page.goto("/activities");
    // TODO: Click each filter button (Emails, Meetings, Calls, Notes),
    // verify only matching activity types are displayed
  });
});
