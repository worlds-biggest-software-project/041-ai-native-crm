import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { companies } from "@/server/db/schema/companies";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
  notFound,
} from "@/server/lib/api-auth";
import { updateCompanySchema } from "@/server/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const { id } = await context.params;

    const [company] = await db
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.id, id),
          eq(companies.workspaceId, auth.workspaceId),
          isNull(companies.deletedAt),
        ),
      );

    if (!company) return notFound();

    return NextResponse.json(company);
  } catch (error) {
    console.error("GET /api/v1/companies/[id] error:", error);
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
    const parseResult = updateCompanySchema.omit({ id: true }).safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const [updated] = await db
      .update(companies)
      .set({
        ...parseResult.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(companies.id, id),
          eq(companies.workspaceId, auth.workspaceId),
          isNull(companies.deletedAt),
        ),
      )
      .returning();

    if (!updated) return notFound();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/companies/[id] error:", error);
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
      .update(companies)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(companies.id, id),
          eq(companies.workspaceId, auth.workspaceId),
          isNull(companies.deletedAt),
        ),
      )
      .returning();

    if (!deleted) return notFound();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/v1/companies/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
