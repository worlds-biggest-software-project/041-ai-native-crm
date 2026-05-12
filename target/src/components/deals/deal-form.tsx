"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Deal } from "@/server/db/schema/deals";

interface DealFormProps {
  deal?: Deal;
  onSubmit: (data: DealFormData) => void;
  onCancel: () => void;
}

export interface DealFormData {
  name: string;
  pipelineId: string;
  stageId: string;
  amount: string;
  currency: string;
  expectedCloseDate: string;
  priority: string;
  source: string;
}

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export function DealForm({ deal, onSubmit, onCancel }: DealFormProps) {
  const [formData, setFormData] = React.useState<DealFormData>({
    name: deal?.name ?? "",
    pipelineId: deal?.pipelineId ?? "",
    stageId: deal?.stageId ?? "",
    amount: deal?.amount != null ? String(deal.amount) : "",
    currency: deal?.currency ?? "USD",
    expectedCloseDate: deal?.expectedCloseDate ?? "",
    priority: deal?.priority ?? "medium",
    source: deal?.source ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Name */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="name" className="text-sm font-medium leading-none">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Deal name"
            required
          />
        </div>

        {/* Pipeline (select placeholder) */}
        <div className="space-y-2">
          <label
            htmlFor="pipelineId"
            className="text-sm font-medium leading-none"
          >
            Pipeline <span className="text-destructive">*</span>
          </label>
          <select
            id="pipelineId"
            name="pipelineId"
            value={formData.pipelineId}
            onChange={handleChange}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select pipeline...</option>
            {/* TODO: Populate from tRPC query */}
          </select>
        </div>

        {/* Stage (select placeholder) */}
        <div className="space-y-2">
          <label htmlFor="stageId" className="text-sm font-medium leading-none">
            Stage <span className="text-destructive">*</span>
          </label>
          <select
            id="stageId"
            name="stageId"
            value={formData.stageId}
            onChange={handleChange}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select stage...</option>
            {/* TODO: Populate from pipeline stages */}
          </select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium leading-none">
            Amount
          </label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0"
          />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label
            htmlFor="currency"
            className="text-sm font-medium leading-none"
          >
            Currency
          </label>
          <Input
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            placeholder="USD"
            maxLength={3}
          />
        </div>

        {/* Expected Close Date */}
        <div className="space-y-2">
          <label
            htmlFor="expectedCloseDate"
            className="text-sm font-medium leading-none"
          >
            Expected Close Date
          </label>
          <Input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            value={formData.expectedCloseDate}
            onChange={handleChange}
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label
            htmlFor="priority"
            className="text-sm font-medium leading-none"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <label htmlFor="source" className="text-sm font-medium leading-none">
            Source
          </label>
          <Input
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            placeholder="e.g. Inbound, Referral"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{deal ? "Update Deal" : "Create Deal"}</Button>
      </div>
    </form>
  );
}
