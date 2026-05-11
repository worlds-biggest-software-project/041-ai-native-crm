import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { activities } from "@/server/db/schema/activities";
import {
  authenticateApiRequest,
  unauthorized,
  notFound,
} from "@/server/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const { id } = await context.params;

    const [activity] = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.id, id),
          eq(activities.workspaceId, auth.workspaceId),
        ),
      );

    if (!activity) return notFound();

    return NextResponse.json(activity);
  } catch (error) {
    console.error("GET /api/v1/activities/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
