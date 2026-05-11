/**
 * T143 + T144: Heuristic scorers and ONNX inference stub for deal health
 * and lead scoring.
 */

import type {
  DealHealthFeatures,
  LeadScoreFeatures,
} from "./feature-engineering";

// ---------------------------------------------------------------------------
// Score result type
// ---------------------------------------------------------------------------

export interface ScoreResult {
  score: number; // 0-100
  label: string; // "hot" | "warm" | "cool" | "cold"
  features: Record<string, number | boolean | string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToLabel(score: number): string {
  if (score >= 75) return "hot";
  if (score >= 50) return "warm";
  if (score >= 25) return "cool";
  return "cold";
}

// ---------------------------------------------------------------------------
// T143: Heuristic deal health scorer
// ---------------------------------------------------------------------------

export function heuristicDealHealth(features: DealHealthFeatures): ScoreResult {
  let score = 50;

  if (features.emailsLast7Days >= 3) score += 15;
  if (features.meetingsLast14Days >= 1) score += 10;
  if (features.hasUpcomingMeeting) score += 10;
  if (features.daysSinceLastActivity > 14) {
    score -= 20;
  } else if (features.daysSinceLastActivity > 7) {
    score -= 10;
  }
  if (features.avgResponseTimeHours > 48) score -= 15;

  score = clamp(score, 0, 100);

  return {
    score,
    label: scoreToLabel(score),
    features: {
      emailsLast7Days: features.emailsLast7Days,
      emailsLast30Days: features.emailsLast30Days,
      meetingsLast14Days: features.meetingsLast14Days,
      meetingsLast30Days: features.meetingsLast30Days,
      avgResponseTimeHours: features.avgResponseTimeHours,
      daysSinceLastActivity: features.daysSinceLastActivity,
      daysSinceStageChange: features.daysSinceStageChange,
      stageVelocityDays: features.stageVelocityDays,
      hasUpcomingMeeting: features.hasUpcomingMeeting,
    },
  };
}

// ---------------------------------------------------------------------------
// T143: Heuristic lead scorer
// ---------------------------------------------------------------------------

export function heuristicLeadScore(features: LeadScoreFeatures): ScoreResult {
  let score = 20;

  if (features.emailsReceived >= 5) score += 15;
  if (features.meetingsAttended >= 1) score += 10;
  if (features.hasCompany) score += 10;
  if (features.hasPhone) score += 5;
  if (features.daysSinceLastActivity > 30) score -= 15;

  score = clamp(score, 0, 100);

  return {
    score,
    label: scoreToLabel(score),
    features: {
      emailsReceived: features.emailsReceived,
      emailsSent: features.emailsSent,
      meetingsAttended: features.meetingsAttended,
      websiteVisits: features.websiteVisits,
      contentDownloads: features.contentDownloads,
      daysSinceLastActivity: features.daysSinceLastActivity,
      lifecycleStage: features.lifecycleStage,
      hasCompany: features.hasCompany,
      hasPhone: features.hasPhone,
    },
  };
}

// ---------------------------------------------------------------------------
// T144: ONNX inference stub — falls back to heuristic for MVP
// ---------------------------------------------------------------------------

export async function scoreDealWithModel(
  features: DealHealthFeatures,
  _modelPath: string,
): Promise<ScoreResult> {
  console.log(
    "ONNX model scoring not yet implemented, using heuristic fallback",
  );
  return heuristicDealHealth(features);
}
