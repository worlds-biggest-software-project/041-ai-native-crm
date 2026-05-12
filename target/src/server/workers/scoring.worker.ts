/**
 * T146: BullMQ worker for the "scoring" queue.
 *
 * Processes deal health and lead scoring jobs triggered by activity changes,
 * manual rescores, or batch operations.
 */

import { Worker, type Job } from "bullmq";
import { redis } from "@/server/lib/redis";
import { scoringQueue } from "@/server/lib/queue";
import { db } from "@/server/db";
import { deals } from "@/server/db/schema/deals";
import { contacts } from "@/server/db/schema/contacts";
import { eq, isNull } from "drizzle-orm";
import { scoreDeal, scoreLead } from "@/server/services/scoring/pipeline";

// ---------------------------------------------------------------------------
// Job data types
// ---------------------------------------------------------------------------

interface ScoreDealJobData {
  type: "score-deal";
  dealId: string;
  workspaceId: string;
}

interface ScoreLeadJobData {
  type: "score-lead";
  contactId: string;
  workspaceId: string;
}

interface BatchRescoreJobData {
  type: "batch-rescore";
  workspaceId: string;
  entityType: "deal" | "contact";
}

type ScoringJobData = ScoreDealJobData | ScoreLeadJobData | BatchRescoreJobData;

// ---------------------------------------------------------------------------
// Worker process function
// ---------------------------------------------------------------------------

async function processScoringJob(job: Job<ScoringJobData>) {
  const data = job.data;

  console.log(`[ScoringWorker] Processing job ${job.id} type=${data.type}`);

  switch (data.type) {
    case "score-deal": {
      await scoreDeal(data.dealId, data.workspaceId);
      console.log(
        `[ScoringWorker] Scored deal ${data.dealId} in workspace ${data.workspaceId}`,
      );
      break;
    }

    case "score-lead": {
      await scoreLead(data.contactId, data.workspaceId);
      console.log(
        `[ScoringWorker] Scored lead ${data.contactId} in workspace ${data.workspaceId}`,
      );
      break;
    }

    case "batch-rescore": {
      if (data.entityType === "deal") {
        const allDeals = await db
          .select({ id: deals.id })
          .from(deals)
          .where(eq(deals.workspaceId, data.workspaceId));

        for (const deal of allDeals) {
          await scoringQueue.add("score-deal", {
            type: "score-deal" as const,
            dealId: deal.id,
            workspaceId: data.workspaceId,
          });
        }

        console.log(
          `[ScoringWorker] Enqueued ${allDeals.length} deal rescore jobs for workspace ${data.workspaceId}`,
        );
      } else {
        const allContacts = await db
          .select({ id: contacts.id })
          .from(contacts)
          .where(eq(contacts.workspaceId, data.workspaceId));

        for (const contact of allContacts) {
          await scoringQueue.add("score-lead", {
            type: "score-lead" as const,
            contactId: contact.id,
            workspaceId: data.workspaceId,
          });
        }

        console.log(
          `[ScoringWorker] Enqueued ${allContacts.length} lead rescore jobs for workspace ${data.workspaceId}`,
        );
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Worker instance
// ---------------------------------------------------------------------------

export const scoringWorker = new Worker<ScoringJobData>(
  "scoring",
  processScoringJob,
  {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 20,
      duration: 1000,
    },
  },
);

scoringWorker.on("completed", (job) => {
  console.log(`[ScoringWorker] Job ${job.id} completed`);
});

scoringWorker.on("failed", (job, error) => {
  console.error(`[ScoringWorker] Job ${job?.id} failed:`, error.message);
});

// Suppress unused import warnings — used by pipeline functions
void db;
void isNull;
