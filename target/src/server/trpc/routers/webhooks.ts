import crypto from "crypto";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { adminProcedure, createRouter } from "../init";
import { webhooks } from "@/server/db/schema/webhooks";

export const webhooksRouter = createRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(webhooks)
      .where(eq(webhooks.workspaceId, ctx.workspaceId));
  }),

  create: adminProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.string().min(1)),
        secret: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const secret = input.secret ?? crypto.randomBytes(32).toString("hex");

      const [webhook] = await ctx.db
        .insert(webhooks)
        .values({
          workspaceId: ctx.workspaceId,
          url: input.url,
          events: input.events,
          secret,
        })
        .returning();

      return webhook!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        url: z.string().url().optional(),
        events: z.array(z.string().min(1)).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(webhooks)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(webhooks.id, id), eq(webhooks.workspaceId, ctx.workspaceId)),
        )
        .returning();

      return updated ?? null;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(webhooks)
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      return { success: !!deleted };
    }),
});
