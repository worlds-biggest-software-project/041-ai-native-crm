import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { activities } from "@/server/db/schema/activities";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
} from "@/server/lib/api-auth";
import { timelineSchema, createActivitySchema } from "@/server/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const url = req.nextUrl;
    const parseResult = timelineSchema.safeParse({
      contactId: url.searchParams.get("contactId") ?? undefined,
      companyId: url.searchParams.get("companyId") ?? undefined,
      dealId: url.searchParams.get("dealId") ?? undefined,
      activityType: url.searchParams.get("activityType") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.has("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined,
    });

    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const params = parseResult.data;

    const conditions = [eq(activities.workspaceId, auth.workspaceId)];

    if (params.contactId) {
      conditions.push(eq(activities.contactId, params.contactId));
    }
    if (params.companyId) {
      conditions.push(eq(activities.companyId, params.companyId));
    }
    if (params.dealId) {
      conditions.push(eq(activities.dealId, params.dealId));
    }
    if (params.activityType) {
      conditions.push(eq(activities.activityType, params.activityType));
    }
    if (params.cursor) {
      conditions.push(lt(activities.id, params.cursor));
    }

    const rows = await db
      .select()
      .from(activities)
      .where(and(...conditions))
      .orderBy(desc(activities.occurredAt))
      .limit(params.limit + 1);

    const hasMore = rows.length > params.limit;
    const data = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return NextResponse.json({ data, nextCursor });
  } catch (error) {
    console.error("GET /api/v1/activities error:", error);
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
    const parseResult = createActivitySchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const { occurredAt, ...rest } = parseResult.data;
    const [created] = await db
      .insert(activities)
      .values({
        ...rest,
        occurredAt: occurredAt ? new Date(occurredAt) : undefined,
        workspaceId: auth.workspaceId,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/activities error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
