"use client";

import * as React from "react";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { DealCard, type Deal } from "@/components/deals/deal-card";

// ---------------------------------------------------------------------------
// Local Pipeline type
// ---------------------------------------------------------------------------
export interface PipelineStage {
  id: string;
  name: string;
  order: number;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

// ---------------------------------------------------------------------------
// Stage column component
// ---------------------------------------------------------------------------
interface StageColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
}

function StageColumn({ stage, deals, totalValue }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30",
        isOver && "ring-2 ring-primary/30",
      )}
    >
      {/* Stage header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{stage.name}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
            {deals.length}
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCompactCurrency(totalValue)}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No deals
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCompactCurrency(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000)
    return `$${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${value.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface PipelineBoardProps {
  pipeline: Pipeline;
  deals: Deal[];
  onMoveStage: (dealId: string, stageId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PipelineBoard({
  pipeline,
  deals,
  onMoveStage,
}: PipelineBoardProps) {
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);
  const [localDeals, setLocalDeals] = React.useState<Deal[]>(deals);
  const [prevDeals, setPrevDeals] = React.useState(deals);

  if (prevDeals !== deals) {
    setPrevDeals(deals);
    setLocalDeals(deals);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Group deals by stageId
  const dealsByStage = React.useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const stage of pipeline.stages) {
      map.set(stage.id, []);
    }
    for (const deal of localDeals) {
      const stageId = (deal as Deal & { stageId?: string }).stageId;
      if (stageId && map.has(stageId)) {
        map.get(stageId)!.push(deal);
      }
    }
    return map;
  }, [localDeals, pipeline.stages]);

  // Value totals per stage
  const valueTotals = React.useMemo(() => {
    const totals = new Map<string, number>();
    for (const [stageId, stageDeals] of dealsByStage) {
      totals.set(
        stageId,
        stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      );
    }
    return totals;
  }, [dealsByStage]);

  // ---- Drag handlers ----
  function handleDragStart(event: DragStartEvent) {
    const deal = localDeals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target stage: either the droppable stage column id or
    // the stage of the deal being dragged over.
    const isOverStage = pipeline.stages.some((s) => s.id === overId);
    const targetStageId = isOverStage
      ? overId
      : (() => {
          const overDeal = localDeals.find((d) => d.id === overId);
          return (overDeal as Deal & { stageId?: string })?.stageId;
        })();

    if (!targetStageId) return;

    setLocalDeals((prev) =>
      prev.map((d) =>
        d.id === activeId
          ? ({ ...d, stageId: targetStageId } as Deal & { stageId: string })
          : d,
      ),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isOverStage = pipeline.stages.some((s) => s.id === overId);
    const targetStageId = isOverStage
      ? overId
      : (() => {
          const overDeal = localDeals.find((d) => d.id === overId);
          return (overDeal as Deal & { stageId?: string })?.stageId;
        })();

    if (targetStageId) {
      onMoveStage(activeId, targetStageId);
    }
  }

  const sortedStages = [...pipeline.stages].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedStages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage.get(stage.id) ?? []}
            totalValue={valueTotals.get(stage.id) ?? 0}
          />
        ))}
      </div>

      {/* Drag overlay (floating card that follows cursor) */}
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
