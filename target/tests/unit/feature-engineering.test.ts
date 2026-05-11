/**
 * T138: Unit tests for feature engineering.
 */

import { describe, it, expect } from "vitest";
import {
  computeDealHealthFeatures,
  type ActivitySummary,
  type DealSummary,
} from "@/server/services/scoring/feature-engineering";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function makeDeal(overrides: Partial<DealSummary> = {}): DealSummary {
  return {
    stageEnteredAt: daysAgo(5),
    createdAt: daysAgo(30),
    ...overrides,
  };
}

function makeActivity(
  type: string,
  daysAgoValue: number,
  detail: Record<string, unknown> = {},
): ActivitySummary {
  return {
    activityType: type,
    occurredAt: daysAgo(daysAgoValue),
    detail,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computeDealHealthFeatures", () => {
  it("counts emailsLast7Days correctly", () => {
    const activities: ActivitySummary[] = [
      makeActivity("email", 1), // within 7 days
      makeActivity("email", 3), // within 7 days
      makeActivity("email", 6), // within 7 days
      makeActivity("email", 10), // outside 7 days
      makeActivity("email", 20), // outside 7 days
      makeActivity("meeting", 2), // not an email
    ];

    const features = computeDealHealthFeatures(activities, makeDeal());

    expect(features.emailsLast7Days).toBe(3);
  });

  it("returns 0 emailsLast7Days for zero-activity deals", () => {
    const features = computeDealHealthFeatures([], makeDeal());

    expect(features.emailsLast7Days).toBe(0);
    expect(features.emailsLast30Days).toBe(0);
    expect(features.meetingsLast14Days).toBe(0);
    expect(features.meetingsLast30Days).toBe(0);
  });

  it("computes daysSinceLastActivity", () => {
    const activities: ActivitySummary[] = [
      makeActivity("email", 3),
      makeActivity("meeting", 10),
    ];

    const features = computeDealHealthFeatures(activities, makeDeal());

    // Most recent activity is 3 days ago
    expect(features.daysSinceLastActivity).toBeGreaterThanOrEqual(2.9);
    expect(features.daysSinceLastActivity).toBeLessThanOrEqual(3.1);
  });

  it("computes stageVelocityDays from deal dates", () => {
    const deal: DealSummary = {
      createdAt: daysAgo(20),
      stageEnteredAt: daysAgo(5),
    };

    const features = computeDealHealthFeatures([], deal);

    // stageVelocityDays = days between createdAt and stageEnteredAt ≈ 15
    expect(features.stageVelocityDays).toBeGreaterThanOrEqual(14.9);
    expect(features.stageVelocityDays).toBeLessThanOrEqual(15.1);
  });

  it("counts meetingsLast14Days correctly", () => {
    const activities: ActivitySummary[] = [
      makeActivity("meeting", 2), // within 14 days
      makeActivity("meeting", 7), // within 14 days
      makeActivity("meeting", 13), // within 14 days
      makeActivity("meeting", 20), // outside 14 days
      makeActivity("email", 1), // not a meeting
    ];

    const features = computeDealHealthFeatures(activities, makeDeal());

    expect(features.meetingsLast14Days).toBe(3);
  });
});
