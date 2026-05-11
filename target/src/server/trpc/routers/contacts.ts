import { eq, and, isNull, ilike, or, asc, desc } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { contacts } from "@/server/db/schema/contacts";
import {
  createContactSchema,
  updateContactSchema,
  listContactsSchema,
  uuidSchema,
} from "@/server/lib/validators";
import { writeAuditLog } from "@/server/lib/audit";

export const contactsRouter = createRouter({
  list: protectedProcedure.input(listContactsSchema).query(async ({ ctx, input }) => {
    const conditions = [
      eq(contacts.workspaceId, ctx.workspaceId),
      isNull(contacts.deletedAt),
    ];

    if (input.lifecycleStage) {
      conditions.push(eq(contacts.lifecycleStage, input.lifecycleStage));
    }
    if (input.ownerId) {
      conditions.push(eq(contacts.ownerId, input.ownerId));
    }
    if (input.companyId) {
      conditions.push(eq(contacts.companyId, input.companyId));
    }
    if (input.search) {
      conditions.push(
        or(
          ilike(contacts.fullName, `%${input.search}%`),
          ilike(contacts.email, `%${input.search}%`),
        )!,
      );
    }
    if (input.cursor) {
      conditions.push(eq(contacts.id, input.cursor));
    }

    const sortColumn = {
      fullName: contacts.fullName,
      email: contacts.email,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
      lastActivityAt: contacts.lastActivityAt,
      leadScore: contacts.leadScore,
    }[input.sortBy];

    const orderFn = input.sortOrder === "asc" ? asc : desc;

    const items = await ctx.db
      .select()
      .from(contacts)
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
      const [contact] = await ctx.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input),
            eq(contacts.workspaceId, ctx.workspaceId),
            isNull(contacts.deletedAt),
          ),
        );

      return contact ?? null;
    }),

  create: protectedProcedure
    .input(createContactSchema)
    .mutation(async ({ ctx, input }) => {
      const [contact] = await ctx.db
        .insert(contacts)
        .values({
          ...input,
          workspaceId: ctx.workspaceId,
        })
        .returning();

      await writeAuditLog({
        workspaceId: ctx.workspaceId,
        userId: ctx.session.user.id,
        action: "contact.created",
        entityType: "contact",
        entityId: contact!.id,
      });

      return contact!;
    }),

  update: protectedProcedure
    .input(updateContactSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(contacts)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(contacts.id, id),
            eq(contacts.workspaceId, ctx.workspaceId),
            isNull(contacts.deletedAt),
          ),
        )
        .returning();

      if (updated) {
        await writeAuditLog({
          workspaceId: ctx.workspaceId,
          userId: ctx.session.user.id,
          action: "contact.updated",
          entityType: "contact",
          entityId: id,
        });
      }

      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(uuidSchema)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(contacts)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(contacts.id, input),
            eq(contacts.workspaceId, ctx.workspaceId),
            isNull(contacts.deletedAt),
          ),
        )
        .returning();

      if (deleted) {
        await writeAuditLog({
          workspaceId: ctx.workspaceId,
          userId: ctx.session.user.id,
          action: "contact.deleted",
          entityType: "contact",
          entityId: input,
        });
      }

      return { success: !!deleted };
    }),
});
