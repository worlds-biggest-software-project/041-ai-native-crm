/**
 * T148: Scoring tRPC router — exposes deal health and lead scoring queries
 * and a mutation to enqueue re-scoring jobs.
 */

import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, createRouter } from "../init";
import { scoreHistory } from "@/server/db/schema/scoring";
import { scoringQueue } from "@/server/lib/queue";

export const scoringRouter = createRouter({
  getDealHealth: protectedProcedure
    .input(z.object({ dealId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [latest] = await ctx.db
        .select()
        .from(scoreHistory)
        .where(
          and(
            eq(scoreHistory.entityType, "deal"),
            eq(scoreHistory.entityId, input.dealId),
            eq(scoreHistory.workspaceId, ctx.workspaceId),
          ),
        )
        .orderBy(desc(scoreHistory.computedAt))
        .limit(1);

      return latest ?? null;
    }),

  getLeadScore: protectedProcedure
    .input(z.object({ contactId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [latest] = await ctx.db
        .select()
        .from(scoreHistory)
        .where(
          and(
            eq(scoreHistory.entityType, "contact"),
            eq(scoreHistory.entityId, input.contactId),
            eq(scoreHistory.workspaceId, ctx.workspaceId),
          ),
        )
        .orderBy(desc(scoreHistory.computedAt))
        .limit(1);

      return latest ?? null;
    }),

  rescore: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["deal", "contact"]),
        entityId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.entityType === "deal") {
        await scoringQueue.add("score-deal", {
          type: "score-deal" as const,
          dealId: input.entityId,
          workspaceId: ctx.workspaceId,
        });
      } else {
        await scoringQueue.add("score-lead", {
          type: "score-lead" as const,
          contactId: input.entityId,
          workspaceId: ctx.workspaceId,
        });
      }

      return { queued: true };
    }),
});
