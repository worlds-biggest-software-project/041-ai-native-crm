import { Worker, type Job } from "bullmq";
import { redis } from "@/server/lib/redis";
import { decrypt } from "@/server/lib/encryption";
import { db } from "@/server/db";
import { oauthConnections } from "@/server/db/schema/oauth-connections";
import { eq, and } from "drizzle-orm";

interface CalendarSyncJobData {
  provider: "google_calendar" | "outlook_calendar";
  userId?: string;
  subscriptionId?: string;
  resource?: string;
  changeType?: string;
}

/**
 * T103: BullMQ worker for the "calendar-sync" queue.
 *
 * Processes calendar synchronization jobs triggered by webhooks
 * or repeatable scheduled jobs.
 */
async function processCalendarSync(job: Job<CalendarSyncJobData>) {
  const { provider, userId } = job.data;

  console.log(
    `[CalendarSyncWorker] Processing job ${job.id} for provider=${provider}`,
  );

  // Load the OAuth connection for the job's user/provider
  const conditions = [eq(oauthConnections.isActive, true)];

  if (userId) {
    conditions.push(eq(oauthConnections.userId, userId));
  }
  conditions.push(eq(oauthConnections.provider, provider));

  const connections = await db
    .select()
    .from(oauthConnections)
    .where(and(...conditions));

  if (connections.length === 0) {
    console.warn(
      `[CalendarSyncWorker] No active connection found for provider=${provider}`,
    );
    return;
  }

  for (const connection of connections) {
    try {
      // Decrypt the access token
      const accessToken = decrypt(connection.accessToken);

      // Check token expiry and refresh if needed
      const now = new Date();
      if (connection.tokenExpiresAt && connection.tokenExpiresAt < now) {
        // TODO: Implement token refresh logic
        console.log(
          `[CalendarSyncWorker] Token expired for connection ${connection.id}, needs refresh`,
        );
        continue;
      }

      // Determine sync mode based on sync_config
      const syncConfig = connection.syncConfig as Record<string, unknown>;
      const hasSyncToken = !!syncConfig?.syncToken;

      // Dispatch to the appropriate sync service
      if (provider === "google_calendar") {
        if (hasSyncToken) {
          // TODO: Implement GoogleCalendarSyncService.incrementalSync(accessToken, syncConfig)
          console.log(
            `[CalendarSyncWorker] Google Calendar incremental sync for connection ${connection.id}`,
          );
        } else {
          // TODO: Implement GoogleCalendarSyncService.initialSync(accessToken)
          console.log(
            `[CalendarSyncWorker] Google Calendar initial sync for connection ${connection.id}`,
          );
        }
      } else if (provider === "outlook_calendar") {
        if (hasSyncToken) {
          // TODO: Implement OutlookCalendarSyncService.incrementalSync(accessToken, syncConfig)
          console.log(
            `[CalendarSyncWorker] Outlook Calendar incremental sync for connection ${connection.id}`,
          );
        } else {
          // TODO: Implement OutlookCalendarSyncService.initialSync(accessToken)
          console.log(
            `[CalendarSyncWorker] Outlook Calendar initial sync for connection ${connection.id}`,
          );
        }
      }

      // TODO: Update sync_config with new sync cursor
      // await db.update(oauthConnections).set({
      //   syncConfig: { ...syncConfig, syncToken: newToken, lastSyncAt: new Date().toISOString() },
      //   updatedAt: new Date(),
      // }).where(eq(oauthConnections.id, connection.id));

      void accessToken; // Suppress unused variable warning until sync services are implemented
    } catch (error) {
      console.error(
        `[CalendarSyncWorker] Error syncing connection ${connection.id}:`,
        error,
      );
    }
  }
}

export const calendarSyncWorker = new Worker<CalendarSyncJobData>(
  "calendar-sync",
  processCalendarSync,
  {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

calendarSyncWorker.on("completed", (job) => {
  console.log(`[CalendarSyncWorker] Job ${job.id} completed`);
});

calendarSyncWorker.on("failed", (job, error) => {
  console.error(`[CalendarSyncWorker] Job ${job?.id} failed:`, error.message);
});

// TODO: After creating a meeting activity for a past event, enqueue ai-summary job
// e.g. await aiSummaryQueue.add("generate-summary", { activityId, workspaceId });
