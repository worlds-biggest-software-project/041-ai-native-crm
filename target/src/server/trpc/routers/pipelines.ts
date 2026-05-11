import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, adminProcedure, createRouter } from "../init";
import { pipelines } from "@/server/db/schema/pipelines";
import { uuidSchema, pipelineStageSchema } from "@/server/lib/validators";

const DEFAULT_STAGES = [
  { name: "Qualification", order: 0, probability: 10, type: "open" as const },
  { name: "Discovery", order: 1, probability: 25, type: "open" as const },
  { name: "Proposal", order: 2, probability: 50, type: "open" as const },
  { name: "Negotiation", order: 3, probability: 75, type: "open" as const },
  { name: "Closed Won", order: 4, probability: 100, type: "won" as const },
  { name: "Closed Lost", order: 5, probability: 0, type: "lost" as const },
];

export const pipelinesRouter = createRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(pipelines)
      .where(eq(pipelines.workspaceId, ctx.workspaceId));
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        stages: z.array(pipelineStageSchema).min(1),
        isDefault: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isDefault) {
        await ctx.db
          .update(pipelines)
          .set({ isDefault: false })
          .where(
            and(
              eq(pipelines.workspaceId, ctx.workspaceId),
              eq(pipelines.isDefault, true),
            ),
          );
      }

      const [pipeline] = await ctx.db
        .insert(pipelines)
        .values({
          workspaceId: ctx.workspaceId,
          name: input.name,
          stages: input.stages,
          isDefault: input.isDefault,
        })
        .returning();

      return pipeline;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: uuidSchema,
        name: z.string().min(1).max(255).optional(),
        stages: z.array(pipelineStageSchema).min(1).optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      if (data.isDefault) {
        await ctx.db
          .update(pipelines)
          .set({ isDefault: false })
          .where(
            and(
              eq(pipelines.workspaceId, ctx.workspaceId),
              eq(pipelines.isDefault, true),
            ),
          );
      }

      const [updated] = await ctx.db
        .update(pipelines)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(pipelines.id, id),
            eq(pipelines.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      return updated ?? null;
    }),

  seedDefault: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db
      .select()
      .from(pipelines)
      .where(eq(pipelines.workspaceId, ctx.workspaceId))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const stagesWithIds = DEFAULT_STAGES.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
    }));

    const [pipeline] = await ctx.db
      .insert(pipelines)
      .values({
        workspaceId: ctx.workspaceId,
        name: "Default Pipeline",
        isDefault: true,
        stages: stagesWithIds,
      })
      .returning();

    return pipeline;
  }),
});
