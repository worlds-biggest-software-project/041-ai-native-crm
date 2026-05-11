"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/components/activities/activity-timeline";

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------
const FILTERS = [
  { key: "all", label: "All" },
  { key: "email", label: "Emails" },
  { key: "meeting", label: "Meetings" },
  { key: "call", label: "Calls" },
  { key: "note", label: "Notes" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ActivitiesPage() {
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>("all");

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">Activities</h1>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.key)}
            className={cn(
              activeFilter === filter.key && "pointer-events-none",
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Timeline — shows all workspace activities (no entity filter) */}
      <ActivityTimeline />
    </div>
  );
}
