"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  PipelineBoard,
  type Pipeline,
  type PipelineStage,
} from "@/components/deals/pipeline-board";
import type { Deal } from "@/components/deals/deal-card";

// ---------------------------------------------------------------------------
// Default stages matching the pipeline schema defaults
// ---------------------------------------------------------------------------
const DEFAULT_STAGES: PipelineStage[] = [
  { id: "stage-qualification", name: "Qualification", order: 0 },
  { id: "stage-discovery", name: "Discovery", order: 1 },
  { id: "stage-proposal", name: "Proposal", order: 2 },
  { id: "stage-negotiation", name: "Negotiation", order: 3 },
  { id: "stage-closed-won", name: "Closed Won", order: 4 },
  { id: "stage-closed-lost", name: "Closed Lost", order: 5 },
];

const DEFAULT_PIPELINE: Pipeline = {
  id: "pipeline-default",
  name: "Sales Pipeline",
  stages: DEFAULT_STAGES,
};

// MVP: empty deals array, tRPC will be wired later
const INITIAL_DEALS: Deal[] = [];

export default function DealsPage() {
  const [pipeline] = React.useState<Pipeline>(DEFAULT_PIPELINE);
  const [deals, setDeals] = React.useState<(Deal & { stageId: string })[]>(
    INITIAL_DEALS as (Deal & { stageId: string })[],
  );

  function handleMoveStage(dealId: string, stageId: string) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stageId } : d)),
    );
    // TODO: call tRPC mutation to persist stage change
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>

          {/* Pipeline selector (placeholder) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent">
              {pipeline.name}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>{pipeline.name}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button>New Deal</Button>
      </div>

      {/* Kanban board */}
      <PipelineBoard
        pipeline={pipeline}
        deals={deals}
        onMoveStage={handleMoveStage}
      />
    </div>
  );
}
