/**
 * T129: Follow-up draft service.
 *
 * Generates professional follow-up email drafts based on meeting summaries.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { MeetingSummaryOutput } from "./prompts";

export interface FollowUpContext {
  meetingSummary: MeetingSummaryOutput;
  recipientName: string;
  recipientEmail: string;
  dealName?: string;
  senderName: string;
}

const MODEL_ID = "claude-sonnet-4-20250514";

const FOLLOW_UP_SYSTEM_PROMPT = `You are a professional email composer for a CRM system. Generate a follow-up email based on a meeting summary.

The email should:
- Have a clear, professional subject line
- Reference key discussion points from the meeting
- List any action items and next steps
- Be warm but professional in tone
- Be concise (under 300 words for the body)

Return a JSON object with exactly these fields:
{
  "subject": "Email subject line",
  "bodyText": "Plain text version of the email body",
  "bodyHtml": "HTML version of the email body with basic formatting (<p>, <ul>, <li>, <strong>)"
}

Return ONLY the JSON object, no markdown fences or additional text.`;

function buildFollowUpPrompt(context: FollowUpContext): string {
  const lines: string[] = [];

  lines.push("## Meeting Summary");
  lines.push(context.meetingSummary.summary);

  lines.push("");
  lines.push("## Key Points");
  for (const point of context.meetingSummary.key_points) {
    lines.push(`- ${point}`);
  }

  if (context.meetingSummary.action_items.length > 0) {
    lines.push("");
    lines.push("## Action Items");
    for (const item of context.meetingSummary.action_items) {
      let line = `- ${item.description}`;
      if (item.assignee) line += ` (Assignee: ${item.assignee})`;
      if (item.due_date) line += ` (Due: ${item.due_date})`;
      lines.push(line);
    }
  }

  lines.push("");
  lines.push("## Email Details");
  lines.push(`Recipient: ${context.recipientName} <${context.recipientEmail}>`);
  lines.push(`Sender: ${context.senderName}`);
  if (context.dealName) {
    lines.push(`Deal: ${context.dealName}`);
  }

  return lines.join("\n");
}

/**
 * Generate a follow-up email draft based on a meeting summary.
 */
export async function generateFollowUpDraft(
  context: FollowUpContext,
): Promise<{ subject: string; bodyText: string; bodyHtml: string }> {
  const client = new Anthropic();

  const userMessage = buildFollowUpPrompt(context);

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 2048,
    system: FOLLOW_UP_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Anthropic response");
  }

  try {
    const parsed: unknown = JSON.parse(textBlock.text);

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Response is not a JSON object");
    }

    const obj = parsed as Record<string, unknown>;

    return {
      subject: typeof obj["subject"] === "string" ? obj["subject"] : "",
      bodyText: typeof obj["bodyText"] === "string" ? obj["bodyText"] : "",
      bodyHtml: typeof obj["bodyHtml"] === "string" ? obj["bodyHtml"] : "",
    };
  } catch (error) {
    throw new Error(
      `Failed to parse follow-up draft response: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
