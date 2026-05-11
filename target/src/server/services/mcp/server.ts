import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface McpServerOptions {
  workspaceId: string;
}

export function createMcpServer(options: McpServerOptions): McpServer {
  const server = new McpServer({
    name: "ai-native-crm",
    version: "1.0.0",
  });

  // Resources, tools, and prompts are registered by separate modules
  // The workspaceId is passed through to each registration function
  void options;

  return server;
}
