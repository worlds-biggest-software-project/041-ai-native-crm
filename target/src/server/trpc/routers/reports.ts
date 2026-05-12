import { z } from "zod";
import { eq, and, isNull, sql, gte, count, sum } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { deals } from "@/server/db/schema/deals";
import { activities } from "@/server/db/schema/activities";
import { pipelines } from "@/server/db/schema/pipelines";

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  type: "open" | "won" | "lost";
}

export const reportsRouter = createRouter({
  pipelineSummary: protectedProcedure
    .input(
      z.object({
        pipelineId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Find the pipeline to get stage metadata
      const pipelineConditions = [eq(pipelines.workspaceId, ctx.workspaceId)];
      if (input.pipelineId) {
        pipelineConditions.push(eq(pipelines.id, input.pipelineId));
      }

      const [pipeline] = await ctx.db
        .select()
        .from(pipelines)
        .where(and(...pipelineConditions))
        .limit(1);

      if (!pipeline) {
        return {
          stages: [],
          totalDeals: 0,
          totalValue: 0,
          avgDealSize: 0,
        };
      }

      const stages = pipeline.stages as PipelineStage[];

      // Query deals grouped by stageId
      const dealConditions = [
        eq(deals.workspaceId, ctx.workspaceId),
        eq(deals.pipelineId, pipeline.id),
        isNull(deals.deletedAt),
      ];

      const stageStats = await ctx.db
        .select({
          stageId: deals.stageId,
          count: count(),
          totalAmount: sum(deals.amount),
        })
        .from(deals)
        .where(and(...dealConditions))
        .groupBy(deals.stageId);

      const stageMap = new Map(stageStats.map((s) => [s.stageId, s]));

      const stageResults = stages.map((stage) => {
        const stats = stageMap.get(stage.id);
        return {
          name: stage.name,
          count: stats ? Number(stats.count) : 0,
          totalAmount: stats?.totalAmount ? Number(stats.totalAmount) : 0,
        };
      });

      const totalDeals = stageResults.reduce((acc, s) => acc + s.count, 0);
      const totalValue = stageResults.reduce(
        (acc, s) => acc + s.totalAmount,
        0,
      );
      const avgDealSize =
        totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;

      return {
        stages: stageResults,
        totalDeals,
        totalValue,
        avgDealSize,
      };
    }),

  activityVolume: protectedProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const rows = await ctx.db
        .select({
          date: sql<string>`TO_CHAR(${activities.occurredAt}, 'YYYY-MM-DD')`,
          type: activities.activityType,
          count: count(),
        })
        .from(activities)
        .where(
          and(
            eq(activities.workspaceId, ctx.workspaceId),
            gte(activities.occurredAt, since),
          ),
        )
        .groupBy(
          sql`TO_CHAR(${activities.occurredAt}, 'YYYY-MM-DD')`,
          activities.activityType,
        )
        .orderBy(sql`TO_CHAR(${activities.occurredAt}, 'YYYY-MM-DD')`);

      return {
        data: rows.map((r) => ({
          date: r.date,
          count: Number(r.count),
          type: r.type,
        })),
      };
    }),

  staleDeals: protectedProcedure
    .input(
      z.object({
        staleDays: z.number().int().positive().default(14),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.staleDays);

      // Find all pipelines to determine won/lost stage IDs
      const workspacePipelines = await ctx.db
        .select()
        .from(pipelines)
        .where(eq(pipelines.workspaceId, ctx.workspaceId));

      const closedStageIds = new Set<string>();
      for (const p of workspacePipelines) {
        const stages = p.stages as PipelineStage[];
        for (const s of stages) {
          if (s.type === "won" || s.type === "lost") {
            closedStageIds.add(s.id);
          }
        }
      }

      const allStaleDeals = await ctx.db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.workspaceId, ctx.workspaceId),
            isNull(deals.deletedAt),
            sql`${deals.updatedAt} < ${cutoff}`,
          ),
        )
        .orderBy(deals.updatedAt);

      // Filter out closed stages in application code
      const filtered = allStaleDeals.filter(
        (d) => !closedStageIds.has(d.stageId),
      );

      return filtered;
    }),
});
