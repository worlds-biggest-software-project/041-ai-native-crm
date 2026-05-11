import { emailSyncQueue, calendarSyncQueue } from "@/server/lib/queue";
import { db } from "@/server/db";
import { oauthConnections } from "@/server/db/schema/oauth-connections";
import { eq, and, lt } from "drizzle-orm";
import { decrypt, encrypt } from "@/server/lib/encryption";

// Import and start workers
import { emailSyncWorker } from "./email-sync.worker";
import { calendarSyncWorker } from "./calendar-sync.worker";

/**
 * T104 & T105: Worker bootstrap entry point.
 *
 * - Starts all background workers (email-sync, calendar-sync)
 * - Registers repeatable jobs for periodic sync
 * - Registers a token refresh job (T105) that checks for expiring tokens
 * - Handles graceful shutdown on SIGTERM/SIGINT
 */
async function registerRepeatableJobs() {
  // Email sync every 5 minutes
  await emailSyncQueue.add(
    "scheduled-email-sync",
    { provider: "gmail" },
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: "repeatable-email-sync-gmail",
    },
  );

  await emailSyncQueue.add(
    "scheduled-email-sync",
    { provider: "outlook" },
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: "repeatable-email-sync-outlook",
    },
  );

  // Calendar sync every 15 minutes
  await calendarSyncQueue.add(
    "scheduled-calendar-sync",
    { provider: "google_calendar" },
    {
      repeat: { every: 15 * 60 * 1000 },
      jobId: "repeatable-calendar-sync-google",
    },
  );

  await calendarSyncQueue.add(
    "scheduled-calendar-sync",
    { provider: "outlook_calendar" },
    {
      repeat: { every: 15 * 60 * 1000 },
      jobId: "repeatable-calendar-sync-outlook",
    },
  );

  // T105: Token refresh job — every 5 minutes, check for tokens expiring within 10 minutes
  await emailSyncQueue.add(
    "token-refresh",
    { provider: "gmail" },
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: "repeatable-token-refresh",
    },
  );

  console.log("[Workers] Repeatable jobs registered");
}

/**
 * T105: Token refresh logic.
 *
 * Finds all active OAuth connections whose tokens expire within 10 minutes
 * and refreshes them.
 */
async function refreshExpiringTokens() {
  const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

  const expiringConnections = await db
    .select()
    .from(oauthConnections)
    .where(
      and(
        eq(oauthConnections.isActive, true),
        lt(oauthConnections.tokenExpiresAt, tenMinutesFromNow),
      ),
    );

  for (const connection of expiringConnections) {
    try {
      if (!connection.refreshToken) {
        console.warn(
          `[TokenRefresh] No refresh token for connection ${connection.id}`,
        );
        continue;
      }

      const refreshToken = decrypt(connection.refreshToken);

      // TODO: Call the appropriate provider's token refresh endpoint
      // For Gmail / Google Calendar:
      //   POST https://oauth2.googleapis.com/token
      //   { client_id, client_secret, refresh_token, grant_type: "refresh_token" }
      //
      // For Outlook / Outlook Calendar:
      //   POST https://login.microsoftonline.com/common/oauth2/v2.0/token
      //   { client_id, client_secret, refresh_token, grant_type: "refresh_token" }

      console.log(
        `[TokenRefresh] Would refresh token for connection ${connection.id} (provider=${connection.provider})`,
      );

      // TODO: Once refresh is implemented, encrypt and persist new tokens:
      // const newAccessToken = encrypt(response.access_token);
      // await db.update(oauthConnections).set({
      //   accessToken: newAccessToken,
      //   tokenExpiresAt: new Date(Date.now() + response.expires_in * 1000),
      //   updatedAt: new Date(),
      // }).where(eq(oauthConnections.id, connection.id));

      void refreshToken; // Suppress unused variable warning until refresh is implemented
    } catch (error) {
      console.error(
        `[TokenRefresh] Failed to refresh connection ${connection.id}:`,
        error,
      );
    }
  }
}

/**
 * Graceful shutdown handler — close all workers and allow in-progress
 * jobs to finish before exiting.
 */
async function gracefulShutdown(signal: string) {
  console.log(`[Workers] Received ${signal}, shutting down gracefully...`);

  try {
    await Promise.all([
      emailSyncWorker.close(),
      calendarSyncWorker.close(),
    ]);
    console.log("[Workers] All workers closed");
  } catch (error) {
    console.error("[Workers] Error during shutdown:", error);
  }

  process.exit(0);
}

// Register shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Bootstrap
console.log("[Workers] Starting email-sync and calendar-sync workers...");
registerRepeatableJobs().catch((error) => {
  console.error("[Workers] Failed to register repeatable jobs:", error);
});

// Export for external use
export { emailSyncWorker, calendarSyncWorker, refreshExpiringTokens };

// Suppress unused import warnings — these are used for their side effects
void encrypt;
void db;
