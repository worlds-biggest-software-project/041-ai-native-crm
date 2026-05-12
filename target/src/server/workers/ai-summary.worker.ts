/**
 * T130: AI summary worker.
 *
 * BullMQ worker that processes the "ai-summary" queue to generate
 * meeting summaries and create follow-up tasks.
 */

import { Worker, type Job } from "bullmq";
import { redis } from "@/server/lib/redis";
import { db } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { activities } from "@/server/db/schema/activities";
import { deals } from "@/server/db/schema/deals";
import { contacts } from "@/server/db/schema/contacts";
import { aiSummaries } from "@/server/db/schema/ai-summaries";
import { tasks } from "@/server/db/schema/tasks";
import {
  generateMeetingSummary,
  MODEL_ID,
} from "@/server/services/ai/meeting-summary";
import type { MeetingContext } from "@/server/services/ai/prompts";

interface AiSummaryJobData {
  activityId: string;
  workspaceId: string;
}

async function processAiSummary(job: Job<AiSummaryJobData>) {
  const { activityId, workspaceId } = job.data;

  console.log(
    `[AiSummaryWorker] Processing job ${job.id} for activity=${activityId}`,
  );

  // Load the activity
  const [activity] = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, workspaceId),
      ),
    );

  if (!activity) {
    console.warn(
      `[AiSummaryWorker] Activity ${activityId} not found in workspace ${workspaceId}`,
    );
    return;
  }

  // Load related deal context if available
  let dealContext:
    | { name: string; stageId: string; amount: number | null }
    | undefined;
  if (activity.dealId) {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, activity.dealId));

    if (deal) {
      dealContext = {
        name: deal.name,
        stageId: deal.stageId,
        amount: deal.amount,
      };
    }
  }

  // Load contact info if available
  const attendees: { name: string; email: string }[] = [];
  if (activity.contactId) {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, activity.contactId));

    if (contact) {
      attendees.push({
        name: contact.fullName,
        email: contact.email ?? "",
      });
    }
  }

  // Build meeting context
  const meetingContext: MeetingContext = {
    subject: activity.subject ?? "Untitled Meeting",
    occurredAt: activity.occurredAt,
    attendees,
    dealName: dealContext?.name,
    dealStage: dealContext?.stageId,
    dealAmount: dealContext?.amount ?? undefined,
  };

  // Generate the summary
  const summaryResult = await generateMeetingSummary(meetingContext);

  // Store the summary
  await db.insert(aiSummaries).values({
    workspaceId,
    activityId,
    summaryType: "meeting",
    content: summaryResult,
    modelId: MODEL_ID,
  });

  // Create task records from action items
  for (const actionItem of summaryResult.action_items) {
    await db.insert(tasks).values({
      workspaceId,
      title: actionItem.description,
      dueAt: actionItem.due_date ? new Date(actionItem.due_date) : undefined,
      dealId: activity.dealId ?? undefined,
      contactId: activity.contactId ?? undefined,
      isAiGenerated: true,
    });
  }

  console.log(
    `[AiSummaryWorker] Generated summary for activity ${activityId} with ${summaryResult.action_items.length} action items`,
  );
}

export const aiSummaryWorker = new Worker<AiSummaryJobData>(
  "ai-summary",
  processAiSummary,
  {
    connection: redis,
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000,
    },
  },
);

aiSummaryWorker.on("completed", (job) => {
  console.log(`[AiSummaryWorker] Job ${job.id} completed`);
});

aiSummaryWorker.on("failed", (job, error) => {
  console.error(`[AiSummaryWorker] Job ${job?.id} failed:`, error.message);
});
