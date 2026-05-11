/**
 * T141+T142: Feature engineering for deal health and lead scoring.
 *
 * Extracts structured features from raw activity summaries and entity data,
 * producing feature vectors consumed by heuristic or ML-based scorers.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface ActivitySummary {
  activityType: string;
  occurredAt: Date;
  detail: Record<string, unknown>;
}

export interface DealSummary {
  stageEnteredAt: Date;
  createdAt: Date;
}

export interface ContactSummary {
  lifecycleStage: string | null;
  companyId: string | null;
  phone: string | null;
}

// ---------------------------------------------------------------------------
// Feature interfaces
// ---------------------------------------------------------------------------

export interface DealHealthFeatures {
  emailsLast7Days: number;
  emailsLast30Days: number;
  meetingsLast14Days: number;
  meetingsLast30Days: number;
  avgResponseTimeHours: number;
  daysSinceLastActivity: number;
  daysSinceStageChange: number;
  stageVelocityDays: number;
  hasUpcomingMeeting: boolean;
}

export interface LeadScoreFeatures {
  emailsReceived: number;
  emailsSent: number;
  meetingsAttended: number;
  websiteVisits: number;
  contentDownloads: number;
  daysSinceLastActivity: number;
  lifecycleStage: string;
  hasCompany: boolean;
  hasPhone: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(a: Date, b: Date): number {
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
}

function isWithinDays(date: Date, now: Date, days: number): boolean {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date >= cutoff;
}

// ---------------------------------------------------------------------------
// Deal health feature computation
// ---------------------------------------------------------------------------

export function computeDealHealthFeatures(
  activities: ActivitySummary[],
  deal: DealSummary,
): DealHealthFeatures {
  const now = new Date();

  let emailsLast7Days = 0;
  let emailsLast30Days = 0;
  let meetingsLast14Days = 0;
  let meetingsLast30Days = 0;
  let hasUpcomingMeeting = false;
  let latestActivityDate: Date | null = null;

  for (const activity of activities) {
    const type = activity.activityType.toLowerCase();

    // Track the most recent activity
    if (
      latestActivityDate === null ||
      activity.occurredAt > latestActivityDate
    ) {
      latestActivityDate = activity.occurredAt;
    }

    if (type === "email") {
      if (isWithinDays(activity.occurredAt, now, 7)) emailsLast7Days++;
      if (isWithinDays(activity.occurredAt, now, 30)) emailsLast30Days++;
    }

    if (type === "meeting") {
      // Future meetings count as upcoming
      if (activity.occurredAt > now) {
        hasUpcomingMeeting = true;
      }
      if (isWithinDays(activity.occurredAt, now, 14)) meetingsLast14Days++;
      if (isWithinDays(activity.occurredAt, now, 30)) meetingsLast30Days++;
    }
  }

  // avgResponseTimeHours: simplified — return 0 if no emails
  const avgResponseTimeHours = 0;

  const daysSinceLastActivity =
    latestActivityDate !== null ? daysBetween(now, latestActivityDate) : 999;

  const daysSinceStageChange = daysBetween(now, deal.stageEnteredAt);
  const stageVelocityDays = daysBetween(deal.stageEnteredAt, deal.createdAt);

  return {
    emailsLast7Days,
    emailsLast30Days,
    meetingsLast14Days,
    meetingsLast30Days,
    avgResponseTimeHours,
    daysSinceLastActivity,
    daysSinceStageChange,
    stageVelocityDays,
    hasUpcomingMeeting,
  };
}

// ---------------------------------------------------------------------------
// Lead score feature computation
// ---------------------------------------------------------------------------

export function computeLeadScoreFeatures(
  activities: ActivitySummary[],
  contact: ContactSummary,
): LeadScoreFeatures {
  const now = new Date();

  let emailsReceived = 0;
  let emailsSent = 0;
  let meetingsAttended = 0;
  let websiteVisits = 0;
  let contentDownloads = 0;
  let latestActivityDate: Date | null = null;

  for (const activity of activities) {
    const type = activity.activityType.toLowerCase();

    if (
      latestActivityDate === null ||
      activity.occurredAt > latestActivityDate
    ) {
      latestActivityDate = activity.occurredAt;
    }

    if (type === "email") {
      const direction = activity.detail["direction"] as string | undefined;
      if (direction === "inbound") {
        emailsReceived++;
      } else {
        emailsSent++;
      }
    }

    if (type === "meeting") meetingsAttended++;
    if (type === "website_visit") websiteVisits++;
    if (type === "content_download") contentDownloads++;
  }

  const daysSinceLastActivity =
    latestActivityDate !== null ? daysBetween(now, latestActivityDate) : 999;

  return {
    emailsReceived,
    emailsSent,
    meetingsAttended,
    websiteVisits,
    contentDownloads,
    daysSinceLastActivity,
    lifecycleStage: contact.lifecycleStage ?? "lead",
    hasCompany: contact.companyId !== null,
    hasPhone: contact.phone !== null,
  };
}
