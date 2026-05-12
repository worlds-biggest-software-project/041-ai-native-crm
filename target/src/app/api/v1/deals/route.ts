import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, desc, asc, gt, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { deals } from "@/server/db/schema/deals";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
} from "@/server/lib/api-auth";
import { createDealSchema, listDealsSchema } from "@/server/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const url = req.nextUrl;
    const parseResult = listDealsSchema.safeParse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.has("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined,
      pipelineId: url.searchParams.get("pipelineId") ?? undefined,
      stageId: url.searchParams.get("stageId") ?? undefined,
      ownerId: url.searchParams.get("ownerId") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    });

    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const params = parseResult.data;

    const conditions = [
      eq(deals.workspaceId, auth.workspaceId),
      isNull(deals.deletedAt),
    ];

    if (params.pipelineId) {
      conditions.push(eq(deals.pipelineId, params.pipelineId));
    }
    if (params.stageId) {
      conditions.push(eq(deals.stageId, params.stageId));
    }
    if (params.ownerId) {
      conditions.push(eq(deals.ownerId, params.ownerId));
    }

    const sortColumn =
      {
        name: deals.name,
        amount: deals.amount,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        expectedCloseDate: deals.expectedCloseDate,
        healthScore: deals.healthScore,
      }[params.sortBy] ?? deals.createdAt;

    const orderFn = params.sortOrder === "asc" ? asc : desc;

    if (params.cursor) {
      const cursorOp = params.sortOrder === "asc" ? gt : lt;
      conditions.push(cursorOp(deals.id, params.cursor));
    }

    const rows = await db
      .select()
      .from(deals)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn), asc(deals.id))
      .limit(params.limit + 1);

    const hasMore = rows.length > params.limit;
    const data = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return NextResponse.json({ data, nextCursor });
  } catch (error) {
    console.error("GET /api/v1/deals error:", error);
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
    const parseResult = createDealSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const [created] = await db
      .insert(deals)
      .values({
        ...parseResult.data,
        workspaceId: auth.workspaceId,
        stageEnteredAt: new Date(),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/deals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
