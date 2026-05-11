import { test, expect } from "@playwright/test";

test.describe("Pipeline Board", () => {
  test.skip("renders pipeline stages", async ({ page }) => {
    await page.goto("/deals");
    // TODO: Verify each stage column is rendered with correct heading
  });

  test.skip("drags deal between stages", async ({ page }) => {
    await page.goto("/deals");
    // TODO: Drag a deal card from one stage column to another, verify stage update
  });

  test.skip("updates stage totals after drag", async ({ page }) => {
    await page.goto("/deals");
    // TODO: After dragging a deal, verify the source and target stage totals update
  });
});
