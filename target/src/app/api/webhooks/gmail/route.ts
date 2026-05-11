import { NextRequest, NextResponse } from "next/server";
import { emailSyncQueue } from "@/server/lib/queue";

/**
 * T100: Gmail push notification webhook.
 *
 * Google Cloud Pub/Sub sends a POST with a base64-encoded message
 * containing the user's emailAddress and a historyId indicating
 * what changed since the last known state.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // The Pub/Sub wrapper has { message: { data: "base64...", messageId, ... }, subscription }
    const message = body?.message;
    if (!message?.data) {
      return NextResponse.json(
        { error: "Missing Pub/Sub message data" },
        { status: 400 },
      );
    }

    const decoded = JSON.parse(
      Buffer.from(message.data, "base64").toString("utf-8"),
    );

    const { historyId, emailAddress } = decoded;

    if (!historyId || !emailAddress) {
      return NextResponse.json(
        { error: "Missing historyId or emailAddress" },
        { status: 400 },
      );
    }

    await emailSyncQueue.add("gmail-push", {
      provider: "gmail",
      historyId,
      emailAddress,
      messageId: message.messageId,
    });

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[Gmail Webhook] Error processing notification:", error);
    // Return 200 to prevent Pub/Sub retries on malformed payloads
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
