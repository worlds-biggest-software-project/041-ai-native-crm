import { z } from "zod";
import { eq, and, isNull, asc, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, createRouter } from "../init";
import { deals } from "@/server/db/schema/deals";
import { pipelines } from "@/server/db/schema/pipelines";
import {
  createDealSchema,
  updateDealSchema,
  listDealsSchema,
  uuidSchema,
} from "@/server/lib/validators";
import { writeAuditLog } from "@/server/lib/audit";

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  type: "open" | "won" | "lost";
}

function findStage(stages: PipelineStage[], stageId: string) {
  return stages.find((s) => s.id === stageId);
}

export const dealsRouter = createRouter({
  list: protectedProcedure.input(listDealsSchema).query(async ({ ctx, input }) => {
    const conditions = [
      eq(deals.workspaceId, ctx.workspaceId),
      isNull(deals.deletedAt),
    ];

    if (input.pipelineId) conditions.push(eq(deals.pipelineId, input.pipelineId));
    if (input.stageId) conditions.push(eq(deals.stageId, input.stageId));
    if (input.ownerId) conditions.push(eq(deals.ownerId, input.ownerId));

    const sortColumn = {
      name: deals.name,
      amount: deals.amount,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      expectedCloseDate: deals.expectedCloseDate,
      healthScore: deals.healthScore,
    }[input.sortBy];

    const orderFn = input.sortOrder === "asc" ? asc : desc;

    const items = await ctx.db
      .select()
      .from(deals)
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
      const [deal] = await ctx.db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.id, input),
            eq(deals.workspaceId, ctx.workspaceId),
            isNull(deals.deletedAt),
          ),
        );

      return deal ?? null;
    }),

  create: protectedProcedure
    .input(createDealSchema)
    .mutation(async ({ ctx, input }) => {
      const [pipeline] = await ctx.db
        .select()
        .from(pipelines)
        .where(
          and(
            eq(pipelines.id, input.pipelineId),
            eq(pipelines.workspaceId, ctx.workspaceId),
          ),
        );

      if (!pipeline) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pipeline not found" });
      }

      const stages = pipeline.stages as PipelineStage[];
      const stage = findStage(stages, input.stageId);
      if (!stage) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid stage for this pipeline" });
      }

      const [deal] = await ctx.db
        .insert(deals)
        .values({
          ...input,
          workspaceId: ctx.workspaceId,
          stageEnteredAt: new Date(),
          actualCloseDate:
            stage.type === "won" || stage.type === "lost"
              ? new Date().toISOString().slice(0, 10)
              : null,
        })
        .returning();

      await writeAuditLog({
        workspaceId: ctx.workspaceId,
        userId: ctx.session.user.id,
        action: "deal.created",
        entityType: "deal",
        entityId: deal!.id,
      });

      return deal!;
    }),

  update: protectedProcedure
    .input(updateDealSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(deals)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(deals.id, id),
            eq(deals.workspaceId, ctx.workspaceId),
            isNull(deals.deletedAt),
          ),
        )
        .returning();

      if (updated) {
        await writeAuditLog({
          workspaceId: ctx.workspaceId,
          userId: ctx.session.user.id,
          action: "deal.updated",
          entityType: "deal",
          entityId: id,
        });
      }

      return updated ?? null;
    }),

  delete: protectedProcedure
    .input(uuidSchema)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(deals)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(deals.id, input),
            eq(deals.workspaceId, ctx.workspaceId),
            isNull(deals.deletedAt),
          ),
        )
        .returning();

      if (deleted) {
        await writeAuditLog({
          workspaceId: ctx.workspaceId,
          userId: ctx.session.user.id,
          action: "deal.deleted",
          entityType: "deal",
          entityId: input,
        });
      }

      return { success: !!deleted };
    }),

  moveStage: protectedProcedure
    .input(z.object({ id: uuidSchema, stageId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const [deal] = await ctx.db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.id, input.id),
            eq(deals.workspaceId, ctx.workspaceId),
            isNull(deals.deletedAt),
          ),
        );

      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const [pipeline] = await ctx.db
        .select()
        .from(pipelines)
        .where(eq(pipelines.id, deal.pipelineId));

      if (!pipeline) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pipeline not found" });
      }

      const stages = pipeline.stages as PipelineStage[];
      const oldStage = findStage(stages, deal.stageId);
      const newStage = findStage(stages, input.stageId);

      if (!newStage) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target stage" });
      }

      const isClosing = newStage.type === "won" || newStage.type === "lost";

      const [updated] = await ctx.db
        .update(deals)
        .set({
          stageId: input.stageId,
          stageEnteredAt: new Date(),
          actualCloseDate: isClosing ? new Date().toISOString().slice(0, 10) : deal.actualCloseDate,
          updatedAt: new Date(),
        })
        .where(eq(deals.id, input.id))
        .returning();

      await writeAuditLog({
        workspaceId: ctx.workspaceId,
        userId: ctx.session.user.id,
        action: "deal.stage_changed",
        entityType: "deal",
        entityId: input.id,
        changes: {
          stageId: {
            old: deal.stageId,
            new: input.stageId,
          },
          stageName: {
            old: oldStage?.name ?? "unknown",
            new: newStage.name,
          },
        },
      });

      return updated;
    }),
});
