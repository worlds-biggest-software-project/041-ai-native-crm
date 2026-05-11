/**
 * T033: Contract tests for REST API — Deals
 *
 * These tests define the EXPECTED contract for /api/v1/deals endpoints.
 * They validate request/response shapes, authentication requirements, and
 * input validation rules as specified in contracts/rest-api.md.
 *
 * Includes specific coverage for the stage move operation (PATCH with stageId),
 * which triggers stage transition logic (validation, audit, close date).
 *
 * Since the REST route handlers do not exist yet, tests that require a
 * running Next.js server use `describe.todo()` / `it.todo()`. Tests that
 * validate pure schema/type contracts run immediately.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Expected schemas (derived from the REST API contract + DB schema)
// ---------------------------------------------------------------------------

/** Minimum required fields for POST /api/v1/deals */
const createDealSchema = z.object({
  name: z.string().min(1).max(500),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  amount: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  expectedCloseDate: z.string().date().optional(),
  ownerId: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  contactIds: z.array(z.string().uuid()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

/** Partial update body for PATCH /api/v1/deals/:id */
const updateDealSchema = createDealSchema.partial();

/** Stage move body — a specific subset of PATCH for moving a deal to a new stage */
const stageMoveSchema = z.object({
  stageId: z.string().uuid(),
});

/** Standard success envelope for a single deal */
const dealResponseEnvelopeSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    pipelineId: z.string().uuid(),
    stageId: z.string().uuid(),
    name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).passthrough(),
});

