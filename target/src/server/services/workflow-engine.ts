export interface WorkflowDefinition {
  trigger: {
    event: string;
    conditions?: Record<string, unknown>;
  };
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  type:
    | "create_task"
    | "update_field"
    | "send_notification"
    | "wait"
    | "call_webhook";
  config: Record<string, unknown>;
}

export interface WorkflowContext {
  workspaceId: string;
  triggerEntityType: string;
  triggerEntityId: string;
  triggerData: Record<string, unknown>;
}

export function evaluateTrigger(
  definition: WorkflowDefinition,
  event: string,
  data: Record<string, unknown>,
): boolean {
  if (definition.trigger.event !== event) {
    return false;
  }

  if (definition.trigger.conditions) {
    for (const [key, expected] of Object.entries(
      definition.trigger.conditions,
    )) {
      if (data[key] !== expected) {
        return false;
      }
    }
  }

  return true;
}

async function executeStep(
  step: WorkflowStep,
  _context: WorkflowContext,
): Promise<void> {
  switch (step.type) {
    case "create_task":
      console.log(`Would create task: ${String(step.config.description)}`);
      break;
    case "update_field":
      console.log("Would update field");
      break;
    case "send_notification":
      console.log("Would send notification");
      break;
    case "wait":
      console.log(`Would wait ${String(step.config.duration)}`);
      break;
    case "call_webhook":
      console.log(`Would call webhook ${String(step.config.url)}`);
      break;
  }
}

export async function executeWorkflow(
  definition: WorkflowDefinition,
  context: WorkflowContext,
): Promise<{
  status: "completed" | "failed";
  result?: unknown;
  error?: string;
}> {
  const results: unknown[] = [];

  try {
    for (const step of definition.steps) {
      await executeStep(step, context);
      results.push({ type: step.type, status: "completed" });
    }

    return { status: "completed", result: results };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return { status: "failed", error: errorMessage };
  }
}
