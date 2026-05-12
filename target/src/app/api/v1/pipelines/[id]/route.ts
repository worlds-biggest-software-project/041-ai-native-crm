import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { pipelines } from "@/server/db/schema/pipelines";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
  notFound,
} from "@/server/lib/api-auth";
import { z } from "zod";

const updatePipelineSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isDefault: z.boolean().optional(),
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
    .optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const { id } = await context.params;

    const [pipeline] = await db
      .select()
      .from(pipelines)
      .where(
        and(eq(pipelines.id, id), eq(pipelines.workspaceId, auth.workspaceId)),
      );

    if (!pipeline) return notFound();

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error("GET /api/v1/pipelines/[id] error:", error);
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
    const parseResult = updatePipelineSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const [updated] = await db
      .update(pipelines)
      .set({
        ...parseResult.data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(pipelines.id, id), eq(pipelines.workspaceId, auth.workspaceId)),
      )
      .returning();

    if (!updated) return notFound();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/pipelines/[id] error:", error);
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
      .delete(pipelines)
      .where(
        and(eq(pipelines.id, id), eq(pipelines.workspaceId, auth.workspaceId)),
      )
      .returning();

    if (!deleted) return notFound();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/v1/pipelines/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
