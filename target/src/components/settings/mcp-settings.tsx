"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function McpSettings() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function handleGenerateKey() {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/trpc/settings.generateMcpKey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as { result?: { data?: { key?: string } } };
      const key = data.result?.data?.key;
      if (key) {
        setApiKey(key);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">MCP Integration</h3>
        <p className="text-sm text-muted-foreground">
          Connect AI assistants to your CRM using the Model Context Protocol.
        </p>
      </div>

      {apiKey ? (
        <div className="space-y-3">
          <div className="rounded-md border bg-muted p-4">
            <p className="mb-2 text-sm font-medium text-destructive">
              This key will only be shown once. Copy it now and store it
              securely.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-background px-3 py-2 font-mono text-sm">
                {apiKey}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="rounded-md border p-4">
            <h4 className="mb-2 text-sm font-medium">Connection Instructions</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>
                MCP endpoint:{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/api/mcp`
                    : "/api/mcp"}
                </code>
              </li>
              <li>
                Set the Authorization header to{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  Bearer YOUR_API_KEY
                </code>
              </li>
              <li>
                Configure your AI assistant to use the MCP endpoint with the
                provided key.
              </li>
            </ol>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleGenerateKey}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate API Key"}
        </Button>
      )}

      <div>
        <h4 className="mb-2 text-sm font-medium">Active Connections</h4>
        <p className="text-sm italic text-muted-foreground">
          No active connections. Generate an API key and configure an AI
          assistant to get started.
        </p>
      </div>
    </div>
  );
}
