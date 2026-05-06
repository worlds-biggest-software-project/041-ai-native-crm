# Standards & API Reference

> Project: AI-Native CRM · Generated: 2026-05-06

## Industry Standards & Specifications

### ISO Standards

**ISO/IEC 27001:2022 — Information Security Management Systems**
URL: https://www.iso.org/standard/27001
The baseline security certification expected by enterprise CRM buyers. ISO 27001:2022 is now mandatory for all new certifications; EU NIS2 enforcement is driving demand across SaaS supply chains. An AI-native CRM handling sales pipeline and contact data will need this for enterprise adoption. Estimated certification cost: $15K–$50K over 6–15 months.

**ISO/IEC 27018:2019 — Protection of PII in Public Clouds**
URL: https://www.iso.org/standard/76559.html
Extends ISO 27001 to cover Personally Identifiable Information (PII) processing in public cloud environments. Directly relevant to a CRM that stores contact records, email content, and enrichment data in multi-tenant infrastructure.

**ISO 8601 — Date and Time Representation**
URL: https://www.iso.org/standard/70907.html
Standard for date/time encoding in API responses (e.g., `2026-05-06T14:30:00Z`). Expected in all REST API payloads for timestamps on contact activity logs, deal stage transitions, and meeting records.

---

### W3C & IETF Standards

**RFC 6350 — vCard Format Specification (vCard 4.0)**
URL: https://www.rfc-editor.org/rfc/rfc6350.html
The standard data format for representing and exchanging contact information — names, addresses, phone numbers, email addresses, and related attributes. vCard 4.0 (`.vcf`) is the universal import/export format for contacts in all major CRM platforms including Salesforce, HubSpot, and Pipedrive. Essential for onboarding, migration, and interoperability.

**RFC 5545 — iCalendar Format Specification**
URL: https://icalendar.org/RFC-Specifications/iCalendar-RFC-5545/
Defines the `.ics` format for representing and exchanging calendaring and scheduling data: events (VEVENT), to-dos (VTODO), and free/busy information. Required for meeting activity logging — a core AI-native CRM feature when syncing calendar meetings to deal timelines.

**RFC 4791 — CalDAV: Calendaring Extensions to WebDAV**
URL: https://datatracker.ietf.org/doc/html/rfc4791
Defines the CalDAV protocol for accessing and managing calendar data on a server using HTTP. While Google Calendar and Microsoft Graph APIs have largely superseded direct CalDAV in modern integrations, CalDAV remains the standard for on-premises calendar server compatibility (e.g., self-hosted deployments connecting to Nextcloud or Zimbra).

**RFC 5321 — SMTP (Simple Mail Transfer Protocol)**
URL: https://datatracker.ietf.org/doc/html/rfc5321
Defines the standard protocol for email transmission. CRMs with inbox-sync features must handle SMTP for outbound email sending.

**RFC 3501 — IMAP (Internet Message Access Protocol)**
URL: https://datatracker.ietf.org/doc/html/rfc3501
Defines the IMAP protocol for accessing and managing email messages on a server. Central to CRM inbox-sync features for reading and processing inbound email. Note: both Gmail and Microsoft 365 now require OAuth 2.0 for IMAP authentication — plain-auth IMAP access has been deprecated by both providers.

**RFC 7643 / RFC 7644 — SCIM 2.0 (System for Cross-domain Identity Management)**
URL: https://datatracker.ietf.org/doc/html/rfc7644
Defines the SCIM 2.0 protocol for automating provisioning and de-provisioning of user accounts across enterprise systems. Enterprise CRM deployments require SCIM to integrate with identity providers (Okta, Azure AD, Google Workspace) for automatic seat management and access revocation when employees leave.

**RFC 7519 — JSON Web Token (JWT)**
URL: https://datatracker.ietf.org/doc/html/rfc7519
Defines the JWT format used for OAuth 2.0 access tokens and OpenID Connect ID tokens. All modern CRM APIs return JWTs as bearer tokens; CRM developers must validate JWT signatures, expiry, and claims.

