/**
 * T145: Scoring pipeline — orchestrates feature extraction, model selection,
 * inference, persistence, and entity update for deal health and lead scoring.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/server/db";
import { deals } from "@/server/db/schema/deals";
import { contacts } from "@/server/db/schema/contacts";
import { activities } from "@/server/db/schema/activities";
import { scoringModels, scoreHistory } from "@/server/db/schema/scoring";
import {
  computeDealHealthFeatures,
  computeLeadScoreFeatures,
} from "./feature-engineering";
import type { ActivitySummary } from "./feature-engineering";
import {
  heuristicDealHealth,
  heuristicLeadScore,
  scoreDealWithModel,
} from "./inference";
import type { ScoreResult } from "./inference";

// ---------------------------------------------------------------------------
// Deal scoring pipeline
// ---------------------------------------------------------------------------

export async function scoreDeal(
  dealId: string,
  workspaceId: string,
): Promise<ScoreResult> {
  // 1. Load the deal
  const [deal] = await db
    .select()
    .from(deals)
    .where(and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId)));

  if (!deal) {
    throw new Error(`Deal ${dealId} not found in workspace ${workspaceId}`);
  }

  // 2. Load activities for the deal
  const dealActivities = await db
    .select({
      activityType: activities.activityType,
      occurredAt: activities.occurredAt,
      detail: activities.detail,
    })
    .from(activities)
    .where(
      and(
        eq(activities.dealId, dealId),
        eq(activities.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(activities.occurredAt));

  const activitySummaries: ActivitySummary[] = dealActivities.map((a) => ({
    activityType: a.activityType,
    occurredAt: a.occurredAt,
    detail: a.detail as Record<string, unknown>,
  }));

  // 3. Compute features
  const features = computeDealHealthFeatures(activitySummaries, {
    stageEnteredAt: deal.stageEnteredAt ?? deal.createdAt,
    createdAt: deal.createdAt,
  });

  // 4. Check for an active scoring model
  const [activeModel] = await db
    .select()
    .from(scoringModels)
    .where(
      and(
        eq(scoringModels.workspaceId, workspaceId),
        eq(scoringModels.modelType, "deal_health"),
        eq(scoringModels.isActive, true),
      ),
    );

  // 5. Run inference
  let result: ScoreResult;
  if (activeModel) {
    const modelConfig = activeModel.config as Record<string, unknown>;
    const modelPath = (modelConfig["modelPath"] as string) ?? "";
    result = await scoreDealWithModel(features, modelPath);
  } else {
    result = heuristicDealHealth(features);
  }

  // 6. Store result in score_history
  // Use the active model ID, or the first scoring model for the workspace
  // as a fallback reference. If none exist, we still need a model_id for the FK.
  const modelId = activeModel?.id ?? (await getOrCreateHeuristicModel(workspaceId, "deal_health"));

  await db.insert(scoreHistory).values({
    workspaceId,
    entityType: "deal",
    entityId: dealId,
    modelId,
    score: result.score.toFixed(4),
    label: result.label,
    features: result.features,
  });

  // 7. Update the deal's health score columns
  await db
    .update(deals)
    .set({
      healthScore: result.score.toFixed(4),
      healthLabel: result.label,
      healthScoreUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));

  // 8. Return the score result
  return result;
}

// ---------------------------------------------------------------------------
// Lead scoring pipeline
// ---------------------------------------------------------------------------

export async function scoreLead(
  contactId: string,
  workspaceId: string,
): Promise<ScoreResult> {
  // 1. Load the contact
  const [contact] = await db
    .select()
    .from(contacts)
    .where(
      and(eq(contacts.id, contactId), eq(contacts.workspaceId, workspaceId)),
    );

  if (!contact) {
    throw new Error(
      `Contact ${contactId} not found in workspace ${workspaceId}`,
    );
  }

  // 2. Load activities for the contact
  const contactActivities = await db
    .select({
      activityType: activities.activityType,
      occurredAt: activities.occurredAt,
      detail: activities.detail,
    })
    .from(activities)
    .where(
      and(
        eq(activities.contactId, contactId),
        eq(activities.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(activities.occurredAt));

  const activitySummaries: ActivitySummary[] = contactActivities.map((a) => ({
    activityType: a.activityType,
    occurredAt: a.occurredAt,
    detail: a.detail as Record<string, unknown>,
  }));

  // 3. Compute features
  const features = computeLeadScoreFeatures(activitySummaries, {
    lifecycleStage: contact.lifecycleStage,
    companyId: contact.companyId,
    phone: contact.phone,
  });

  // 4. Check for an active scoring model
  const [activeModel] = await db
    .select()
    .from(scoringModels)
    .where(
      and(
        eq(scoringModels.workspaceId, workspaceId),
        eq(scoringModels.modelType, "lead_score"),
        eq(scoringModels.isActive, true),
      ),
    );

  // 5. Run inference (lead scoring only uses heuristic for now)
  const result: ScoreResult = activeModel
    ? heuristicLeadScore(features)
    : heuristicLeadScore(features);

  // 6. Store result in score_history
  const modelId = activeModel?.id ?? (await getOrCreateHeuristicModel(workspaceId, "lead_score"));

  await db.insert(scoreHistory).values({
    workspaceId,
    entityType: "contact",
    entityId: contactId,
    modelId,
    score: result.score.toFixed(4),
    label: result.label,
    features: result.features,
  });

  // 7. Update the contact's lead score columns
  await db
    .update(contacts)
    .set({
      leadScore: result.score.toFixed(4),
      leadScoreLabel: result.label,
      leadScoreUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, contactId));

  // 8. Return the score result
  return result;
}

// ---------------------------------------------------------------------------
// Helper: ensure a heuristic "model" row exists so score_history FK is valid
// ---------------------------------------------------------------------------

async function getOrCreateHeuristicModel(
  workspaceId: string,
  modelType: string,
): Promise<string> {
  const [existing] = await db
    .select()
    .from(scoringModels)
    .where(
      and(
        eq(scoringModels.workspaceId, workspaceId),
        eq(scoringModels.modelType, modelType),
      ),
    );

  if (existing) return existing.id;

  const [created] = await db
    .insert(scoringModels)
    .values({
      workspaceId,
      name: `Heuristic ${modelType}`,
      modelType,
      config: { type: "heuristic" },
      version: 1,
      isActive: false,
    })
    .returning();

  return created!.id;
}
