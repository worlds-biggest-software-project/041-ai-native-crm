import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { webhooks } from "@/server/db/schema/webhooks";
import { webhookQueue } from "@/server/lib/queue";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function dispatchWebhooks(
  workspaceId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  const activeWebhooks = await db
    .select()
    .from(webhooks)
    .where(
      and(eq(webhooks.workspaceId, workspaceId), eq(webhooks.isActive, true)),
    );

  const matchingWebhooks = activeWebhooks.filter((wh) => {
    const events = wh.events;
    return events != null && events.includes(event);
  });

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(payload);

  for (const webhook of matchingWebhooks) {
    const signature = signPayload(payloadString, webhook.secret);

    await webhookQueue.add(
      "webhook-delivery",
      {
        url: webhook.url,
        payload: payloadString,
        signature,
        webhookId: webhook.id,
      },
      {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    );
  }
}