---

### Data Model & API Specifications

**OpenAPI Specification 3.1 (OAS 3.1)**
URL: https://spec.openapis.org/oas/v3.1.0.html
The industry-standard format for describing REST APIs in a machine-readable JSON/YAML document. OAS 3.1 is a superset of JSON Schema Draft 2020-12. All major CRMs (Salesforce, HubSpot, Pipedrive, Zoho) publish OpenAPI specs. An AI-native CRM should publish an OpenAPI 3.1 spec to enable SDK generation, Postman/Insomnia import, and AI tool discovery.

**JSON Schema — Draft 2020-12**
URL: https://json-schema.org/draft/2020-12
Standard for validating and describing the structure of JSON data. Used in OpenAPI 3.1 schema objects for defining CRM entity structures (Contact, Company, Deal, Activity). Enables runtime validation of API request/response payloads.

**OData v4.01 (Open Data Protocol) — OASIS Standard**
URL: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html
An ISO/IEC-approved OASIS standard for building and consuming queryable RESTful APIs over rich data sources. Microsoft Dynamics 365 (Dataverse) exposes its entire CRM API via OData v4. OData provides standardised querying syntax (`$select`, `$filter`, `$expand`, `$orderby`, `$top`) which AI agents can use to query CRM data without bespoke integrations. Relevant if building Dynamics compatibility or designing a similarly query-capable API.

**GraphQL — Query Language Specification**
URL: https://spec.graphql.org/
Used by Twenty CRM (REST + GraphQL) and Zoho CRM (enterprise tiers) for flexible, client-specified data retrieval. GraphQL reduces over-fetching, which is valuable for AI agent integrations that need to retrieve specific CRM fields without loading full record payloads.

---

### Security & Authentication Standards

**OAuth 2.0 — RFC 6749**
URL: https://datatracker.ietf.org/doc/html/rfc6749
The foundational authorisation protocol for all major CRM APIs. All major CRM providers (Salesforce, HubSpot, Attio, Pipedrive, Dynamics 365, Zoho) use OAuth 2.0. Web Server Flow (authorisation code) is the standard pattern for third-party CRM integrations; Client Credentials Flow is used for service-to-service automation.

**OpenID Connect 1.0 (OIDC)**
URL: https://openid.net/specs/openid-connect-core-1_0.html
Extends OAuth 2.0 with standardised user authentication and identity claims (ID Token as JWT). Required for SSO (Single Sign-On) integration with identity providers including Okta, Microsoft Entra ID, Google Workspace, and Auth0. Enterprise CRM buyers expect OIDC-based SSO as a table-stakes feature.

**GDPR — General Data Protection Regulation (EU) 2016/679**
URL: https://gdpr-info.eu/
The primary European data privacy regulation governing how CRMs store, process, and enrich personal contact data. Article 6 defines the six lawful bases for processing; legitimate interest (Article 6(1)(f)) is the most commonly claimed basis for B2B contact enrichment but requires a documented Legitimate Interest Assessment (LIA). Article 14 requires transparency about the source of contact data — directly relevant to enrichment pipelines that add data from third-party sources. Privacy-by-design (Article 25) must be considered in data model and enrichment architecture.

**CCPA — California Consumer Privacy Act (California, USA)**
URL: https://oag.ca.gov/privacy/ccpa
US state privacy law applicable to CRM contact data for California residents. The B2B contact data exemption expired in January 2023; CCPA data minimisation requirements (Section 1798.100(c)) constrain enrichment scope. An AI-native CRM enriching records must implement opt-out mechanisms and data deletion workflows.

**SOC 2 Type II — AICPA Trust Services Criteria**
URL: https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services
The baseline security audit standard expected by US enterprise CRM buyers. SOC 2 Type II demonstrates continuous security, availability, and confidentiality controls over a 6–12 month audit period. Expected alongside ISO 27001 for enterprise GTM.

