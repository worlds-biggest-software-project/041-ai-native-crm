import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, ilike, desc, asc, gt, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { contacts } from "@/server/db/schema/contacts";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
} from "@/server/lib/api-auth";
import {
  createContactSchema,
  listContactsSchema,
} from "@/server/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const url = req.nextUrl;
    const parseResult = listContactsSchema.safeParse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.has("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined,
      search: url.searchParams.get("search") ?? undefined,
      lifecycleStage: url.searchParams.get("lifecycleStage") ?? undefined,
      ownerId: url.searchParams.get("ownerId") ?? undefined,
      companyId: url.searchParams.get("companyId") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    });

    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const params = parseResult.data;

    const conditions = [
      eq(contacts.workspaceId, auth.workspaceId),
      isNull(contacts.deletedAt),
    ];

    if (params.search) {
      conditions.push(ilike(contacts.fullName, `%${params.search}%`));
    }
    if (params.lifecycleStage) {
      conditions.push(eq(contacts.lifecycleStage, params.lifecycleStage));
    }
    if (params.ownerId) {
      conditions.push(eq(contacts.ownerId, params.ownerId));
    }
    if (params.companyId) {
      conditions.push(eq(contacts.companyId, params.companyId));
    }

    const sortColumn =
      {
        fullName: contacts.fullName,
        email: contacts.email,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
        lastActivityAt: contacts.lastActivityAt,
        leadScore: contacts.leadScore,
      }[params.sortBy] ?? contacts.createdAt;

    const orderFn = params.sortOrder === "asc" ? asc : desc;

    if (params.cursor) {
      const cursorOp = params.sortOrder === "asc" ? gt : lt;
      conditions.push(cursorOp(contacts.id, params.cursor));
    }

    const rows = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn), asc(contacts.id))
      .limit(params.limit + 1);

    const hasMore = rows.length > params.limit;
    const data = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return NextResponse.json({ data, nextCursor });
  } catch (error) {
    console.error("GET /api/v1/contacts error:", error);
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
    const parseResult = createContactSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const [created] = await db
      .insert(contacts)
      .values({
        ...parseResult.data,
        workspaceId: auth.workspaceId,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/contacts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
