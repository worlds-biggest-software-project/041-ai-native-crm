"use client";

import * as React from "react";
import {
  Mail,
  Calendar,
  Phone,
  FileText,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Activity {
  id: string;
  activityType: string; // "email" | "meeting" | "call" | "note" | "stage_change"
  subject: string | null;
  occurredAt: string | Date;
  detail: Record<string, unknown>;
  isAiGenerated: boolean;
  ownerId?: string | null;
}

export interface ActivityItemProps {
  activity: Activity;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

const ICON_CONFIG: Record<
  string,
  { icon: typeof Mail; bg: string; text: string }
> = {
  email: { icon: Mail, bg: "bg-blue-100", text: "text-blue-600" },
  meeting: { icon: Calendar, bg: "bg-purple-100", text: "text-purple-600" },
  call: { icon: Phone, bg: "bg-green-100", text: "text-green-600" },
  note: { icon: FileText, bg: "bg-amber-100", text: "text-amber-600" },
  stage_change: { icon: ArrowRight, bg: "bg-gray-100", text: "text-gray-600" },
};

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------
function EmailContent({ detail }: { detail: Record<string, unknown> }) {
  const direction =
    typeof detail.direction === "string" ? detail.direction : null;
  const bodyText =
    typeof detail.body_text === "string" ? detail.body_text : null;

  return (
    <div className="space-y-1">
      {direction && (
        <Badge
          variant={direction === "inbound" ? "secondary" : "outline"}
          className="text-xs"
        >
          {direction === "inbound" ? "Inbound" : "Outbound"}
        </Badge>
      )}
      {bodyText && (
        <p className="text-sm text-muted-foreground">
          {truncate(bodyText, 150)}
        </p>
      )}
    </div>
  );
}

function MeetingContent({
  detail,
  occurredAt,
}: {
  detail: Record<string, unknown>;
  occurredAt: string | Date;
}) {
  const attendees = Array.isArray(detail.attendees) ? detail.attendees : null;
  const d = typeof occurredAt === "string" ? new Date(occurredAt) : occurredAt;
  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>{timeStr}</span>
      {attendees && (
        <span>
          &middot; {attendees.length} attendee
          {attendees.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function CallContent({ detail }: { detail: Record<string, unknown> }) {
  const duration =
    typeof detail.duration === "number" || typeof detail.duration === "string"
      ? String(detail.duration)
      : null;

  return duration ? (
    <p className="text-sm text-muted-foreground">Duration: {duration}</p>
  ) : null;
}

function NoteContent({ detail }: { detail: Record<string, unknown> }) {
  const bodyText =
    typeof detail.body_text === "string" ? detail.body_text : null;
  const [expanded, setExpanded] = React.useState(false);

  if (!bodyText) return null;

  const isLong = bodyText.length > 150;

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {expanded || !isLong ? bodyText : truncate(bodyText, 150)}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" /> Show less
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" /> Show more
            </>
          )}
        </button>
      )}
    </div>
  );
}

function StageChangeContent({ detail }: { detail: Record<string, unknown> }) {
  const oldStage =
    typeof detail.old_stage === "string" ? detail.old_stage : "Unknown";
  const newStage =
    typeof detail.new_stage === "string" ? detail.new_stage : "Unknown";

  return (
    <p className="text-sm text-muted-foreground">
      Stage changed from{" "}
      <span className="font-medium text-foreground">{oldStage}</span> to{" "}
      <span className="font-medium text-foreground">{newStage}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ActivityItem({ activity }: ActivityItemProps) {
  const config = ICON_CONFIG[activity.activityType];
  const IconComponent = config?.icon ?? FileText;
  const bgClass = config?.bg ?? "bg-gray-100";
  const textClass = config?.text ?? "text-gray-600";

  return (
    <div className="relative flex gap-3 pb-6">
      {/* Icon circle */}
      <div
        className={cn(
          "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          bgClass,
          textClass,
        )}
      >
        <IconComponent className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Header: subject + time + AI badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold leading-tight">
            {activity.subject ?? "Untitled"}
          </span>
          {activity.isAiGenerated && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(activity.occurredAt)}
          </span>
        </div>

        {/* Type-specific content */}
        {activity.activityType === "email" && (
          <EmailContent detail={activity.detail} />
        )}
        {activity.activityType === "meeting" && (
          <MeetingContent
            detail={activity.detail}
            occurredAt={activity.occurredAt}
          />
        )}
        {activity.activityType === "call" && (
          <CallContent detail={activity.detail} />
        )}
        {activity.activityType === "note" && (
          <NoteContent detail={activity.detail} />
        )}
        {activity.activityType === "stage_change" && (
          <StageChangeContent detail={activity.detail} />
        )}
      </div>
    </div>
  );
}
