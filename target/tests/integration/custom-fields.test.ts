/**
 * T189: Integration tests for custom fields tRPC router
 *
 * These tests define the expected behavior for the custom fields and custom
 * objects tRPC routers. Each test is stubbed with `it.todo()` and will be
 * implemented once a mock tRPC caller and test database are available.
 */

import { describe, it } from "vitest";

describe("Custom Fields tRPC router — admin CRUD", () => {
  it.todo("creates a custom field definition and lists it by entity type");
  // Expected:
  // - Call customFields.create with { entityType: "contact", fieldKey: "loyalty_tier", displayName: "Loyalty Tier", fieldType: "select" }
  // - Then call customFields.list with { entityType: "contact" }
  // - The created field appears in the list with the correct properties

  it.todo("deletes a non-system custom field definition");
  // Expected:
  // - Create a custom field, then call customFields.delete with its id
  // - Returns { success: true }
  // - The field no longer appears in customFields.list

  it.todo("rejects deletion of a system field");
  // Expected:
  // - Attempt to delete a field where isSystem is true
  // - Returns { success: false }
  // - The field still appears in the list
});
