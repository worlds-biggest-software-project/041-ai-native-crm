/**
 * T128: Entity extraction service.
 *
 * Extracts contact names, company names, and emails from free text
 * using the Anthropic SDK.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedEntity {
  type: "contact" | "company";
  name: string;
  email?: string;
  confidence: number;
}

const MODEL_ID = "claude-sonnet-4-20250514";

const ENTITY_EXTRACTION_SYSTEM_PROMPT = `You are an entity extraction assistant for a CRM system. Given a block of text, identify and extract:

1. Contact names (people)
2. Company/organization names
3. Email addresses (associate with the relevant contact if possible)

Return a JSON array of extracted entities. Each entity should have:
- "type": "contact" or "company"
- "name": the extracted name
- "email": email address if found (optional, only for contacts)
- "confidence": a number between 0 and 1 indicating extraction confidence

Return ONLY the JSON array, no markdown fences or additional text.
If no entities are found, return an empty array: []`;

/**
 * Extract entities (contacts, companies) from free text.
 */
export async function extractEntities(
  text: string,
): Promise<ExtractedEntity[]> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 1024,
    system: ENTITY_EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Anthropic response");
  }

  try {
    const parsed: unknown = JSON.parse(textBlock.text);

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not a JSON array");
    }

    return (parsed as unknown[]).map((item) => {
      const entity = item as Record<string, unknown>;
      return {
        type: entity["type"] === "company" ? "company" : "contact",
        name: typeof entity["name"] === "string" ? entity["name"] : "",
        email:
          typeof entity["email"] === "string" ? entity["email"] : undefined,
        confidence:
          typeof entity["confidence"] === "number" ? entity["confidence"] : 0.5,
      } satisfies ExtractedEntity;
    });
  } catch (error) {
    throw new Error(
      `Failed to parse entity extraction response: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
