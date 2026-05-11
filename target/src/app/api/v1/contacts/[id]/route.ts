import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { contacts } from "@/server/db/schema/contacts";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
  notFound,
} from "@/server/lib/api-auth";
import { updateContactSchema } from "@/server/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const { id } = await context.params;

    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.workspaceId, auth.workspaceId),
          isNull(contacts.deletedAt),
        ),
      );

    if (!contact) return notFound();

    return NextResponse.json(contact);
  } catch (error) {
    console.error("GET /api/v1/contacts/[id] error:", error);
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
    const parseResult = updateContactSchema.omit({ id: true }).safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const [updated] = await db
      .update(contacts)
      .set({
        ...parseResult.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.workspaceId, auth.workspaceId),
          isNull(contacts.deletedAt),
        ),
      )
      .returning();

    if (!updated) return notFound();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/contacts/[id] error:", error);
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
      .update(contacts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.workspaceId, auth.workspaceId),
          isNull(contacts.deletedAt),
        ),
      )
      .returning();

    if (!deleted) return notFound();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/v1/contacts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