/** Standard success envelope for a paginated deal list */
const dealListResponseEnvelopeSchema = z.object({
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

describe("Deals API — request schema validation", () => {
  it("createDealSchema requires name, pipelineId, and stageId", () => {
    const missingFields = { amount: 50000 };
    const result = createDealSchema.safeParse(missingFields);
    expect(result.success).toBe(false);
  });

  it("createDealSchema rejects missing name", () => {
    const noName = {
      pipelineId: "c0a80121-0001-4000-8000-000000000001",
      stageId: "c0a80121-0002-4000-8000-000000000001",
    };
    const result = createDealSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it("createDealSchema rejects missing pipelineId", () => {
    const noPipeline = {
      name: "Enterprise Deal",
      stageId: "c0a80121-0002-4000-8000-000000000001",
    };
    const result = createDealSchema.safeParse(noPipeline);
    expect(result.success).toBe(false);
  });

  it("createDealSchema rejects missing stageId", () => {
    const noStage = {
      name: "Enterprise Deal",
      pipelineId: "c0a80121-0001-4000-8000-000000000001",
    };
    const result = createDealSchema.safeParse(noStage);
    expect(result.success).toBe(false);
  });

  it("createDealSchema accepts a minimal valid body", () => {
    const valid = {
      name: "Enterprise Deal",
      pipelineId: "c0a80121-0001-4000-8000-000000000001",
      stageId: "c0a80121-0002-4000-8000-000000000001",
    };
    const result = createDealSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("createDealSchema accepts a full body", () => {
    const full = {
      name: "Enterprise Deal",
      pipelineId: "c0a80121-0001-4000-8000-000000000001",
      stageId: "c0a80121-0002-4000-8000-000000000001",
      companyId: "c0a80121-0003-4000-8000-000000000001",
      amount: 150000,
      currency: "USD",
      expectedCloseDate: "2026-06-30",
      ownerId: "c0a80121-0004-4000-8000-000000000001",
      source: "inbound",
      priority: "high",
      contactIds: [
        "c0a80121-0005-4000-8000-000000000001",
        "c0a80121-0005-4000-8000-000000000002",
      ],
      customFields: { deal_type: "new_business" },
    };
    const result = createDealSchema.safeParse(full);
    expect(result.success).toBe(true);
  });

  it("createDealSchema rejects a non-UUID pipelineId", () => {
    const bad = {
      name: "Deal",
      pipelineId: "not-a-uuid",
      stageId: "c0a80121-0002-4000-8000-000000000001",
    };
    const result = createDealSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("createDealSchema rejects an invalid priority value", () => {
    const bad = {
      name: "Deal",
      pipelineId: "c0a80121-0001-4000-8000-000000000001",
      stageId: "c0a80121-0002-4000-8000-000000000001",
      priority: "critical",
    };
    const result = createDealSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("createDealSchema rejects non-UUID entries in contactIds", () => {
    const bad = {
      name: "Deal",
      pipelineId: "c0a80121-0001-4000-8000-000000000001",
      stageId: "c0a80121-0002-4000-8000-000000000001",
      contactIds: ["not-a-uuid"],
    };
    const result = createDealSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("updateDealSchema allows partial updates", () => {
    const partial = { amount: 200000 };
    const result = updateDealSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it("updateDealSchema allows an empty body (no-op update)", () => {
    const result = updateDealSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("Deals API — stage move schema validation", () => {
  it("stageMoveSchema accepts a valid stageId UUID", () => {
    const valid = { stageId: "c0a80121-0002-4000-8000-000000000001" };
    const result = stageMoveSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("stageMoveSchema rejects a non-UUID stageId", () => {
    const bad = { stageId: "not-a-uuid" };
    const result = stageMoveSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("stageMoveSchema rejects a missing stageId", () => {
    const result = stageMoveSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("stageMoveSchema rejects null stageId", () => {
    const result = stageMoveSchema.safeParse({ stageId: null });
    expect(result.success).toBe(false);
  });
});

describe("Deals API — response envelope schemas", () => {
  it("dealResponseEnvelopeSchema validates a single-deal response", () => {
    const response = {
      data: {
        id: "c0a80121-0001-4000-8000-000000000001",
        workspaceId: "c0a80121-0003-4000-8000-000000000001",
        pipelineId: "c0a80121-0004-4000-8000-000000000001",
        stageId: "c0a80121-0005-4000-8000-000000000001",
        name: "Enterprise Deal",
        amount: 150000,
        currency: "USD",
        expectedCloseDate: "2026-06-30",
        actualCloseDate: null,
        priority: "high",
        createdAt: "2026-05-12T14:30:00Z",
        updatedAt: "2026-05-12T14:30:00Z",
      },
    };
    const result = dealResponseEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("dealListResponseEnvelopeSchema validates a paginated list response", () => {
    const response = {
      data: [
        {
          id: "c0a80121-0001-4000-8000-000000000001",
          name: "Enterprise Deal",
        },
      ],
      meta: {
        cursor: null,
        hasMore: false,
        total: 1,
      },
    };
    const result = dealListResponseEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("errorEnvelopeSchema validates a stage-move validation error", () => {
    const response = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid stage for this pipeline",
        details: [
          { field: "stageId", message: "Stage does not belong to pipeline" },
        ],
      },
    };
    const result = errorEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// HTTP-level contract tests (require running server — stubbed as todo)
// ---------------------------------------------------------------------------

describe.todo("GET /api/v1/deals", () => {
  // Expected behavior:
  // - Returns 401 when no Authorization header is present
  // - Returns 200 with dealListResponseEnvelopeSchema on success
  // - Supports cursor, limit, pipelineId, stageId, ownerId query params

  it.todo("returns 401 without auth header");
  it.todo("returns 200 with paginated deal list");
  it.todo("filters by pipelineId");
  it.todo("filters by stageId");
  it.todo("supports cursor-based pagination");
});

describe.todo("POST /api/v1/deals", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 400 when body is missing required fields (name, pipelineId, stageId)
  // - Returns 201 with dealResponseEnvelopeSchema on success

  it.todo("returns 401 without auth header");
  it.todo("returns 400 when body is missing name");
  it.todo("returns 400 when body is missing pipelineId");
  it.todo("returns 400 when body is missing stageId");
  it.todo("returns 201 with created deal on success");
});

describe.todo("PATCH /api/v1/deals/:id", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 400 if :id is not a valid UUID
  // - Returns 404 if deal does not exist or is soft-deleted
  // - Returns 200 with updated deal on success
  // - Stage move: PATCH with { stageId } triggers transition logic

  it.todo("returns 401 without auth header");
  it.todo("returns 400 if id is not a valid UUID");
  it.todo("returns 404 if deal not found");
  it.todo("returns 200 with updated deal on success");
  it.todo("stage move — accepts valid stageId and triggers transition");
  it.todo("stage move — rejects stageId not belonging to the deal pipeline");
  it.todo("stage move — sets actual_close_date when moving to won/lost stage");
});

describe.todo("DELETE /api/v1/deals/:id", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 400 if :id is not a valid UUID
  // - Returns 404 if deal does not exist
  // - Returns 204 on successful soft delete

  it.todo("returns 401 without auth header");
  it.todo("returns 400 if id is not a valid UUID");
  it.todo("returns 404 if deal not found");
  it.todo("returns 204 on successful soft delete");
});

// ---------------------------------------------------------------------------
// UUID validation (used by PATCH and DELETE :id param)
// ---------------------------------------------------------------------------

describe("Deals API — :id parameter validation", () => {
  const uuidSchema = z.string().uuid();

  it("accepts a valid UUID v4", () => {
    const result = uuidSchema.safeParse(
      "c0a80121-0001-4000-8000-000000000001",
    );
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
