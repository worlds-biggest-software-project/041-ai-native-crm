import { Worker, type Job } from "bullmq";
import { redis } from "@/server/lib/redis";

interface WebhookJobData {
  url: string;
  payload: string;
  signature: string;
  webhookId: string;
}

/**
 * T170: BullMQ worker for the "webhook" queue.
 *
 * Delivers webhook payloads to registered URLs with HMAC-SHA256 signatures.
 * Retries on 5xx errors with exponential backoff; 4xx errors are not retried.
 */
async function processWebhookDelivery(job: Job<WebhookJobData>) {
  const { url, payload, signature, webhookId } = job.data;

  console.log(
    `[WebhookWorker] Delivering webhook ${webhookId} to ${url} (job ${job.id})`,
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": `sha256=${signature}`,
    },
    body: payload,
  });

  if (response.status >= 500) {
    throw new Error(
      `[WebhookWorker] Server error ${String(response.status)} from ${url} — will retry`,
    );
  }

  if (response.status >= 200 && response.status < 300) {
    console.log(
      `[WebhookWorker] Successfully delivered webhook ${webhookId} to ${url} (${String(response.status)})`,
    );
    return;
  }

  // 4xx — log failure but don't retry
  console.warn(
    `[WebhookWorker] Client error ${String(response.status)} from ${url} for webhook ${webhookId} — not retrying`,
  );
}

export const webhookWorker = new Worker<WebhookJobData>(
  "webhook",
  processWebhookDelivery,
  {
    connection: redis,
    concurrency: 10,
    limiter: {
      max: 20,
      duration: 1000,
    },
  },
);

webhookWorker.on("completed", (job) => {
  console.log(`[WebhookWorker] Job ${job.id} completed`);
});

webhookWorker.on("failed", (job, error) => {
  console.error(`[WebhookWorker] Job ${job?.id} failed:`, error.message);
});
