/**
 * T127: Meeting summary service.
 *
 * Uses the Anthropic SDK to generate structured meeting summaries.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  type MeetingContext,
  type MeetingSummaryOutput,
  buildMeetingContext,
  MEETING_SUMMARY_SYSTEM_PROMPT,
  parseMeetingSummaryResponse,
} from "./prompts";

const MODEL_ID = "claude-sonnet-4-20250514";

/**
 * Generate a structured meeting summary from meeting context.
 */
export async function generateMeetingSummary(
  context: MeetingContext,
): Promise<MeetingSummaryOutput> {
  const client = new Anthropic();

  const userMessage = buildMeetingContext(context);

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 2048,
    system: MEETING_SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Anthropic response");
  }

  try {
    return parseMeetingSummaryResponse(textBlock.text);
  } catch (error) {
    throw new Error(
      `Failed to parse meeting summary response: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export { MODEL_ID };