**OWASP API Security Top 10 (2023)**
URL: https://owasp.org/API-Security/editions/2023/en/0x00-header/
The authoritative reference for API security risks. An AI-native CRM API must be designed with these risks in mind: broken object-level authorisation (BOLA), excessive data exposure, mass assignment, and injection vulnerabilities are the most common CRM API attack vectors.

---

### MCP Server Specifications

**Model Context Protocol (MCP) — Specification 2025-11-25**
URL: https://modelcontextprotocol.io/specification/2025-11-25
GitHub: https://github.com/modelcontextprotocol
Open protocol introduced by Anthropic (November 2024) for standardising how AI assistants connect to external data sources and tools. MCP takes inspiration from the Language Server Protocol — it provides a universal interface for AI agents to read data, execute functions, and receive contextual prompts from external systems. OpenAI adopted MCP in March 2025; it is now the de-facto standard for CRM-to-AI-agent connectivity. An AI-native CRM should ship a native MCP server to enable out-of-the-box AI assistant integration without custom connectors.

Key CRM-relevant MCP capabilities:
- **Resources**: expose CRM records (contacts, deals, activity history) as browsable structured data for AI context
- **Tools**: expose CRM write operations (create contact, update deal stage, log activity) as callable functions for AI agents
- **Prompts**: define reusable prompt templates for common CRM tasks (meeting prep, deal summary, follow-up drafting)

---

## Similar Products — Developer Documentation & APIs

### Salesforce Sales Cloud

