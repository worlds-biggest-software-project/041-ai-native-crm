/**
 * T158: Company registries enrichment source
 *
 * Supports UK Companies House and US SEC EDGAR registries.
 * For MVP, API calls are mocked and return simulated registration data.
 */

import type { EnrichmentSource, EnrichmentResult } from "../enrichment-engine";

type Registry = "companies_house" | "sec_edgar";

export class CompanyRegistriesSource implements EnrichmentSource {
  name = "Company Registries";
  sourceType = "company_registries";

  private registry: Registry;

  constructor(registry: Registry = "companies_house") {
    this.registry = registry;
  }

  async enrich(
    entityType: string,
    entityData: Record<string, unknown>,
  ): Promise<EnrichmentResult> {
    if (entityType !== "company") {
      return { changes: {} };
    }

    const companyName = entityData["name"] as string | undefined;
    if (!companyName) {
      return { changes: {} };
    }

    try {
      if (this.registry === "companies_house") {
        return await this.enrichFromCompaniesHouse(companyName, entityData);
      } else {
        return await this.enrichFromSECEdgar(companyName, entityData);
      }
    } catch (error) {
      console.error(
        `[CompanyRegistriesSource] ${this.registry} enrichment failed:`,
        error instanceof Error ? error.message : error,
      );
      return { changes: {} };
    }
  }

  /**
   * MVP mock — simulates a UK Companies House API response.
   * In production: GET https://api.company-information.service.gov.uk/search/companies?q=${name}
   */
  private async enrichFromCompaniesHouse(
    companyName: string,
    entityData: Record<string, unknown>,
  ): Promise<EnrichmentResult> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const changes: EnrichmentResult["changes"] = {};

    changes["registrationNumber"] = {
      old: entityData["registrationNumber"] ?? null,
      new: "UK-" + companyName.substring(0, 3).toUpperCase() + "-12345",
      confidence: 0.8,
    };

    changes["registeredAddress"] = {
      old: entityData["registeredAddress"] ?? null,
      new: "123 Example Street, London, EC1A 1BB",
      confidence: 0.85,
    };

    changes["companyStatus"] = {
      old: entityData["companyStatus"] ?? null,
      new: "Active",
      confidence: 0.95,
    };

    changes["incorporationDate"] = {
      old: entityData["incorporationDate"] ?? null,
      new: "2018-06-20",
      confidence: 0.95,
    };

    return {
      changes,
      sourceUrl: `https://find-and-update.company-information.service.gov.uk/company/12345`,
      rawResponse: { source: "companies_house", companyName },
    };
  }

  /**
   * MVP mock — simulates a US SEC EDGAR API response.
   * In production: GET https://efts.sec.gov/LATEST/search-index?q=${name}
   */
  private async enrichFromSECEdgar(
    companyName: string,
    entityData: Record<string, unknown>,
  ): Promise<EnrichmentResult> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const changes: EnrichmentResult["changes"] = {};

    changes["cikNumber"] = {
      old: entityData["cikNumber"] ?? null,
      new: "0001234567",
      confidence: 0.8,
    };

    changes["sicCode"] = {
      old: entityData["sicCode"] ?? null,
      new: "7372",
      confidence: 0.85,
    };

    changes["stateOfIncorporation"] = {
      old: entityData["stateOfIncorporation"] ?? null,
      new: "DE",
      confidence: 0.9,
    };

    return {
      changes,
      sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(companyName)}&CIK=&type=&dateb=&owner=include&count=10&search_text=&action=getcompany`,
      rawResponse: { source: "sec_edgar", companyName },
    };
  }
}
