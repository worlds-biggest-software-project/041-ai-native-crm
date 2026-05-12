/**
 * T157: OpenCorporates enrichment source
 *
 * Searches the OpenCorporates API by company domain or name and returns
 * simulated enrichment data (company_number, jurisdiction, incorporation_date,
 * status). For MVP, the API call is mocked.
 */

import type { EnrichmentSource, EnrichmentResult } from "../enrichment-engine";

export class OpenCorporatesSource implements EnrichmentSource {
  name = "OpenCorporates";
  sourceType = "opencorporates";

  async enrich(
    entityType: string,
    entityData: Record<string, unknown>,
  ): Promise<EnrichmentResult> {
    if (entityType !== "company") {
      return { changes: {} };
    }

    const companyName = entityData["name"] as string | undefined;
    const domain = entityData["domain"] as string | undefined;

    if (!companyName && !domain) {
      return { changes: {} };
    }

    try {
      // MVP: Mock the OpenCorporates API call.
      // In production this would be:
      //   GET https://api.opencorporates.com/v0.4/companies/search?q=${companyName}
      const mockResponse = await this.mockApiCall(companyName, domain);

      if (!mockResponse) {
        return { changes: {} };
      }

      const changes: EnrichmentResult["changes"] = {};

      if (mockResponse.company_number) {
        changes["companyNumber"] = {
          old: entityData["companyNumber"] ?? null,
          new: mockResponse.company_number,
          confidence: 0.85,
        };
      }

      if (mockResponse.jurisdiction) {
        changes["jurisdiction"] = {
          old: entityData["jurisdiction"] ?? null,
          new: mockResponse.jurisdiction,
          confidence: 0.9,
        };
      }

      if (mockResponse.incorporation_date) {
        changes["incorporationDate"] = {
          old: entityData["incorporationDate"] ?? null,
          new: mockResponse.incorporation_date,
          confidence: 0.95,
        };
      }

      if (mockResponse.status) {
        changes["companyStatus"] = {
          old: entityData["companyStatus"] ?? null,
          new: mockResponse.status,
          confidence: 0.9,
        };
      }

      return {
        changes,
        sourceUrl: `https://opencorporates.com/companies/${mockResponse.jurisdiction}/${mockResponse.company_number}`,
        rawResponse: mockResponse,
      };
    } catch (error) {
      console.error(
        "[OpenCorporatesSource] Enrichment failed:",
        error instanceof Error ? error.message : error,
      );
      return { changes: {} };
    }
  }

  /**
   * MVP mock — simulates an OpenCorporates API response.
   * Replace with a real HTTP call in production.
   */
  private async mockApiCall(
    companyName?: string,
    domain?: string,
  ): Promise<{
    company_number: string;
    jurisdiction: string;
    incorporation_date: string;
    status: string;
  } | null> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!companyName && !domain) {
      return null;
    }

    return {
      company_number: "12345678",
      jurisdiction: "gb",
      incorporation_date: "2015-03-15",
      status: "Active",
    };
  }
}
