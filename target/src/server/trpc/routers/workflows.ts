import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { adminProcedure, createRouter } from "../init";
import {
  workflows,
  workflowExecutions,
} from "@/server/db/schema/workflows";

const workflowDefinitionSchema = z.object({
  trigger: z.object({
    event: z.string().min(1),
    conditions: z.record(z.string(), z.unknown()).optional(),
  }),
  steps: z.array(
    z.object({
      type: z.string().min(1),
      config: z.record(z.string(), z.unknown()),
    }),
  ),
});

export const workflowsRouter = createRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(workflows)
      .where(eq(workflows.workspaceId, ctx.workspaceId));
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        definition: workflowDefinitionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [workflow] = await ctx.db
        .insert(workflows)
        .values({
          workspaceId: ctx.workspaceId,
          name: input.name,
          definition: input.definition,
        })
        .returning();

      return workflow!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        definition: workflowDefinitionSchema.optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(workflows)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(workflows.id, id),
            eq(workflows.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      return updated ?? null;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(workflows)
        .where(
          and(
            eq(workflows.id, input.id),
            eq(workflows.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      return { success: !!deleted };
    }),

  getExecutions: adminProcedure
    .input(z.object({ workflowId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // First verify the workflow belongs to this workspace
      const [workflow] = await ctx.db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.workspaceId, ctx.workspaceId),
          ),
        );

      if (!workflow) {
        return [];
      }

      return ctx.db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, input.workflowId));
    }),
});
