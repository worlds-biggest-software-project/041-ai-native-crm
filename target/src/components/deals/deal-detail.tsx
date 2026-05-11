"use client";

import { Badge } from "@/components/ui/badge";

interface DealDetailProps {
  dealId: string;
}

const fieldLabels: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "stage", label: "Stage" },
  { key: "amount", label: "Amount" },
  { key: "currency", label: "Currency" },
  { key: "company", label: "Company" },
  { key: "expectedClose", label: "Expected Close" },
  { key: "priority", label: "Priority" },
  { key: "healthScore", label: "Health Score" },
];

export function DealDetail({ dealId }: DealDetailProps) {
  // TODO: Fetch deal data via tRPC using dealId
  // For now, render placeholder fields

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-semibold">Deal Information</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fieldLabels.map((field) => (
          <div key={field.key} className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">
              {field.label}
            </dt>
            <dd className="text-sm">
              {field.key === "stage" ? (
                <Badge variant="secondary">Qualification</Badge>
              ) : field.key === "priority" ? (
                <Badge variant="outline">Medium</Badge>
              ) : (
                <span className="text-muted-foreground">Loading...</span>
              )}
            </dd>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">Deal ID: {dealId}</p>
    </div>
  );
}
