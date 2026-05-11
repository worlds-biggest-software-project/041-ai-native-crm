import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerTools(server: McpServer, workspaceId: string): void {
  void workspaceId;

  server.tool(
    "create_contact",
    {
      fullName: z.string(),
      email: z.string().optional(),
      companyName: z.string().optional(),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );

  server.tool(
    "update_contact",
    {
      contactId: z.string(),
      fields: z.record(z.string(), z.unknown()),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );

  server.tool(
    "create_deal",
    {
      name: z.string(),
      amount: z.number().optional(),
      pipelineId: z.string(),
      stageId: z.string(),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );

  server.tool(
    "update_deal_stage",
    {
      dealId: z.string(),
      stageId: z.string(),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );

  server.tool(
    "log_activity",
    {
      activityType: z.string(),
      subject: z.string().optional(),
      contactId: z.string().optional(),
      dealId: z.string().optional(),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );

  server.tool(
    "create_task",
    {
      title: z.string(),
      assigneeId: z.string().optional(),
      dueDate: z.string().optional(),
      contactId: z.string().optional(),
      dealId: z.string().optional(),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );

  server.tool(
    "search_crm",
    {
      query: z.string(),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );

  server.tool(
    "get_deal_health",
    {
      dealId: z.string(),
    },
    async (input) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ message: "TODO: implement", input }),
        },
      ],
    }),
  );
}
