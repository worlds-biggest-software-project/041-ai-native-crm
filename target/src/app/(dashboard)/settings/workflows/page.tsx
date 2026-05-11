"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TRIGGER_EVENTS = [
  "contact.created",
  "contact.updated",
  "contact.deleted",
  "company.created",
  "company.updated",
  "deal.created",
  "deal.updated",
  "deal.stage_changed",
  "activity.created",
  "task.created",
  "task.completed",
] as const;

const STEP_TYPES = [
  { value: "create_task", label: "Create Task" },
  { value: "update_field", label: "Update Field" },
  { value: "send_notification", label: "Send Notification" },
  { value: "wait", label: "Wait" },
  { value: "call_webhook", label: "Call Webhook" },
] as const;

interface WorkflowStep {
  type: string;
  config: Record<string, unknown>;
}

interface Workflow {
  id: string;
  name: string;
  triggerEvent: string;
  isActive: boolean;
  steps: WorkflowStep[];
  executionCount: number;
}

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{workflow.name}</h3>
          {workflow.isActive ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Trigger: <code className="text-xs">{workflow.triggerEvent}</code>
        </p>
        <p className="text-sm text-muted-foreground">
          {workflow.steps.length} step{workflow.steps.length !== 1 ? "s" : ""}{" "}
          &middot; {workflow.executionCount} recent execution
          {workflow.executionCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

function CreateWorkflowForm({
  onAdd,
  onCancel,
}: {
  onAdd: (workflow: Omit<Workflow, "id" | "isActive" | "executionCount">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [triggerEvent, setTriggerEvent] = React.useState("");
  const [steps, setSteps] = React.useState<WorkflowStep[]>([]);

  function addStep() {
    setSteps((prev) => [...prev, { type: "create_task", config: {} }]);
  }

  function updateStepType(index: number, type: string) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, type } : s)),
    );
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !triggerEvent) return;
    onAdd({ name, triggerEvent, steps });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <label htmlFor="workflow-name" className="text-sm font-medium">
          Workflow Name
        </label>
        <Input
          id="workflow-name"
          placeholder="e.g. New deal follow-up"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="trigger-event" className="text-sm font-medium">
          Trigger Event
        </label>
        <select
          id="trigger-event"
          value={triggerEvent}
          onChange={(e) => setTriggerEvent(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          <option value="">Select an event...</option>
          {TRIGGER_EVENTS.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Conditions</span>
        <div className="rounded border border-dashed p-3 text-center text-sm text-muted-foreground">
          Condition builder coming soon
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Action Steps</span>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            Add Step
          </Button>
        </div>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No steps added. Click &quot;Add Step&quot; to define workflow
            actions.
          </p>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded border p-2"
              >
                <span className="text-xs text-muted-foreground w-6">
                  {index + 1}.
                </span>
                <select
                  value={step.type}
                  onChange={(e) => updateStepType(index, e.target.value)}
                  className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {STEP_TYPES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                  className="ml-auto"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={!name || !triggerEvent}>
          Create Workflow
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function WorkflowsSettingsPage() {
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [showForm, setShowForm] = React.useState(false);

  // MVP: client-side state, tRPC will be wired later
  function handleAdd(
    data: Omit<Workflow, "id" | "isActive" | "executionCount">,
  ) {
    const newWorkflow: Workflow = {
      id: crypto.randomUUID(),
      name: data.name,
      triggerEvent: data.triggerEvent,
      isActive: true,
      steps: data.steps,
      executionCount: 0,
    };
    setWorkflows((prev) => [...prev, newWorkflow]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Automate actions based on CRM events. Create workflows to
            streamline your sales process.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Create Workflow</Button>
        )}
      </div>

      {showForm && (
        <CreateWorkflowForm
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        {workflows.length === 0 && !showForm ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No workflows configured. Create a workflow to automate actions
              based on CRM events.
            </p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))
        )}
      </div>
    </div>
  );
}
