import { Worker, type Job } from "bullmq";
import { redis } from "@/server/lib/redis";
import { decrypt } from "@/server/lib/encryption";
import { db } from "@/server/db";
import { oauthConnections } from "@/server/db/schema/oauth-connections";
import { eq, and } from "drizzle-orm";

interface EmailSyncJobData {
  provider: "gmail" | "outlook";
  historyId?: string;
  emailAddress?: string;
  subscriptionId?: string;
  userId?: string;
  resource?: string;
  changeType?: string;
  messageId?: string;
}

/**
 * T102: BullMQ worker for the "email-sync" queue.
 *
 * Processes email synchronization jobs triggered by webhooks
 * or repeatable scheduled jobs.
 */
async function processEmailSync(job: Job<EmailSyncJobData>) {
  const { provider, userId } = job.data;

  console.log(`[EmailSyncWorker] Processing job ${job.id} for provider=${provider}`);

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
    console.warn(`[EmailSyncWorker] No active connection found for provider=${provider}`);
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
        // - Call provider's token refresh endpoint with connection.refreshToken
        // - Update the oauth_connection record with new tokens
        console.log(`[EmailSyncWorker] Token expired for connection ${connection.id}, needs refresh`);
        continue;
      }

      // Determine sync mode based on sync_config
      const syncConfig = connection.syncConfig as Record<string, unknown>;
      const hasLastHistoryId = !!syncConfig?.lastHistoryId;

      // Dispatch to the appropriate sync service
      if (provider === "gmail") {
        if (hasLastHistoryId) {
          // TODO: Implement GmailSyncService.incrementalSync(accessToken, syncConfig)
          console.log(`[EmailSyncWorker] Gmail incremental sync for connection ${connection.id}`);
        } else {
          // TODO: Implement GmailSyncService.initialSync(accessToken)
          console.log(`[EmailSyncWorker] Gmail initial sync for connection ${connection.id}`);
        }
      } else if (provider === "outlook") {
        if (hasLastHistoryId) {
          // TODO: Implement OutlookSyncService.incrementalSync(accessToken, syncConfig)
          console.log(`[EmailSyncWorker] Outlook incremental sync for connection ${connection.id}`);
        } else {
          // TODO: Implement OutlookSyncService.initialSync(accessToken)
          console.log(`[EmailSyncWorker] Outlook initial sync for connection ${connection.id}`);
        }
      }

      // TODO: Update sync_config with new sync cursor
      // await db.update(oauthConnections).set({
      //   syncConfig: { ...syncConfig, lastHistoryId: newCursor, lastSyncAt: new Date().toISOString() },
      //   updatedAt: new Date(),
      // }).where(eq(oauthConnections.id, connection.id));

      void accessToken; // Suppress unused variable warning until sync services are implemented
    } catch (error) {
      console.error(
        `[EmailSyncWorker] Error syncing connection ${connection.id}:`,
        error,
      );
    }
  }
}

export const emailSyncWorker = new Worker<EmailSyncJobData>(
  "email-sync",
  processEmailSync,
  {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

emailSyncWorker.on("completed", (job) => {
  console.log(`[EmailSyncWorker] Job ${job.id} completed`);
});

emailSyncWorker.on("failed", (job, error) => {
  console.error(`[EmailSyncWorker] Job ${job?.id} failed:`, error.message);
});
