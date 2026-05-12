import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, asc, gt, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { pipelines } from "@/server/db/schema/pipelines";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
} from "@/server/lib/api-auth";
import { z } from "zod";
import {
  cursorPaginationSchema,
  sortOrderSchema,
} from "@/server/lib/validators";

const listPipelinesSchema = cursorPaginationSchema.extend({
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

const createPipelineSchema = z.object({
  name: z.string().min(1).max(255),
  isDefault: z.boolean().default(false),
  stages: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255),
        order: z.number().int().nonnegative(),
        probability: z.number().int().min(0).max(100),
        type: z.enum(["open", "won", "lost"]),
      }),
    )
    .default([]),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const url = req.nextUrl;
    const parseResult = listPipelinesSchema.safeParse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.has("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    });

    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const params = parseResult.data;

    const conditions = [eq(pipelines.workspaceId, auth.workspaceId)];

    const sortColumn =
      {
        name: pipelines.name,
        createdAt: pipelines.createdAt,
        updatedAt: pipelines.updatedAt,
      }[params.sortBy] ?? pipelines.createdAt;

    const orderFn = params.sortOrder === "asc" ? asc : desc;

    if (params.cursor) {
      const cursorOp = params.sortOrder === "asc" ? gt : lt;
      conditions.push(cursorOp(pipelines.id, params.cursor));
    }

    const rows = await db
      .select()
      .from(pipelines)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn), asc(pipelines.id))
      .limit(params.limit + 1);

    const hasMore = rows.length > params.limit;
    const data = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return NextResponse.json({ data, nextCursor });
  } catch (error) {
    console.error("GET /api/v1/pipelines error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parseResult = createPipelineSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const [created] = await db
      .insert(pipelines)
      .values({
        ...parseResult.data,
        workspaceId: auth.workspaceId,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/pipelines error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
