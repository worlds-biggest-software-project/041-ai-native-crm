/**
 * T177: Integration tests for MCP resources
 *
 * These tests define the expected behavior for the MCP resource handlers.
 * Each test is stubbed with `it.todo()` and will be implemented once the
 * resource handlers connect to the database.
 */

import { describe, it } from "vitest";

describe("MCP resources", () => {
  it.todo("lists contacts via crm://contacts resource");
  // Expected:
  // - Reading the crm://contacts resource returns a JSON array
  // - Each item has id, fullName, email, and company fields
  // - Results are scoped to the authenticated workspace

  it.todo("reads a single contact via crm://contacts/{id} resource");
  // Expected:
  // - Reading crm://contacts/{uuid} returns a single contact object
  // - Includes full detail: id, fullName, email, phone, company, lifecycle stage
  // - Returns an error for non-existent contact IDs

  it.todo("lists deals via crm://deals resource");
  // Expected:
  // - Reading the crm://deals resource returns a JSON array
  // - Each item has id, name, amount, stage, and pipeline fields
  // - Results are scoped to the authenticated workspace
});
