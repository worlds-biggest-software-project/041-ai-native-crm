import { NextRequest, NextResponse } from "next/server";
import { emailSyncQueue } from "@/server/lib/queue";

/**
 * T101: Microsoft Graph change notification webhook.
 *
 * Handles two scenarios:
 * 1. Subscription validation: Microsoft sends a GET (or POST with validationToken
 *    query param) that must be echoed back as plain text.
 * 2. Change notifications: Microsoft sends a POST with notification payloads
 *    that trigger incremental sync.
 */
export async function GET(request: NextRequest) {
  const validationToken = request.nextUrl.searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    { error: "Missing validationToken" },
    { status: 400 },
  );
}

export async function POST(request: NextRequest) {
  // Microsoft may also send validation via POST with query param
  const validationToken = request.nextUrl.searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    const body = await request.json();
    const notifications = body?.value;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return NextResponse.json(
        { error: "No notifications in payload" },
        { status: 400 },
      );
    }

    for (const notification of notifications) {
      const { subscriptionId, resource, changeType } = notification;

      await emailSyncQueue.add("outlook-push", {
        provider: "outlook",
        subscriptionId,
        resource,
        changeType,
      });
    }

    return new NextResponse(null, { status: 202 });
  } catch (error) {
    console.error("[Outlook Webhook] Error processing notification:", error);
    return new NextResponse(null, { status: 202 });
  }
}
