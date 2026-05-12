"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface EmailItem {
  id: string;
  subject: string | null;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  direction: "inbound" | "outbound";
  bodyText: string;
  occurredAt: string | Date;
}

export interface EmailThreadProps {
  threadId: string;
  emails: EmailItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatEmailDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Single email row
// ---------------------------------------------------------------------------
function EmailRow({
  email,
  defaultExpanded,
}: {
  email: EmailItem;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const toList = email.to.map((r) => r.name || r.email).join(", ");

  return (
    <div className="rounded-md border">
      {/* Collapse header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 px-4 py-3 text-left text-sm",
          "hover:bg-muted/50 transition-colors",
          expanded && "border-b",
        )}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

        <span className="min-w-0 flex-1 truncate font-medium">
          {email.from.name || email.from.email}
        </span>

        <Badge
          variant={email.direction === "inbound" ? "secondary" : "outline"}
          className="shrink-0 text-xs"
        >
          {email.direction === "inbound" ? "Inbound" : "Outbound"}
        </Badge>

        <span className="shrink-0 text-xs text-muted-foreground">
          {formatEmailDate(email.occurredAt)}
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="space-y-2 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">From:</span> {email.from.name} &lt;
            {email.from.email}&gt;
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">To:</span> {toList}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {email.bodyText}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EmailThread({ threadId, emails }: EmailThreadProps) {
  // Sort emails oldest-first so the most recent is last (and expanded)
  const sorted = React.useMemo(
    () =>
      [...emails].sort((a, b) => {
        const da =
          typeof a.occurredAt === "string"
            ? new Date(a.occurredAt)
            : a.occurredAt;
        const db =
          typeof b.occurredAt === "string"
            ? new Date(b.occurredAt)
            : b.occurredAt;
        return da.getTime() - db.getTime();
      }),
    [emails],
  );

  const threadSubject = sorted[0]?.subject ?? "Untitled Thread";

  return (
    <div className="space-y-3">
      {/* Thread header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{threadSubject}</h3>
        <span className="text-xs text-muted-foreground">
          {emails.length} email{emails.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Email list — most recent expanded */}
      <div className="space-y-2">
        {sorted.map((email, index) => (
          <EmailRow
            key={email.id}
            email={email}
            defaultExpanded={index === sorted.length - 1}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Thread ID: {threadId}</p>
    </div>
  );
}
