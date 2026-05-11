/**
 * T156: Enrichment engine interface
 *
 * Defines the contract that all enrichment sources must implement,
 * plus the result and configuration types used by the enrichment pipeline.
 */

export interface EnrichmentSource {
  name: string;
  sourceType: string;
  enrich(
    entityType: string,
    entityData: Record<string, unknown>,
  ): Promise<EnrichmentResult>;
}

export interface EnrichmentResult {
  changes: Record<string, { old: unknown; new: unknown; confidence: number }>;
  sourceUrl?: string;
  rawResponse?: unknown;
}

export interface EnrichmentConfig {
  apiKey?: string;
  rateLimit?: number;
  autoApplyThreshold?: number;
}
