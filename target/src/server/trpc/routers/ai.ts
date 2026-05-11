/**
 * T131: AI tRPC router.
 *
 * Provides procedures for AI-generated meeting summaries and follow-up drafts.
 */

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, createRouter } from "../init";
import { aiSummaries } from "@/server/db/schema/ai-summaries";
import { aiFollowUps } from "@/server/db/schema/ai-follow-ups";
import { activities } from "@/server/db/schema/activities";
import { contacts } from "@/server/db/schema/contacts";
import { deals } from "@/server/db/schema/deals";
import { uuidSchema } from "@/server/lib/validators";
import { aiSummaryQueue } from "@/server/lib/queue";
import { generateFollowUpDraft } from "@/server/services/ai/follow-up-draft";
import type { MeetingSummaryOutput } from "@/server/services/ai/prompts";

const MODEL_ID = "claude-sonnet-4-20250514";

export const aiRouter = createRouter({
  getSummary: protectedProcedure
    .input(z.object({ activityId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      const [summary] = await ctx.db
        .select()
        .from(aiSummaries)
        .where(
          and(
            eq(aiSummaries.activityId, input.activityId),
            eq(aiSummaries.workspaceId, ctx.workspaceId),
          ),
        );

      return summary ?? null;
    }),

  generateSummary: protectedProcedure
    .input(z.object({ activityId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      // Verify the activity exists in the workspace
      const [activity] = await ctx.db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.id, input.activityId),
            eq(activities.workspaceId, ctx.workspaceId),
          ),
        );

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      await aiSummaryQueue.add("generate-summary", {
        activityId: input.activityId,
        workspaceId: ctx.workspaceId,
      });

      return { queued: true };
    }),

  reviewSummary: protectedProcedure
    .input(z.object({ summaryId: uuidSchema, approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(aiSummaries)
        .set({
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(aiSummaries.id, input.summaryId),
            eq(aiSummaries.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Summary not found",
        });
      }

      return updated;
    }),

  getFollowUp: protectedProcedure
    .input(z.object({ activityId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      const followUps = await ctx.db
        .select()
        .from(aiFollowUps)
        .where(
          and(
            eq(aiFollowUps.activityId, input.activityId),
            eq(aiFollowUps.workspaceId, ctx.workspaceId),
          ),
        );

      return followUps;
    }),

  generateFollowUp: protectedProcedure
    .input(z.object({ activityId: uuidSchema, contactId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      // Load the activity
      const [activity] = await ctx.db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.id, input.activityId),
            eq(activities.workspaceId, ctx.workspaceId),
          ),
        );

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      // Load the contact
      const [contact] = await ctx.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input.contactId),
            eq(contacts.workspaceId, ctx.workspaceId),
          ),
        );

      if (!contact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      // Load the existing summary
      const [summary] = await ctx.db
        .select()
        .from(aiSummaries)
        .where(
          and(
            eq(aiSummaries.activityId, input.activityId),
            eq(aiSummaries.workspaceId, ctx.workspaceId),
          ),
        );

      if (!summary) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Generate a meeting summary before creating a follow-up",
        });
      }

      // Load deal name if applicable
      let dealName: string | undefined;
      if (activity.dealId) {
        const [deal] = await ctx.db
          .select()
          .from(deals)
          .where(eq(deals.id, activity.dealId));
        dealName = deal?.name;
      }

      const meetingSummary = summary.content as unknown as MeetingSummaryOutput;

      const draft = await generateFollowUpDraft({
        meetingSummary,
        recipientName: contact.fullName,
        recipientEmail: contact.email ?? "",
        dealName,
        senderName: ctx.session.user.name ?? "CRM User",
      });

      const [followUp] = await ctx.db
        .insert(aiFollowUps)
        .values({
          workspaceId: ctx.workspaceId,
          activityId: input.activityId,
          contactId: input.contactId,
          dealId: activity.dealId ?? undefined,
          subject: draft.subject,
          bodyText: draft.bodyText,
          bodyHtml: draft.bodyHtml,
          modelId: MODEL_ID,
        })
        .returning();

      return followUp!;
    }),

  sendFollowUp: protectedProcedure
    .input(z.object({ followUpId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(aiFollowUps)
        .set({
          status: "sent",
          sentAt: new Date(),
          sentBy: ctx.session.user.id,
        })
        .where(
          and(
            eq(aiFollowUps.id, input.followUpId),
            eq(aiFollowUps.workspaceId, ctx.workspaceId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Follow-up not found",
        });
      }

      return updated;
    }),
});
