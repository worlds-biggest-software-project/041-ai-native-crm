import {
  ResourceTemplate,
  type McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerResources(server: McpServer, workspaceId: string): void {
  void workspaceId;

  server.resource("contacts-list", "crm://contacts", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ message: "TODO: implement DB query" }),
      },
    ],
  }));

  server.resource(
    "contact-detail",
    new ResourceTemplate("crm://contacts/{id}", { list: undefined }),
    async (uri, variables) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({
            message: "TODO: implement DB query",
            contactId: variables.id,
          }),
        },
      ],
    }),
  );

  server.resource("deals-list", "crm://deals", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ message: "TODO: implement DB query" }),
      },
    ],
  }));

  server.resource(
    "deal-detail",
    new ResourceTemplate("crm://deals/{id}", { list: undefined }),
    async (uri, variables) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({
            message: "TODO: implement DB query",
            dealId: variables.id,
          }),
        },
      ],
    }),
  );

  server.resource(
    "company-detail",
    new ResourceTemplate("crm://companies/{id}", { list: undefined }),
    async (uri, variables) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({
            message: "TODO: implement DB query",
            companyId: variables.id,
          }),
        },
      ],
    }),
  );

  server.resource("activities-list", "crm://activities", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ message: "TODO: implement DB query" }),
      },
    ],
  }));
}
