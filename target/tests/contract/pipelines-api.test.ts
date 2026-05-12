/**
 * T034: Contract tests for REST API — Pipelines
 *
 * These tests define the EXPECTED contract for /api/v1/pipelines endpoints.
 * They validate request/response shapes, authentication requirements, and
 * input validation rules as specified in contracts/rest-api.md.
 *
 * Pipeline endpoints: GET list, POST create (admin only), PATCH update (admin only).
 * There is no DELETE endpoint for pipelines (restrict on delete in DB schema).
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

/** Stage definition within a pipeline (stored as JSONB array) */
const pipelineStageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  order: z.number().int().nonnegative(),
  type: z.enum(["open", "won", "lost"]).optional(),
});

/** Required fields for POST /api/v1/pipelines (admin only) */
const createPipelineSchema = z.object({
  name: z.string().min(1).max(255),
  isDefault: z.boolean().optional(),
  stages: z.array(pipelineStageSchema).min(1),
});

/** Partial update body for PATCH /api/v1/pipelines/:id (admin only) */
const updatePipelineSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isDefault: z.boolean().optional(),
  stages: z.array(pipelineStageSchema).min(1).optional(),
});

/** Standard success envelope for a single pipeline */
const pipelineResponseEnvelopeSchema = z.object({
  data: z
    .object({
      id: z.string().uuid(),
      workspaceId: z.string().uuid(),
      name: z.string(),
      isDefault: z.boolean(),
      stages: z.array(z.object({}).passthrough()),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .passthrough(),
});

/** Standard success envelope for pipeline list (not paginated — typically small set) */
const pipelineListResponseEnvelopeSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string().uuid(),
        name: z.string(),
      })
      .passthrough(),
  ),
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

describe("Pipelines API — request schema validation", () => {
  const validStage = {
    id: "c0a80121-0001-4000-8000-000000000001",
    name: "Qualification",
    order: 0,
    type: "open" as const,
  };

  it("createPipelineSchema requires name and at least one stage", () => {
    const missingAll = {};
    const result = createPipelineSchema.safeParse(missingAll);
    expect(result.success).toBe(false);
  });

  it("createPipelineSchema rejects missing stages", () => {
    const noStages = { name: "Sales Pipeline" };
    const result = createPipelineSchema.safeParse(noStages);
    expect(result.success).toBe(false);
  });

  it("createPipelineSchema rejects empty stages array", () => {
    const emptyStages = { name: "Sales Pipeline", stages: [] };
    const result = createPipelineSchema.safeParse(emptyStages);
    expect(result.success).toBe(false);
  });

  it("createPipelineSchema rejects missing name", () => {
    const noName = { stages: [validStage] };
    const result = createPipelineSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it("createPipelineSchema accepts a valid pipeline with stages", () => {
    const valid = {
      name: "Sales Pipeline",
      stages: [
        { ...validStage, order: 0 },
        {
          id: "c0a80121-0001-4000-8000-000000000002",
          name: "Proposal",
          order: 1,
          type: "open" as const,
        },
        {
          id: "c0a80121-0001-4000-8000-000000000003",
          name: "Closed Won",
          order: 2,
          type: "won" as const,
        },
        {
          id: "c0a80121-0001-4000-8000-000000000004",
          name: "Closed Lost",
          order: 3,
          type: "lost" as const,
        },
      ],
    };
    const result = createPipelineSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("createPipelineSchema rejects a stage with a non-UUID id", () => {
    const bad = {
      name: "Sales Pipeline",
      stages: [{ ...validStage, id: "not-a-uuid" }],
    };
    const result = createPipelineSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("createPipelineSchema rejects a stage with an empty name", () => {
    const bad = {
      name: "Sales Pipeline",
      stages: [{ ...validStage, name: "" }],
    };
    const result = createPipelineSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("pipelineStageSchema rejects an invalid type value", () => {
    const bad = { ...validStage, type: "closed" };
    const result = pipelineStageSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("updatePipelineSchema allows partial updates (name only)", () => {
    const partial = { name: "Renamed Pipeline" };
    const result = updatePipelineSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it("updatePipelineSchema allows partial updates (stages only)", () => {
    const partial = { stages: [validStage] };
    const result = updatePipelineSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it("updatePipelineSchema allows an empty body (no-op update)", () => {
    const result = updatePipelineSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("Pipelines API — response envelope schemas", () => {
  it("pipelineResponseEnvelopeSchema validates a single-pipeline response", () => {
    const response = {
      data: {
        id: "c0a80121-0001-4000-8000-000000000001",
        workspaceId: "c0a80121-0003-4000-8000-000000000001",
        name: "Sales Pipeline",
        isDefault: true,
        stages: [
          { id: "s1", name: "Qualification", order: 0, type: "open" },
          { id: "s2", name: "Closed Won", order: 1, type: "won" },
        ],
        createdAt: "2026-05-12T14:30:00Z",
        updatedAt: "2026-05-12T14:30:00Z",
      },
    };
    const result = pipelineResponseEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("pipelineListResponseEnvelopeSchema validates a pipeline list response", () => {
    const response = {
      data: [
        { id: "c0a80121-0001-4000-8000-000000000001", name: "Sales Pipeline" },
        {
          id: "c0a80121-0001-4000-8000-000000000002",
          name: "Partner Pipeline",
        },
      ],
    };
    const result = pipelineListResponseEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("errorEnvelopeSchema validates a forbidden error (non-admin)", () => {
    const response = {
      error: {
        code: "FORBIDDEN",
        message: "Admin access required",
      },
    };
    const result = errorEnvelopeSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// HTTP-level contract tests (require running server — stubbed as todo)
// ---------------------------------------------------------------------------

describe.todo("GET /api/v1/pipelines", () => {
  // Expected behavior:
  // - Returns 401 when no Authorization header is present
  // - Returns 200 with pipelineListResponseEnvelopeSchema on success
  // - Returns all pipelines for the workspace (not paginated)

  it.todo("returns 401 without auth header");
  it.todo("returns 200 with pipeline list");
  it.todo("returns only pipelines belonging to the authenticated workspace");
});

describe.todo("POST /api/v1/pipelines", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 403 if user is not admin
  // - Returns 400 when body is missing name or stages
  // - Returns 201 with pipelineResponseEnvelopeSchema on success

  it.todo("returns 401 without auth header");
  it.todo("returns 403 if user is not admin");
  it.todo("returns 400 when body is missing name");
  it.todo("returns 400 when body has empty stages array");
  it.todo("returns 201 with created pipeline on success");
});

describe.todo("PATCH /api/v1/pipelines/:id", () => {
  // Expected behavior:
  // - Returns 401 without auth header
  // - Returns 403 if user is not admin
  // - Returns 400 if :id is not a valid UUID
  // - Returns 404 if pipeline does not exist
  // - Returns 200 with updated pipeline on success

  it.todo("returns 401 without auth header");
  it.todo("returns 403 if user is not admin");
  it.todo("returns 400 if id is not a valid UUID");
  it.todo("returns 404 if pipeline not found");
  it.todo("returns 200 with updated pipeline on success");
});

// ---------------------------------------------------------------------------
// UUID validation (used by PATCH :id param)
// ---------------------------------------------------------------------------

describe("Pipelines API — :id parameter validation", () => {
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
});
