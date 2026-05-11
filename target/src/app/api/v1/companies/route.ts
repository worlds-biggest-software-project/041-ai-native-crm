import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, ilike, desc, asc, gt, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { companies } from "@/server/db/schema/companies";
import {
  authenticateApiRequest,
  unauthorized,
  badRequest,
} from "@/server/lib/api-auth";
import {
  createCompanySchema,
  listCompaniesSchema,
} from "@/server/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateApiRequest(req);
    if (!auth) return unauthorized();

    const url = req.nextUrl;
    const parseResult = listCompaniesSchema.safeParse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.has("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined,
      search: url.searchParams.get("search") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    });

    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const params = parseResult.data;

    const conditions = [
      eq(companies.workspaceId, auth.workspaceId),
      isNull(companies.deletedAt),
    ];

    if (params.search) {
      conditions.push(ilike(companies.name, `%${params.search}%`));
    }

    const sortColumn = {
      name: companies.name,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
      lastActivityAt: companies.lastActivityAt,
    }[params.sortBy] ?? companies.createdAt;

    const orderFn = params.sortOrder === "asc" ? asc : desc;

    if (params.cursor) {
      const cursorOp = params.sortOrder === "asc" ? gt : lt;
      conditions.push(cursorOp(companies.id, params.cursor));
    }

    const rows = await db
      .select()
      .from(companies)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn), asc(companies.id))
      .limit(params.limit + 1);

    const hasMore = rows.length > params.limit;
    const data = hasMore ? rows.slice(0, params.limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return NextResponse.json({ data, nextCursor });
  } catch (error) {
    console.error("GET /api/v1/companies error:", error);
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
    const parseResult = createCompanySchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(parseResult.error.message);
    }

    const [created] = await db
      .insert(companies)
      .values({
        ...parseResult.data,
        workspaceId: auth.workspaceId,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/companies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
