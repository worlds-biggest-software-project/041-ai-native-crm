/**
 * T152: Unit tests for GDPR compliance layer
 *
 * Tests the validateEnrichmentGDPR, generateArticle14Notice, and
 * processErasureRequest functions from the enrichment GDPR compliance module.
 */

import { describe, it, expect } from "vitest";
import {
  validateEnrichmentGDPR,
  generateArticle14Notice,
  processErasureRequest,
} from "@/server/services/enrichment/gdpr-compliance";

describe("validateEnrichmentGDPR", () => {
  it("rejects source without documented GDPR basis", () => {
    const result = validateEnrichmentGDPR({
      gdprBasis: "",
      liaDocumentUrl: null,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("documented GDPR legal basis");
  });

  it("rejects source with null gdpr_basis", () => {
    const result = validateEnrichmentGDPR({
      gdprBasis: null,
      liaDocumentUrl: null,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("documented GDPR legal basis");
  });

  it("accepts source with legitimate_interest basis and LIA doc", () => {
    const result = validateEnrichmentGDPR({
      gdprBasis: "legitimate_interest",
      liaDocumentUrl: "https://example.com/lia-assessment.pdf",
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects legitimate_interest without LIA document URL", () => {
    const result = validateEnrichmentGDPR({
      gdprBasis: "legitimate_interest",
      liaDocumentUrl: null,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("LIA");
  });

  it("accepts source with public_data basis", () => {
    const result = validateEnrichmentGDPR({
      gdprBasis: "public_data",
      liaDocumentUrl: null,
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("accepts source with consent basis", () => {
    const result = validateEnrichmentGDPR({
      gdprBasis: "consent",
      liaDocumentUrl: null,
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects source with invalid GDPR basis", () => {
    const result = validateEnrichmentGDPR({
      gdprBasis: "contract_performance",
      liaDocumentUrl: null,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not in the allowed list");
  });
});

describe("generateArticle14Notice", () => {
  it("returns formatted string with entity type and fields", () => {
    const notice = generateArticle14Notice("company", {
      sourceUrl: "https://opencorporates.com/companies/gb/12345",
      changes: {
        companyNumber: { old: null, new: "12345" },
        jurisdiction: { old: null, new: "gb" },
      },
    });

    expect(notice).toContain("Article 14");
    expect(notice).toContain("company");
    expect(notice).toContain("companyNumber");
    expect(notice).toContain("jurisdiction");
    expect(notice).toContain("opencorporates.com");
    expect(notice).toContain("right to access");
  });

  it("handles notice without sourceUrl", () => {
    const notice = generateArticle14Notice("contact", {
      changes: { email: { old: null, new: "test@example.com" } },
    });

    expect(notice).toContain("Article 14");
    expect(notice).toContain("contact");
    expect(notice).toContain("email");
    expect(notice).not.toContain("Data source:");
  });

  it("handles empty changes", () => {
    const notice = generateArticle14Notice("contact", {
      changes: {},
    });

    expect(notice).toContain("Fields enriched: none");
  });
});

describe("processErasureRequest", () => {
  it("identifies fields to revert from enrichment logs", () => {
    const result = processErasureRequest("entity-123", "company", [
      {
        id: "log-1",
        changes: {
          companyNumber: { old: null, new: "12345" },
          jurisdiction: { old: null, new: "gb" },
        },
      },
      {
        id: "log-2",
        changes: {
          companyNumber: { old: "12345", new: "67890" },
          status: { old: null, new: "Active" },
        },
      },
    ]);

    // Should revert to the original (earliest) old value
    expect(result.fieldsToRevert["companyNumber"]).toBeNull();
    expect(result.fieldsToRevert["jurisdiction"]).toBeNull();
    expect(result.fieldsToRevert["status"]).toBeNull();
    expect(result.logsToDelete).toEqual(["log-1", "log-2"]);
  });

  it("returns empty results when no enrichment logs", () => {
    const result = processErasureRequest("entity-456", "contact", []);

    expect(result.fieldsToRevert).toEqual({});
    expect(result.logsToDelete).toEqual([]);
  });

  it("handles logs without ids", () => {
    const result = processErasureRequest("entity-789", "company", [
      {
        changes: {
          name: { old: "Old Corp", new: "New Corp" },
        },
      },
    ]);

    expect(result.fieldsToRevert["name"]).toBe("Old Corp");
    expect(result.logsToDelete).toEqual([]);
  });
});
