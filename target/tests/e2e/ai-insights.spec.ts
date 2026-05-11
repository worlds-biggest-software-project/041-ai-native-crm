/**
 * T136: E2E tests for AI Insights tab on deal detail page.
 */

import { test } from "@playwright/test";

test.describe("AI Insights", () => {
  test.skip("deal AI Insights tab shows summary", async ({ page }) => {
    await page.goto("/deals/some-deal-id");
    // TODO: Navigate to AI Insights tab
    // Verify that a meeting summary card is rendered with summary text,
    // key points, action items, sentiment badge, and topic tags
  });

  test.skip("generate follow-up, edit, send", async ({ page }) => {
    await page.goto("/deals/some-deal-id");
    // TODO: Navigate to AI Insights tab
    // Click "Generate Follow-Up" button
    // Verify the follow-up draft component appears with subject and body
    // Edit the subject and body text
    // Click "Send" button
    // Verify the follow-up status changes to "sent"
  });
});
