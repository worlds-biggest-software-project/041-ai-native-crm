import { describe, it } from "vitest";

describe("CSV import integration", () => {
  it.todo("parses a well-formed CSV and inserts contacts into the database");

  it.todo("deduplicates records by email when deduplicateBy is set");

  it.todo("reports row-level errors for malformed rows without aborting the entire import");
});
