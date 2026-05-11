/**
 * T137: Unit tests for heuristic deal health scoring.
 */

import { describe, it, expect } from "vitest";
import {
  heuristicDealHealth,
  type ScoreResult,
} from "@/server/services/scoring/inference";
import type { DealHealthFeatures } from "@/server/services/scoring/feature-engineering";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFeatures(
  overrides: Partial<DealHealthFeatures> = {},
): DealHealthFeatures {
  return {
    emailsLast7Days: 0,
    emailsLast30Days: 0,
    meetingsLast14Days: 0,
    meetingsLast30Days: 0,
    avgResponseTimeHours: 0,
    daysSinceLastActivity: 0,
    daysSinceStageChange: 0,
    stageVelocityDays: 0,
    hasUpcomingMeeting: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("heuristicDealHealth", () => {
  it("returns hot label for active deal with recent emails and meetings", () => {
    const features = makeFeatures({
      emailsLast7Days: 5,
      meetingsLast14Days: 2,
      hasUpcomingMeeting: true,
      daysSinceLastActivity: 1,
    });

    const result: ScoreResult = heuristicDealHealth(features);

    // 50 + 15 (emails) + 10 (meetings) + 10 (upcoming) = 85
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.label).toBe("hot");
  });

  it("returns cold label for stale deal with no activity", () => {
    const features = makeFeatures({
      daysSinceLastActivity: 30,
      avgResponseTimeHours: 72,
    });

    const result: ScoreResult = heuristicDealHealth(features);

    // 50 - 20 (stale > 14d) - 15 (slow response) = 15
    expect(result.score).toBeLessThan(25);
    expect(result.label).toBe("cold");
  });

  it("clamps score to 0-100 range", () => {
    // Try to push score well above 100
    const highFeatures = makeFeatures({
      emailsLast7Days: 100,
      meetingsLast14Days: 50,
      hasUpcomingMeeting: true,
      daysSinceLastActivity: 0,
    });

    const highResult = heuristicDealHealth(highFeatures);
    expect(highResult.score).toBeLessThanOrEqual(100);

    // Try to push score well below 0
    const lowFeatures = makeFeatures({
      daysSinceLastActivity: 100,
      avgResponseTimeHours: 200,
    });

    const lowResult = heuristicDealHealth(lowFeatures);
    expect(lowResult.score).toBeGreaterThanOrEqual(0);
  });

  it("warm label for moderate activity", () => {
    const features = makeFeatures({
      emailsLast7Days: 1,
      meetingsLast14Days: 1,
      daysSinceLastActivity: 3,
    });

    const result: ScoreResult = heuristicDealHealth(features);

    // 50 + 0 (emails < 3) + 10 (meeting) = 60
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(75);
    expect(result.label).toBe("warm");
  });

  it("penalizes slow response time", () => {
    const fastFeatures = makeFeatures({
      avgResponseTimeHours: 2,
      daysSinceLastActivity: 1,
    });

    const slowFeatures = makeFeatures({
      avgResponseTimeHours: 72,
      daysSinceLastActivity: 1,
    });

    const fastResult = heuristicDealHealth(fastFeatures);
    const slowResult = heuristicDealHealth(slowFeatures);

    expect(fastResult.score).toBeGreaterThan(slowResult.score);
    // Slow response should reduce by 15 points
    expect(fastResult.score - slowResult.score).toBe(15);
  });
});
