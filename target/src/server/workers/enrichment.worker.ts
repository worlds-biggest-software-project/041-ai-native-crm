/**
 * T160: Enrichment worker
 *
 * BullMQ Worker on the "enrichment" queue. For each job:
 * 1. Loads active enrichment sources for the workspace
 * 2. Validates GDPR basis for each source
 * 3. Runs enrichment from each valid source
 * 4. Auto-applies changes above the confidence threshold
 * 5. Stores pending enrichment logs for manual review otherwise
 */

import { Worker, type Job } from "bullmq";
import { redis } from "@/server/lib/redis";
import { db } from "@/server/db";
import {
  enrichmentSources,
  enrichmentLogs,
} from "@/server/db/schema/enrichment";
import { eq, and } from "drizzle-orm";
import { validateEnrichmentGDPR } from "@/server/services/enrichment/gdpr-compliance";
import type { EnrichmentConfig } from "@/server/services/enrichment/enrichment-engine";
import { OpenCorporatesSource } from "@/server/services/enrichment/sources/opencorporates";
import { CompanyRegistriesSource } from "@/server/services/enrichment/sources/company-registries";

interface EnrichmentJobData {
  entityType: string;
  entityId: string;
  workspaceId: string;
}

const DEFAULT_AUTO_APPLY_THRESHOLD = 0.9;

/**
 * Maps source types to their implementation instances.
 */
function getSourceImplementation(sourceType: string) {
  switch (sourceType) {
    case "opencorporates":
      return new OpenCorporatesSource();
    case "company_registries":
      return new CompanyRegistriesSource();
    case "company_registries_sec":
      return new CompanyRegistriesSource("sec_edgar");
    default:
      return null;
  }
}

async function processEnrichment(job: Job<EnrichmentJobData>) {
  const { entityType, entityId, workspaceId } = job.data;

  console.log(
    `[EnrichmentWorker] Processing job ${job.id} for ${entityType}:${entityId} in workspace ${workspaceId}`,
  );

  // Load active enrichment sources for the workspace
  const sources = await db
    .select()
    .from(enrichmentSources)
    .where(
      and(
        eq(enrichmentSources.workspaceId, workspaceId),
        eq(enrichmentSources.isActive, true),
      ),
    );

  if (sources.length === 0) {
    console.log(
      `[EnrichmentWorker] No active enrichment sources for workspace ${workspaceId}`,
    );
    return;
  }

  // TODO: Load entity data from the appropriate table based on entityType.
  // For now, pass an empty object — the mock sources will still return data.
  const entityData: Record<string, unknown> = {};

  for (const source of sources) {
    // Validate GDPR basis
    const gdprCheck = validateEnrichmentGDPR({
      gdprBasis: source.gdprBasis,
      liaDocumentUrl: source.liaDocumentUrl,
    });

    if (!gdprCheck.valid) {
      console.warn(
        `[EnrichmentWorker] Skipping source "${source.name}" — GDPR validation failed: ${gdprCheck.reason}`,
      );
      continue;
    }

    // Get the source implementation
    const impl = getSourceImplementation(source.sourceType);
    if (!impl) {
      console.warn(
        `[EnrichmentWorker] No implementation for source type "${source.sourceType}"`,
      );
      continue;
    }

    try {
      const result = await impl.enrich(entityType, entityData);

      if (Object.keys(result.changes).length === 0) {
        console.log(
          `[EnrichmentWorker] Source "${source.name}" returned no changes`,
        );
        continue;
      }

      // Determine auto-apply threshold from source config
      const sourceConfig = source.config as EnrichmentConfig | null;
      const threshold =
        sourceConfig?.autoApplyThreshold ?? DEFAULT_AUTO_APPLY_THRESHOLD;

      // Check if all changes meet the auto-apply threshold
      const allAboveThreshold = Object.values(result.changes).every(
        (change) => change.confidence >= threshold,
      );

      const status = allAboveThreshold ? "applied" : "pending";

      if (allAboveThreshold) {
        // TODO: Apply changes directly to the entity record.
        // For now, just log that we would auto-apply.
        console.log(
          `[EnrichmentWorker] Auto-applying changes from "${source.name}" (all confidence >= ${threshold})`,
        );
      }

      // Store the enrichment log
      await db.insert(enrichmentLogs).values({
        workspaceId,
        sourceId: source.id,
        entityType,
        entityId,
        changes: result.changes,
        sourceUrl: result.sourceUrl ?? null,
        status,
      });

      console.log(
        `[EnrichmentWorker] Logged enrichment from "${source.name}" with status="${status}"`,
      );
    } catch (error) {
      console.error(
        `[EnrichmentWorker] Error running source "${source.name}":`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

export const enrichmentWorker = new Worker<EnrichmentJobData>(
  "enrichment",
  processEnrichment,
  {
    connection: redis,
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000,
    },
  },
);

enrichmentWorker.on("completed", (job) => {
  console.log(`[EnrichmentWorker] Job ${job.id} completed`);
});

enrichmentWorker.on("failed", (job, error) => {
  console.error(`[EnrichmentWorker] Job ${job?.id} failed:`, error.message);
});
