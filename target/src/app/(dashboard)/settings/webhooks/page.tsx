"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const WEBHOOK_EVENTS = [
  "contact.created",
  "contact.updated",
  "contact.deleted",
  "company.created",
  "company.updated",
  "company.deleted",
  "deal.created",
  "deal.updated",
  "deal.deleted",
  "deal.stage_changed",
  "activity.created",
  "task.created",
  "task.completed",
] as const;

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
}

function WebhookCard({
  webhook,
  onDelete,
}: {
  webhook: Webhook;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono">{webhook.url}</code>
          {webhook.isActive ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {webhook.events.map((event) => (
            <Badge key={event} variant="outline" className="text-xs">
              {event}
            </Badge>
          ))}
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(webhook.id)}
      >
        Delete
      </Button>
    </div>
  );
}

function AddWebhookForm({
  onAdd,
  onCancel,
}: {
  onAdd: (webhook: Omit<Webhook, "id" | "secret" | "isActive">) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = React.useState("");
  const [selectedEvents, setSelectedEvents] = React.useState<Set<string>>(
    new Set(),
  );

  function toggleEvent(event: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) {
        next.delete(event);
      } else {
        next.add(event);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || selectedEvents.size === 0) return;
    onAdd({ url, events: Array.from(selectedEvents) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <label htmlFor="webhook-url" className="text-sm font-medium">
          Endpoint URL
        </label>
        <Input
          id="webhook-url"
          type="url"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Events</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WEBHOOK_EVENTS.map((event) => (
            <label
              key={event}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedEvents.has(event)}
                onChange={() => toggleEvent(event)}
                className="rounded border-gray-300"
              />
              {event}
            </label>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        A signing secret will be automatically generated for verifying webhook
        payloads.
      </p>

      <div className="flex gap-2">
        <Button type="submit" disabled={!url || selectedEvents.size === 0}>
          Create Webhook
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function WebhooksSettingsPage() {
  const [webhooks, setWebhooks] = React.useState<Webhook[]>([]);
  const [showForm, setShowForm] = React.useState(false);

  // MVP: client-side state, tRPC will be wired later
  function handleAdd(data: Omit<Webhook, "id" | "secret" | "isActive">) {
    const newWebhook: Webhook = {
      id: crypto.randomUUID(),
      url: data.url,
      events: data.events,
      secret: crypto.randomUUID(),
      isActive: true,
    };
    setWebhooks((prev) => [...prev, newWebhook]);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time notifications when events
            occur in your CRM.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Add Webhook</Button>
        )}
      </div>

      {showForm && (
        <AddWebhookForm
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        {webhooks.length === 0 && !showForm ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No webhooks configured. Add a webhook to start receiving event
              notifications.
            </p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
