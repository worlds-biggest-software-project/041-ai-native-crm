import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { deals } from "@/server/db/schema/deals";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
  notFound,
} from "@/server/lib/api-auth";
import { updateDealSchema } from "@/server/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const { id } = await context.params;

    const [deal] = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.id, id),
          eq(deals.workspaceId, auth.workspaceId),
          isNull(deals.deletedAt),
        ),
      );

    if (!deal) return notFound();

    return NextResponse.json(deal);
  } catch (error) {
    console.error("GET /api/v1/deals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const { id } = await context.params;
    const body = await req.json();
    const parseResult = updateDealSchema.omit({ id: true }).safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    // If stageId is changing, update stageEnteredAt
    const updateData: Record<string, unknown> = {
      ...parseResult.data,
      updatedAt: new Date(),
    };
    if (parseResult.data.stageId) {
      updateData.stageEnteredAt = new Date();
    }

    const [updated] = await db
      .update(deals)
      .set(updateData)
      .where(
        and(
          eq(deals.id, id),
          eq(deals.workspaceId, auth.workspaceId),
          isNull(deals.deletedAt),
        ),
      )
      .returning();

    if (!updated) return notFound();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/deals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const { id } = await context.params;

    const [deleted] = await db
      .update(deals)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(deals.id, id),
          eq(deals.workspaceId, auth.workspaceId),
          isNull(deals.deletedAt),
        ),
      )
      .returning();

    if (!deleted) return notFound();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/v1/deals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
