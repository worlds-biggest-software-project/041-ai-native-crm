import { createMcpServer } from "@/server/services/mcp/server";
import { registerResources } from "@/server/services/mcp/resources";
import { registerTools } from "@/server/services/mcp/tools";
import { registerPrompts } from "@/server/services/mcp/prompts";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

const API_SECRET = process.env.API_SECRET ?? "";

function authenticateRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length);
  const separatorIndex = token.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  const workspaceId = token.slice(0, separatorIndex);
  const secret = token.slice(separatorIndex + 1);

  if (!workspaceId || !secret || secret !== API_SECRET) {
    return null;
  }

  return workspaceId;
}

export async function GET(request: Request): Promise<Response> {
  const workspaceId = authenticateRequest(request);
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const mcpServer = createMcpServer({ workspaceId });
  registerResources(mcpServer, workspaceId);
  registerTools(mcpServer, workspaceId);
  registerPrompts(mcpServer, workspaceId);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await mcpServer.connect(transport);

  return transport.handleRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  const workspaceId = authenticateRequest(request);
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const mcpServer = createMcpServer({ workspaceId });
  registerResources(mcpServer, workspaceId);
  registerTools(mcpServer, workspaceId);
  registerPrompts(mcpServer, workspaceId);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await mcpServer.connect(transport);

  return transport.handleRequest(request);
}

export async function DELETE(request: Request): Promise<Response> {
  const workspaceId = authenticateRequest(request);
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  return transport.handleRequest(request);
}
