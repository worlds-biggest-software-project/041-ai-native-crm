"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ActivityItem,
  type Activity,
} from "@/components/activities/activity-item";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ActivityTimelineProps {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  initialActivities?: Activity[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDateKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

function formatDateHeader(dateKey: string): string {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(
  activities: Activity[],
): { dateKey: string; label: string; items: Activity[] }[] {
  const map = new Map<string, Activity[]>();

  for (const activity of activities) {
    const key = getDateKey(activity.occurredAt);
    const existing = map.get(key);
    if (existing) {
      existing.push(activity);
    } else {
      map.set(key, [activity]);
    }
  }

  // Sort groups newest-first
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => ({
    dateKey: key,
    label: formatDateHeader(key),
    items: map.get(key) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ActivityTimeline({
  initialActivities = [],
}: ActivityTimelineProps) {
  const [loadedMore, setLoadedMore] = React.useState(false);

  const activities = initialActivities;
  const hasMore = !loadedMore && initialActivities.length >= 20;

  const handleLoadMore = () => {
    setLoadedMore(true);
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No activities yet</p>
      </div>
    );
  }

  const groups = groupByDate(activities);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.dateKey}>
          {/* Date header */}
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h4>

          {/* Timeline */}
          <div className="relative">
            {/* Connector line */}
            <div
              className={cn(
                "absolute left-4 top-0 bottom-0 w-px bg-border",
                // Hide line after last item in group
                "last:bottom-6",
              )}
              aria-hidden="true"
            />

            {/* Items */}
            {group.items.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}

      {/* Load more */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadMore}
          disabled={!hasMore}
        >
          {hasMore ? "Load more" : "No more activities"}
        </Button>
      </div>
    </div>
  );
}