- **Description:** The dominant enterprise CRM with REST, SOAP, Bulk, and Streaming APIs across hundreds of objects. REST API is the primary interface for modern integrations.
- **API Documentation:** https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/ (v66.0, Spring '26)
- **SDKs/Libraries:** JSforce (Node.js — community), simple-salesforce (Python — community), Apex SDK (server-side Salesforce platform language)
- **Developer Guide:** https://developer.salesforce.com/docs/
- **MCP:** No official general-purpose MCP server; Agentforce framework restricted; third-party MCP servers via CData and Merge
- **Standards:** REST/JSON, SOAP, Bulk API 2.0, Streaming API (CometD), OpenAPI 3.x for REST
- **Authentication:** OAuth 2.0 (Web Server Flow, JWT Bearer Flow, Client Credentials); My Domain-specific endpoints required as of 2026

### HubSpot CRM

- **Description:** Popular mid-market CRM platform with a date-versioned REST API (`2026-03`) covering contacts, companies, deals, tickets, pipelines, associations, properties, and owners.
- **API Documentation:** https://developers.hubspot.com/docs/api-reference/latest/overview
- **SDKs/Libraries:** hubspot-api-client (Node.js, Python, PHP, Ruby, Go, C#) — official; https://github.com/HubSpot
- **Developer Guide:** https://developers.hubspot.com/
- **MCP:** Official HubSpot MCP Server (Remote) — https://developers.hubspot.com/mcp; also available via community packages
- **Standards:** REST/JSON; date-based versioning scheme; OpenAPI spec available
- **Authentication:** OAuth 2.0 (Private Apps for internal use; OAuth for marketplace apps); API key auth deprecated

### Attio

- **Description:** Fastest-growing modern CRM with a programmable data model; REST API for reading/writing CRM data, managing custom objects, triggering workflows, and subscribing to webhooks.
- **API Documentation:** https://developers.attio.com/docs
- **SDKs/Libraries:** Official SDKs for Node.js/TypeScript, PHP, .NET, Python, Java, Go; App SDK (TypeScript + React) for extending the Attio UI
- **Developer Guide:** https://attio.com/platform/developers
- **MCP:** No official MCP server identified; community integrations via Zapier and Make
- **Standards:** REST/JSON; webhooks with HMAC SHA256 signatures; OpenAPI available
- **Authentication:** Access tokens (workspace-scoped) or OAuth 2.0 (for published integrations); rate limits: 100 req/s reads, 25 req/s writes

### Microsoft Dynamics 365 Sales (Dataverse Web API)

- **Description:** Enterprise CRM built on Microsoft Dataverse; the Web API is an OData v4 REST service exposing all CRM and ERP entities. The entire Dynamics 365 ecosystem (Sales, Customer Service, Power Platform) runs on Dataverse.
- **API Documentation:** https://learn.microsoft.com/en-us/rest/dynamics365/
- **SDKs/Libraries:** Microsoft.CrmSdk.CoreAssemblies (.NET); Dataverse client for C#; community libraries for Python and Node.js; Power Automate (no-code)
- **Developer Guide:** https://learn.microsoft.com/en-us/dynamics365/customerengagement/on-premises/developer/use-microsoft-dynamics-365-web-api
- **MCP:** No official MCP server; Power Platform Copilot is the Microsoft AI agent framework
- **Standards:** OData v4.01 (OASIS); REST/JSON; OpenAPI 3.x; SCIM 2.0 for user provisioning via Microsoft Entra ID
- **Authentication:** OAuth 2.0 via Microsoft Entra ID (formerly Azure AD); supports Client Credentials, Authorisation Code, and On-Behalf-Of flows

### Twenty CRM (Open Source)

- **Description:** The leading open-source CRM (AGPL-3.0, ~44K GitHub stars); provides REST and GraphQL APIs, webhooks, OAuth, a TypeScript SDK for extensions, and a native MCP server for AI agent integration.
- **API Documentation:** https://docs.twenty.com/developers/introduction
- **REST API:** https://twenty.com/developers/rest-api/core
- **GraphQL API:** https://twenty.com/developers/graphql/core
- **SDKs/Libraries:** twenty-sdk (TypeScript); scaffold extensions with `npx create-twenty-app`; CLI via `twenty-cli` (community); Pipedream integration
- **MCP:** Native MCP server ships with every Cloud workspace; community MCP server: https://github.com/mhenry3164/twenty-crm-mcp-server; GitHub issue tracking official MCP: twentyhq/twenty#12953
- **Standards:** REST/JSON; GraphQL; webhooks; OpenAPI
- **Authentication:** Bearer token (API key); OAuth 2.0 for MCP connections; self-hosted deployments use JWT-based auth

### Pipedrive

- **Description:** Pipeline-centric CRM popular with SMBs; comprehensive REST API covering deals, persons, organisations, activities, pipelines, and products; one of the most developer-friendly CRM APIs.
- **API Documentation:** https://developers.pipedrive.com/docs/api/v1
- **SDKs/Libraries:** pipedrive/client-nodejs (Node.js — official); community clients for Python, PHP, Ruby, .NET; OpenAPI 3 spec available for import into Postman or Insomnia
- **Developer Guide:** https://pipedrive.readme.io/docs/getting-started
- **MCP:** No official MCP server identified
- **Standards:** REST/JSON; CORS-enabled; OpenAPI 3; webhooks
- **Authentication:** API token (simpler) or OAuth 2.0 (for public apps and marketplace integrations)

### Zoho CRM

- **Description:** Broad mid-market CRM with both REST and GraphQL APIs (GraphQL available on Enterprise+ tiers); V8 REST API covers all modules; SDKs in six languages; supports Canvas (custom UI builder) and Deluge (scripting language).
- **API Documentation:** https://www.zoho.com/crm/developer/docs/api/v8/
- **GraphQL API:** https://www.zoho.com/crm/developer/graphql-apis.html
- **SDKs/Libraries:** Official SDKs for Java, Python, PHP, Node.js, C#, Ruby, JavaScript; https://www.zoho.com/crm/developer/api.html
- **Developer Guide:** https://www.zoho.com/crm/developer/
- **MCP:** No official MCP server identified
- **Standards:** REST/JSON; GraphQL (Enterprise tiers); OAuth 2.0; OpenAPI
- **Authentication:** OAuth 2.0 (required for all API access since 2019); supports Server-based, PKCE, Client Credentials, and Device Grant flows

### Google Workspace APIs (Gmail + Calendar)

- **Description:** The Google APIs used for inbox and calendar sync — a foundational requirement for AI-native CRM email and meeting capture. Gmail API provides full access to email; Google Calendar API covers events and attendees.
- **Gmail API Documentation:** https://developers.google.com/gmail/api
- **Google Calendar API Documentation:** https://developers.google.com/workspace/calendar/api/guides/overview
- **SDKs/Libraries:** Google API client libraries for Python, Node.js, Java, Go, PHP, .NET, Ruby
- **Developer Guide:** https://developers.google.com/workspace/guides/enable-apis
- **Standards:** REST/JSON; Push Notifications via webhooks (Gmail); OAuth 2.0 with refresh token flow
- **Authentication:** OAuth 2.0 required; scopes must be declared; domain-wide delegation available for Google Workspace admin-authorised deployments; plain IMAP/SMTP auth deprecated — OAuth 2.0 now mandatory

### Microsoft Graph API (Outlook + Exchange)

- **Description:** The unified REST API for accessing all Microsoft 365 data including Outlook email, calendar, contacts, and Teams messages. Recommended by Microsoft as the preferred integration path over legacy IMAP/EWS for CRM inbox sync.
- **API Documentation:** https://learn.microsoft.com/en-us/graph/overview
- **SDKs/Libraries:** Microsoft Graph SDK for .NET, JavaScript/TypeScript, Python, Java, Go, PHP
- **Developer Guide:** https://learn.microsoft.com/en-us/graph/use-the-api
- **Standards:** REST/JSON; webhooks (change notifications); OpenAPI; delta query for efficient sync
- **Authentication:** OAuth 2.0 via Microsoft Entra ID; IMAP/SMTP with OAuth 2.0 supported for legacy clients; plain auth deprecated in Exchange Online

---

## Notes

**Email sync OAuth requirement (2026):** Both Google (Gmail) and Microsoft (Exchange Online / Outlook.com) have deprecated plain-auth IMAP and SMTP. All CRM inbox-sync integrations must use OAuth 2.0 token-based authentication. This is a non-trivial implementation requirement for an open-source CRM that targets on-premises deployments where OAuth redirect flows may be complex for non-technical users.

**MCP as the emerging standard for AI-CRM integration:** MCP has achieved rapid industry adoption in 2025–2026 (OpenAI, Google, Microsoft Copilot). An AI-native CRM that ships a first-class MCP server is positioned to be natively accessible by Claude, ChatGPT, Cursor, and other AI tools out of the box — a significant differentiator over incumbent CRMs where MCP support is absent (Salesforce), fragmented (community-built), or proprietary (HubSpot's Remote MCP requires their cloud platform).

**OData v4 as a query standard for AI agents:** OData's standardised query syntax (`$filter`, `$expand`, `$select`) is well-understood by AI coding assistants and agents. Implementing an OData-compatible query layer on top of a CRM REST API would allow AI agents to construct complex queries without bespoke integration knowledge — a natural fit for an AI-native CRM.

**GraphQL adoption in CRM:** Twenty CRM and Zoho CRM both offer GraphQL APIs; this enables AI agents to request exactly the fields needed without over-fetching. Pairing GraphQL with an MCP server (where the MCP tool definitions map to GraphQL queries) is an emerging pattern for AI-agent-friendly CRM architecture.

**GDPR enrichment risk:** The European Data Protection Board's Guidelines 1/2024 on Legitimate Interest tighten the documentation requirements for Article 6(1)(f) claims. CRM enrichment pipelines that add data from third-party sources (LinkedIn, company registries, social media) must document a Legitimate Interest Assessment for each data source and provide Article 14 transparency notices. Privacy-safe enrichment from open public registries (Companies House, OpenCorporates) with auditable provenance is a meaningful differentiator for EU buyers.
