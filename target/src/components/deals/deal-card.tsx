"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ---------------------------------------------------------------------------
// Local Deal type (card-level fields)
// ---------------------------------------------------------------------------
export interface Deal {
  id: string;
  name: string;
  companyName?: string | null;
  amount?: number | null;
  currency?: string | null;
  healthLabel?: string | null;
  ownerName?: string | null;
  ownerInitials?: string | null;
  stageEnteredAt?: string | Date | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(amount?: number | null, currency?: string | null): string {
  if (amount == null) return "—";
  const code = currency ?? "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}

const HEALTH_COLORS: Record<string, string> = {
  good: "bg-green-500",
  fair: "bg-yellow-500",
  poor: "bg-red-500",
  at_risk: "bg-red-500",
};

function healthDotClass(label?: string | null): string {
  if (!label) return "bg-gray-300";
  return HEALTH_COLORS[label.toLowerCase()] ?? "bg-gray-300";
}

function daysInStage(stageEnteredAt?: string | Date | null): number | null {
  if (!stageEnteredAt) return null;
  const entered =
    typeof stageEnteredAt === "string"
      ? new Date(stageEnteredAt)
      : stageEnteredAt;
  const diffMs = Date.now() - entered.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DealCard({ deal, isDragging = false }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;
  const days = daysInStage(deal.stageEnteredAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        dragging && "shadow-lg opacity-90 ring-2 ring-primary/20",
        !dragging && "hover:shadow-md",
      )}
    >
      {/* Deal name */}
      <p className="text-sm font-medium leading-tight">{deal.name}</p>

      {/* Company */}
      {deal.companyName && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {deal.companyName}
        </p>
      )}

      {/* Amount */}
      <p className="mt-2 text-sm font-semibold tabular-nums">
        {formatCurrency(deal.amount, deal.currency)}
      </p>

      {/* Bottom row: health, owner, days in stage */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Health badge with colored dot */}
          {deal.healthLabel && (
            <Badge variant="outline" className="gap-1.5 text-xs capitalize">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  healthDotClass(deal.healthLabel),
                )}
                aria-hidden="true"
              />
              {deal.healthLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Days in stage */}
          {days != null && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {days}d
            </span>
          )}

          {/* Owner avatar */}
          {deal.ownerName && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">
                {deal.ownerInitials ??
                  deal.ownerName
                    .split(/\s+/)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
