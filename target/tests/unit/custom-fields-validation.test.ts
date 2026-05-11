/**
 * T188: Unit tests for validateCustomFields
 *
 * Tests the custom field validation logic from @/server/lib/validators.
 */

import { describe, it, expect } from "vitest";
import {
  validateCustomFields,
  type FieldDefinitionForValidation,
} from "@/server/lib/validators";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const textField: FieldDefinitionForValidation = {
  fieldKey: "bio",
  fieldType: "text",
  isRequired: false,
};

const requiredTextField: FieldDefinitionForValidation = {
  fieldKey: "title",
  fieldType: "text",
  isRequired: true,
};

const numberField: FieldDefinitionForValidation = {
  fieldKey: "score",
  fieldType: "number",
  isRequired: false,
};

const emailField: FieldDefinitionForValidation = {
  fieldKey: "work_email",
  fieldType: "email",
  isRequired: false,
};

const selectField: FieldDefinitionForValidation = {
  fieldKey: "priority",
  fieldType: "select",
  isRequired: false,
  options: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ],
};

const allDefs = [textField, requiredTextField, numberField, emailField, selectField];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validateCustomFields", () => {
  it("rejects unknown field key", () => {
    const result = validateCustomFields(
      { unknown_field: "value" },
      allDefs,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes("unknown_field"))).toBe(true);
  });

  it("rejects missing required field", () => {
    const result = validateCustomFields({}, allDefs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("title"))).toBe(true);
  });

  it("accepts valid text field", () => {
    const result = validateCustomFields(
      { title: "Hello", bio: "Some bio" },
      allDefs,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects non-string for text field", () => {
    const result = validateCustomFields(
      { title: "Hello", bio: 123 },
      allDefs,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("bio") && e.includes("string"))).toBe(true);
  });

  it("accepts valid number field", () => {
    const result = validateCustomFields(
      { title: "Hello", score: 42 },
      allDefs,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects string for number field", () => {
    const result = validateCustomFields(
      { title: "Hello", score: "not-a-number" },
      allDefs,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("score") && e.includes("number"))).toBe(true);
  });

  it("validates select field against options", () => {
    const result = validateCustomFields(
      { title: "Hello", priority: "high" },
      allDefs,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects select value not in options", () => {
    const result = validateCustomFields(
      { title: "Hello", priority: "urgent" },
      allDefs,
    );
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes("priority") && e.includes("urgent")),
    ).toBe(true);
  });

  it("accepts valid email field", () => {
    const result = validateCustomFields(
      { title: "Hello", work_email: "alice@example.com" },
      allDefs,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
