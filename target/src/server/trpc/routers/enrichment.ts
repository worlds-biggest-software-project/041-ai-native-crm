/**
 * T161: Enrichment tRPC router
 *
 * Provides procedures for queueing enrichment jobs, querying enrichment logs,
 * and reviewing (accepting/rejecting) pending enrichment results.
 */

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, adminProcedure, createRouter } from "../init";
import { enrichmentLogs } from "@/server/db/schema/enrichment";
import { enrichmentQueue } from "@/server/lib/queue";

export const enrichmentRouter = createRouter({
  /**
   * Enqueue an enrichment job for the given entity.
   */
  enrich: protectedProcedure
    .input(
      z.object({
        entityType: z.string().min(1).max(50),
        entityId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enrichmentQueue.add("enrich", {
        entityType: input.entityType,
        entityId: input.entityId,
        workspaceId: ctx.workspaceId,
      });

      return { queued: true };
    }),

  /**
   * Get enrichment logs for a specific entity.
   */
  getLog: protectedProcedure
    .input(
      z.object({
        entityType: z.string().min(1).max(50),
        entityId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db
        .select()
        .from(enrichmentLogs)
        .where(
          and(
            eq(enrichmentLogs.workspaceId, ctx.workspaceId),
            eq(enrichmentLogs.entityType, input.entityType),
            eq(enrichmentLogs.entityId, input.entityId),
          ),
        );

      return logs;
    }),

  /**
   * Review a pending enrichment log — accept or reject.
   *
   * - Accept: apply the enriched changes to the entity record.
   * - Reject: mark the enrichment log as rejected.
   */
  reviewEnrichment: adminProcedure
    .input(
      z.object({
        logId: z.string().uuid(),
        action: z.enum(["accept", "reject"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [log] = await ctx.db
        .select()
        .from(enrichmentLogs)
        .where(
          and(
            eq(enrichmentLogs.id, input.logId),
            eq(enrichmentLogs.workspaceId, ctx.workspaceId),
          ),
        );

      if (!log) {
        return { success: false, reason: "Enrichment log not found" };
      }

      if (input.action === "accept") {
        // TODO: Apply the changes from log.changes to the actual entity record
        // based on log.entityType and log.entityId.
        const [updated] = await ctx.db
          .update(enrichmentLogs)
          .set({
            status: "applied",
            reviewedBy: ctx.session.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(enrichmentLogs.id, input.logId))
          .returning();

        return { success: true, log: updated };
      } else {
        const [updated] = await ctx.db
          .update(enrichmentLogs)
          .set({
            status: "rejected",
            reviewedBy: ctx.session.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(enrichmentLogs.id, input.logId))
          .returning();

        return { success: true, log: updated };
      }
    }),
});
