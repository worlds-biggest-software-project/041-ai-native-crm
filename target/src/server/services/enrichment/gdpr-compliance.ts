/**
 * T159: GDPR compliance layer for enrichment
 *
 * Provides validation, transparency notices (Article 14), and erasure
 * request processing for GDPR-safe enrichment workflows.
 */

const ALLOWED_GDPR_BASES = [
  "legitimate_interest",
  "public_data",
  "consent",
] as const;

/**
 * Validates that an enrichment source has a documented GDPR legal basis.
 *
 * - Rejects if gdprBasis is null or empty.
 * - Rejects if gdprBasis is not in the allowed list.
 * - For "legitimate_interest", also requires a LIA document URL.
 */
export function validateEnrichmentGDPR(source: {
  gdprBasis: string | null;
  liaDocumentUrl: string | null;
}): { valid: boolean; reason?: string } {
  if (!source.gdprBasis) {
    return {
      valid: false,
      reason: "Enrichment source must have a documented GDPR legal basis",
    };
  }

  const basis = source.gdprBasis as (typeof ALLOWED_GDPR_BASES)[number];
  if (!ALLOWED_GDPR_BASES.includes(basis)) {
    return {
      valid: false,
      reason: `GDPR basis "${source.gdprBasis}" is not in the allowed list: ${ALLOWED_GDPR_BASES.join(", ")}`,
    };
  }

  if (basis === "legitimate_interest" && !source.liaDocumentUrl) {
    return {
      valid: false,
      reason:
        "Legitimate interest basis requires a LIA (Legitimate Interest Assessment) document URL",
    };
  }

  return { valid: true };
}

/**
 * Generates an Article 14 transparency notice for data subjects whose
 * information has been enriched from a third-party source.
 */
export function generateArticle14Notice(
  entityType: string,
  enrichmentLog: {
    sourceUrl?: string;
    changes: Record<string, unknown>;
  },
): string {
  const fields = Object.keys(enrichmentLog.changes);
  const fieldList = fields.length > 0 ? fields.join(", ") : "none";

  const lines = [
    "GDPR Article 14 Transparency Notice",
    "=====================================",
    "",
    `Entity type: ${entityType}`,
    `Fields enriched: ${fieldList}`,
  ];

  if (enrichmentLog.sourceUrl) {
    lines.push(`Data source: ${enrichmentLog.sourceUrl}`);
  }

  lines.push(
    "",
    "This data was obtained from publicly available sources or third-party",
    "data providers under a lawful basis as documented in our data processing",
    "records. You have the right to access, rectify, or erase this data at",
    "any time by contacting our data protection officer.",
  );

  return lines.join("\n");
}

/**
 * Processes a GDPR erasure (right to be forgotten) request by calculating
 * which fields should be reverted to their pre-enrichment values and which
 * enrichment logs should be deleted.
 */
export function processErasureRequest(
  entityId: string,
  entityType: string,
  enrichmentLogs: {
    id?: string;
    changes: Record<string, { old: unknown; new: unknown }>;
  }[],
): { fieldsToRevert: Record<string, unknown>; logsToDelete: string[] } {
  const fieldsToRevert: Record<string, unknown> = {};
  const logsToDelete: string[] = [];

  // Process logs in order — for each enriched field, revert to the
  // original (oldest) pre-enrichment value.
  for (const log of enrichmentLogs) {
    if (log.id) {
      logsToDelete.push(log.id);
    }

    const changes = log.changes;
    for (const [field, change] of Object.entries(changes)) {
      // Only set the revert value if we haven't already captured it
      // from an earlier log (the earliest "old" value is the original).
      if (!(field in fieldsToRevert)) {
        fieldsToRevert[field] = change.old;
      }
    }
  }

  // Suppress unused parameter warnings — these are part of the interface
  // contract and will be used for audit logging in production.
  void entityId;
  void entityType;

  return { fieldsToRevert, logsToDelete };
}
