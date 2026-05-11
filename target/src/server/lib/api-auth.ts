import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// For MVP, validate against a simple API_KEY env var
// Post-MVP: look up key in an api_keys table per workspace
export async function authenticateApiRequest(req: NextRequest): Promise<{
  workspaceId: string;
  userId: string;
} | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  // MVP: single API key maps to a workspace
  // Format: workspace_id:secret
  const [workspaceId, secret] = token.split(":");
  if (!workspaceId || !secret) return null;

  // Validate against API_SECRET env var for MVP
  if (secret !== process.env.API_SECRET) return null;

  return { workspaceId, userId: "api" };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
