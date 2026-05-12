import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer, workspaceId: string): void {
  void workspaceId;

  server.prompt(
    "meeting_prep",
    { contactId: z.string(), dealId: z.string().optional() },
    async (_args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: "TODO: implement meeting prep prompt",
          },
        },
      ],
    }),
  );

  server.prompt("deal_summary", { dealId: z.string() }, async (_args) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: "TODO: implement deal summary prompt",
        },
      },
    ],
  }));

  server.prompt(
    "follow_up_draft",
    { activityId: z.string() },
    async (_args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: "TODO: implement follow-up draft prompt",
          },
        },
      ],
    }),
  );

  server.prompt("pipeline_review", async () => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: "TODO: implement pipeline review prompt",
        },
      },
    ],
  }));
}
