"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Integration {
  id: string;
  name: string;
  description: string;
  provider: "gmail" | "outlook" | "google_calendar" | "outlook_calendar";
  connected: boolean;
  email?: string;
  lastSyncAt?: string;
}

// MVP: static data, tRPC will be wired later
const INTEGRATIONS: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    description:
      "Sync emails from your Gmail account to automatically log communications with contacts.",
    provider: "gmail",
    connected: false,
  },
  {
    id: "outlook",
    name: "Outlook",
    description:
      "Sync emails from your Outlook account to automatically log communications with contacts.",
    provider: "outlook",
    connected: false,
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description:
      "Sync calendar events to track meetings and schedule follow-ups with contacts.",
    provider: "google_calendar",
    connected: false,
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    description:
      "Sync Outlook calendar events to track meetings and schedule follow-ups with contacts.",
    provider: "outlook_calendar",
    connected: false,
  },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{integration.name}</h3>
          {integration.connected ? (
            <Badge variant="default">Connected</Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {integration.description}
        </p>
        {integration.connected && integration.email && (
          <p className="text-sm text-muted-foreground">
            Connected as {integration.email}
          </p>
        )}
        {integration.connected && integration.lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Last synced: {integration.lastSyncAt}
          </p>
        )}
      </div>
      <div>
        {integration.connected ? (
          <Button variant="destructive" size="sm">
            Disconnect
          </Button>
        ) : (
          <Button size="sm">Connect</Button>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your email and calendar accounts to automatically sync
          communications and meetings with your CRM contacts.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Email</h2>
        {INTEGRATIONS.filter(
          (i) => i.provider === "gmail" || i.provider === "outlook",
        ).map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Calendar</h2>
        {INTEGRATIONS.filter(
          (i) =>
            i.provider === "google_calendar" ||
            i.provider === "outlook_calendar",
        ).map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}
