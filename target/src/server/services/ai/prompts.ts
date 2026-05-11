/**
 * T126: AI prompts for meeting summary generation.
 */

export interface MeetingContext {
  subject: string;
  occurredAt: Date;
  attendees: { name: string; email: string }[];
  dealName?: string;
  dealStage?: string;
  dealAmount?: number;
  recentEmails?: { subject: string; from: string; bodyPreview: string }[];
}

export interface MeetingSummaryOutput {
  summary: string;
  key_points: string[];
  action_items: {
    description: string;
    assignee?: string;
    due_date?: string;
  }[];
  sentiment: "positive" | "neutral" | "negative";
  topics: string[];
}

/**
 * Build a structured prompt context section from meeting data.
 */
export function buildMeetingContext(meeting: MeetingContext): string {
  const lines: string[] = [];

  lines.push("## Meeting Details");
  lines.push(`Subject: ${meeting.subject}`);
  lines.push(`Date: ${meeting.occurredAt.toISOString()}`);

  lines.push("");
  lines.push("## Attendees");
  for (const attendee of meeting.attendees) {
    lines.push(`- ${attendee.name} <${attendee.email}>`);
  }

  if (meeting.dealName || meeting.dealStage || meeting.dealAmount != null) {
    lines.push("");
    lines.push("## Deal Context");
    if (meeting.dealName) {
      lines.push(`Deal Name: ${meeting.dealName}`);
    }
    if (meeting.dealStage) {
      lines.push(`Stage: ${meeting.dealStage}`);
    }
    if (meeting.dealAmount != null) {
      lines.push(`Amount: $${meeting.dealAmount.toLocaleString()}`);
    }
  }

  if (meeting.recentEmails && meeting.recentEmails.length > 0) {
    lines.push("");
    lines.push("## Recent Email Threads");
    for (const email of meeting.recentEmails) {
      lines.push(`- Subject: ${email.subject}`);
      lines.push(`  From: ${email.from}`);
      lines.push(`  Preview: ${email.bodyPreview}`);
    }
  }

  return lines.join("\n");
}

/**
 * System prompt for Claude to generate structured meeting summaries.
 */
export const MEETING_SUMMARY_SYSTEM_PROMPT = `You are a CRM assistant that analyzes meeting notes and context to produce structured summaries.

Given meeting details, attendees, deal context, and recent email threads, generate a JSON object with the following structure:

{
  "summary": "A concise 2-3 sentence summary of the meeting.",
  "key_points": ["Array of key discussion points and decisions made."],
  "action_items": [
    {
      "description": "What needs to be done",
      "assignee": "Person responsible (optional)",
      "due_date": "YYYY-MM-DD format (optional)"
    }
  ],
  "sentiment": "positive" | "neutral" | "negative",
  "topics": ["Array of topics discussed"]
}

Rules:
- Return ONLY the JSON object, no markdown fences or additional text.
- The summary should capture the essence of the meeting concisely.
- Key points should be specific and actionable where possible.
- Action items should have clear descriptions. Include assignee and due_date only when inferable from context.
- Sentiment should reflect the overall tone of the meeting.
- Topics should be short labels categorizing discussion areas.`;

/**
 * Parse and validate a raw JSON string into MeetingSummaryOutput.
 * Provides defaults for missing optional fields.
 */
export function parseMeetingSummaryResponse(raw: string): MeetingSummaryOutput {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not a JSON object");
  }

  const obj = parsed as Record<string, unknown>;

  const summary = typeof obj["summary"] === "string" ? obj["summary"] : "";
  const keyPoints = Array.isArray(obj["key_points"])
    ? (obj["key_points"] as unknown[]).filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const actionItems = Array.isArray(obj["action_items"])
    ? (obj["action_items"] as unknown[]).map((item) => {
        const ai = item as Record<string, unknown>;
        return {
          description:
            typeof ai["description"] === "string" ? ai["description"] : "",
          assignee:
            typeof ai["assignee"] === "string" ? ai["assignee"] : undefined,
          due_date:
            typeof ai["due_date"] === "string" ? ai["due_date"] : undefined,
        };
      })
    : [];
  const sentiment = (
    ["positive", "neutral", "negative"] as const
  ).includes(obj["sentiment"] as "positive" | "neutral" | "negative")
    ? (obj["sentiment"] as "positive" | "neutral" | "negative")
    : "neutral";
  const topics = Array.isArray(obj["topics"])
    ? (obj["topics"] as unknown[]).filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  return {
    summary,
    key_points: keyPoints,
    action_items: actionItems,
    sentiment,
    topics,
  };
}
