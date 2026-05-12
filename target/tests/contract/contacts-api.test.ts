/**
 * T031: Contract tests for REST API — Contacts
 *
 * These tests define the EXPECTED contract for /api/v1/contacts endpoints.
 * They validate request/response shapes, authentication requirements, and
 * input validation rules as specified in contracts/rest-api.md.
 *
 * Since the REST route handlers do not exist yet, tests that require a
 * running Next.js server use `describe.todo()` / `it.todo()`. Tests that
 * validate pure schema/type contracts run immediately.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Expected schemas (derived from the REST API contract)
// ---------------------------------------------------------------------------

/** Minimum required fields for POST /api/v1/contacts */
const createContactSchema = z.object({
  fullName: z.string().min(1).max(500),
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(255).optional(),
  companyId: z.string().uuid().optional(),
  lifecycleStage: z.string().max(50).optional(),
  ownerId: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

/** Partial update body for PATCH /api/v1/contacts/:id */
const updateContactSchema = createContactSchema.partial();

/** Standard success envelope for a single contact */
const contactResponseEnvelopeSchema = z.object({
  data: z
    .object({
      id: z.string().uuid(),
      workspaceId: z.string().uuid(),
      fullName: z.string(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .passthrough(),
});

/** Standard success envelope for a paginated contact list */
const contactListResponseEnvelopeSchema = z.object({
  data: z.array(z.object({ id: z.string().uuid() }).passthrough()),
  meta: z.object({
    cursor: z.string().uuid().nullable(),
    hasMore: z.boolean(),
    total: z.number().int().nonnegative(),
  }),
});

/** Standard error envelope */
const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(z.object({ field: z.string(), message: z.string() }))
      .optional(),
  }),
});

// ---------------------------------------------------------------------------
// Schema / shape validation tests (run without a server)
// ---------------------------------------------------------------------------

describe("Contacts API — request schema validation", () => {
  it("createContactSchema requires full_name (fullName) field", () => {
    const missingName = { email: "jane@acme.com" };
    const result = createContactSchema.safeParse(missingName);
    expect(result.success).toBe(false);
  });

  it("createContactSchema accepts a valid body with only fullName", () => {
    const valid = { fullName: "Jane Smith" };
    const result = createContactSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("createContactSchema accepts a full body", () => {
    const full = {
      fullName: "Jane Smith",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@acme.com",
      phone: "+1-555-0123",
      jobTitle: "VP Engineering",
      companyId: "c0a80121-0001-4000-8000-000000000001",
      lifecycleStage: "lead",
      ownerId: "c0a80121-0002-4000-8000-000000000001",
      source: "manual",
      customFields: { contract_value: 50000 },
    };
    const result = createContactSchema.safeParse(full);
    expect(result.success).toBe(true);
  });

  it("createContactSchema rejects an invalid email", () => {
    const bad = { fullName: "Jane", email: "not-an-email" };
    const result = createContactSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("createContactSchema rejects a non-UUID companyId", () => {
    const bad = { fullName: "Jane", companyId: "not-a-uuid" };
    const result = createContactSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("updateContactSchema allows partial updates", () => {
    const partial = { email: "new@acme.com" };
    const result = updateContactSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it("updateContactSchema allows an empty body (no-op update)", () => {
    const result = updateContactSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("Contacts API — response envelope schemas", () => {
  it("contactResponseEnvelopeSchema validates a single-contact response", () => {
    const response = {
      data: {
        id: "c0a80121-0001-4000-8000-000000000001",
        workspaceId: "c0a80121-0003-4000-8000-000000000001",
        fullName: "Jane Smith",
        email: "jane@acme.com",
        lifecycleStage: "lead",
        createdAt: "2026-05-12T14:30:00Z",
        updatedAt: "2026-05-12T14:30:00Z",
      },
    };
    const result = contactResponseEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("contactListResponseEnvelopeSchema validates a paginated list response", () => {
    const response = {
      data: [
        { id: "c0a80121-0001-4000-8000-000000000001", fullName: "Jane Smith" },
        { id: "c0a80121-0001-4000-8000-000000000002", fullName: "John Doe" },
      ],
      meta: {
        cursor: "c0a80121-0001-4000-8000-000000000002",
        hasMore: true,
        total: 142,
      },
    };
    const result = contactListResponseEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("errorEnvelopeSchema validates an error response", () => {
    const response = {
      error: {
        code: "VALIDATION_ERROR",
        message: "full_name is required",
        details: [{ field: "fullName", message: "Required" }],
      },
    };
    const result = errorEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// HTTP-level contract tests (require running server — stubbed as todo)
// ---------------------------------------------------------------------------

describe.todo("GET /api/v1/contacts", () => {
  // Expected behavior:
  // - Returns 401 when no Authorization header is present
  // - Returns 200 with contactListResponseEnvelopeSchema on success
  // - Supports cursor, limit, search, lifecycleStage, ownerId, sortBy, sortOrder query params
  // - Default limit is 50, max is 100
  // - Default sortBy is createdAt, default sortOrder is desc

  it.todo("returns 401 without auth header");
  it.todo("returns 200 with paginated contact list");
  it.todo("respects limit query parameter (max 100)");
  it.todo("filters by lifecycleStage query parameter");
  it.todo("supports cursor-based pagination");
});

describe.todo("POST /api/v1/contacts", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 400 when body is missing fullName field
  // - Returns 201 with contactResponseEnvelopeSchema on success
  // - Returns 409 if duplicate unique field (e.g. same email in workspace)

  it.todo("returns 401 without auth header");
  it.todo("returns 400 when body is missing fullName");
  it.todo("returns 400 for invalid email format");
  it.todo("returns 201 with created contact on success");
});

describe.todo("PATCH /api/v1/contacts/:id", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 400 if :id is not a valid UUID
  // - Returns 404 if contact does not exist or is soft-deleted
  // - Returns 200 with updated contact on success

  it.todo("returns 401 without auth header");
  it.todo("returns 400 if id is not a valid UUID");
  it.todo("returns 404 if contact not found");
  it.todo("returns 200 with updated contact on success");
});

describe.todo("DELETE /api/v1/contacts/:id", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 400 if :id is not a valid UUID
  // - Returns 404 if contact does not exist
  // - Returns 204 on successful soft delete

  it.todo("returns 401 without auth header");
  it.todo("returns 400 if id is not a valid UUID");
  it.todo("returns 404 if contact not found");
  it.todo("returns 204 on successful soft delete");
});

// ---------------------------------------------------------------------------
// UUID validation (used by PATCH and DELETE :id param)
// ---------------------------------------------------------------------------

describe("Contacts API — :id parameter validation", () => {
  const uuidSchema = z.string().uuid();

  it("accepts a valid UUID v4", () => {
    const result = uuidSchema.safeParse("c0a80121-0001-4000-8000-000000000001");
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID string", () => {
    const result = uuidSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = uuidSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a numeric id", () => {
    const result = uuidSchema.safeParse("12345");
    expect(result.success).toBe(false);
  });
});
