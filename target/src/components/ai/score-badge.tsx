"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScoreBadgeProps {
  score: number;
  label: string;
  trend?: "up" | "down" | "stable";
  timestamp?: string | Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LABEL_COLORS: Record<string, string> = {
  hot: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  warm: "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  cool: "border-orange-500/50 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  cold: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

const TrendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScoreBadge({
  score,
  label,
  trend,
  timestamp,
}: ScoreBadgeProps) {
  const normalizedLabel = label.toLowerCase();
  const colorClass = LABEL_COLORS[normalizedLabel] ?? LABEL_COLORS["cold"];
  const Icon = trend ? TrendIcon[trend] : null;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-xs font-semibold capitalize", colorClass)}
    >
      <span className="tabular-nums">{score}</span>
      <span>{normalizedLabel}</span>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {timestamp && (
        <span className="text-[10px] opacity-70">
          {formatRelativeDate(timestamp)}
        </span>
      )}
    </Badge>
  );
}
