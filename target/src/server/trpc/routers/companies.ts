import { eq, and, isNull, ilike, asc, desc } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { companies } from "@/server/db/schema/companies";
import {
  createCompanySchema,
  updateCompanySchema,
  listCompaniesSchema,
  uuidSchema,
} from "@/server/lib/validators";
import { writeAuditLog } from "@/server/lib/audit";

export const companiesRouter = createRouter({
  list: protectedProcedure.input(listCompaniesSchema).query(async ({ ctx, input }) => {
    const conditions = [
      eq(companies.workspaceId, ctx.workspaceId),
      isNull(companies.deletedAt),
    ];

    if (input.search) {
      conditions.push(ilike(companies.name, `%${input.search}%`));
    }

    const sortColumn = {
      name: companies.name,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
      lastActivityAt: companies.lastActivityAt,
    }[input.sortBy];

    const orderFn = input.sortOrder === "asc" ? asc : desc;

    const items = await ctx.db
      .select()
      .from(companies)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(input.limit + 1);

    const hasMore = items.length > input.limit;
    if (hasMore) items.pop();

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }),

  getById: protectedProcedure
    .input(uuidSchema)
    .query(async ({ ctx, input }) => {
      const [company] = await ctx.db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.id, input),
            eq(companies.workspaceId, ctx.workspaceId),
            isNull(companies.deletedAt),
          ),
        );

      return company ?? null;
    }),

  create: protectedProcedure
    .input(createCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const [company] = await ctx.db
        .insert(companies)
        .values({
          ...input,
          workspaceId: ctx.workspaceId,
        })
        .returning();

      await writeAuditLog({
        workspaceId: ctx.workspaceId,
        userId: ctx.session.user.id,
        action: "company.created",
        entityType: "company",
        entityId: company!.id,
      });

      // TODO: Enqueue enrichment job after company creation
      return company!;
    }),

  update: protectedProcedure
    .input(updateCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(companies)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(companies.id, id),
            eq(companies.workspaceId, ctx.workspaceId),
            isNull(companies.deletedAt),
          ),
        )
        .returning();

      if (updated) {
        await writeAuditLog({
          workspaceId: ctx.workspaceId,
          userId: ctx.session.user.id,
          action: "company.updated",
          entityType: "company",
          entityId: id,
        });
      }

      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(uuidSchema)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(companies)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(companies.id, input),
            eq(companies.workspaceId, ctx.workspaceId),
            isNull(companies.deletedAt),
          ),
        )
        .returning();

      if (deleted) {
        await writeAuditLog({
          workspaceId: ctx.workspaceId,
          userId: ctx.session.user.id,
          action: "company.deleted",
          entityType: "company",
          entityId: input,
        });
      }

      return { success: !!deleted };
    }),
});
