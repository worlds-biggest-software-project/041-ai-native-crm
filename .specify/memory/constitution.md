<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial ratification)

  Added principles:
    - I. AI-Native by Default
    - II. Privacy-First Data Handling
    - III. Open Standards & Interoperability
    - IV. Test-First Development
    - V. Simplicity & Incremental Delivery

  Added sections:
    - Technology & Compliance Constraints
    - Development Workflow

  Removed sections: none (initial creation)

  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ compatible (Constitution Check
      section references constitution file generically)
    - .specify/templates/spec-template.md — ✅ compatible (no constitution-
      specific references)
    - .specify/templates/tasks-template.md — ✅ compatible (no constitution-
      specific references)
    - .specify/templates/checklist-template.md — ✅ compatible
    - .specify/templates/commands/ — directory does not exist; no action needed

  Follow-up TODOs: none
-->

# AI-Native CRM Constitution

## Core Principles

### I. AI-Native by Default

AI MUST be the foundational design principle, not a bolt-on capability.
Every data-entry surface MUST default to automatic population from
connected inboxes, calendars, and call transcripts. Manual input MUST
exist only as a fallback when automated extraction cannot resolve
ambiguity.

- Zero-entry pipeline population is the primary interaction model:
  reps read the CRM, they do not fill it in.
- LLM-generated summaries, scoring, and follow-up drafts MUST be
  first-class features, not optional add-ons.
- All ML/LLM features MUST expose confidence scores and allow human
  override — the system assists, it does not dictate.

### II. Privacy-First Data Handling

All personal data processing MUST comply with GDPR and CCPA from day
one — privacy is a design constraint, not a post-launch audit item.

- Contact enrichment MUST use only permissioned or auditable public
  data sources (e.g., Companies House, OpenCorporates) with documented
  provenance for every enriched field.
- A Legitimate Interest Assessment (GDPR Article 6(1)(f)) MUST be
  documented for each enrichment data source before it is integrated.
- Article 14 transparency notices MUST be generated for any contact
  record containing data sourced from third parties.
- Data retention, deletion, and opt-out workflows MUST be implemented
  before any enrichment pipeline goes live.
- Self-hosted deployment MUST remain a supported option so that
  privacy-sensitive organisations retain full data sovereignty.

### III. Open Standards & Interoperability

The platform MUST adopt established open standards over proprietary
protocols to maximise interoperability and reduce vendor lock-in.

- API: OpenAPI 3.1 specification MUST be published and kept in sync
  with every release.
- Authentication: OAuth 2.0 and OpenID Connect MUST be the only
  supported auth protocols for external integrations.
- Data formats: vCard (RFC 6350) for contact import/export, iCalendar
  (RFC 5545) for calendar data, ISO 8601 for all timestamps.
- AI agent integration: a native MCP (Model Context Protocol) server
  MUST ship with the platform, exposing CRM resources, tools, and
  prompts per the MCP specification.
- Email sync: OAuth 2.0 token-based authentication MUST be used for
  Gmail and Microsoft Graph — plain-auth IMAP/SMTP MUST NOT be
  supported.
- The codebase MUST remain open-source under a licence that permits
  self-hosting without vendor lock-in.

### IV. Test-First Development

Tests MUST be written before implementation code. The Red-Green-Refactor
cycle is mandatory for all feature work.

- Contract tests MUST cover every public API endpoint before the
  endpoint is implemented.
- Integration tests MUST verify email sync, calendar sync, enrichment
  pipelines, and ML scoring against real (or realistic sandboxed)
  external services — mocks MUST NOT substitute for integration-level
  validation of external-facing boundaries.
- Each user story MUST be independently testable: if only one story is
  implemented, the test suite for that story MUST pass in isolation.

### V. Simplicity & Incremental Delivery

Start with the simplest implementation that delivers user value.
Complexity MUST be justified and documented.

- YAGNI: do not build for hypothetical future requirements. Three
  similar lines of code are preferable to a premature abstraction.
- Each user story MUST be deliverable and demonstrable independently —
  no story may depend on another story being complete to function.
- MVP scope is: contact/company/opportunity management, two-way email
  and calendar sync, pipeline board, LLM meeting summaries, ML deal
  scoring, and REST API with webhooks. Features beyond this list MUST
  NOT be started until MVP is validated.
- Complexity violations (additional abstractions, extra services,
  non-standard patterns) MUST be logged in the plan's Complexity
  Tracking table with justification.

## Technology & Compliance Constraints

- **Security certifications**: ISO 27001:2022 and SOC 2 Type II
  readiness MUST be considered in architecture decisions from day one,
  even if formal certification is deferred.
- **API security**: OWASP API Security Top 10 (2023) MUST be used as
  the threat model for all API design reviews. Broken Object-Level
  Authorisation (BOLA), excessive data exposure, and mass assignment
  are the highest-priority risks.
- **User provisioning**: SCIM 2.0 MUST be supported for enterprise
  identity provider integration (Okta, Microsoft Entra ID, Google
  Workspace).
- **Licence compliance**: Any dependency with AGPL-3.0 or similar
  copyleft obligations MUST be reviewed for compatibility with the
  project's chosen licence before adoption.

## Development Workflow

- All feature work MUST begin from a feature branch created from the
  main branch.
- Every feature MUST have a specification (spec.md), implementation
  plan (plan.md), and task list (tasks.md) before coding begins.
- Pull requests MUST pass all contract and integration tests before
  merge.
- Commit messages MUST be concise and describe the "why", not the
  "what".
- Code reviews MUST verify compliance with this constitution's
  principles — reviewers are expected to flag violations.

## Governance

This constitution is the authoritative source of project principles.
It supersedes all other guidance when conflicts arise.

- **Amendments**: any change to this constitution MUST be documented
  with a version bump, rationale, and migration plan for affected
  artifacts.
- **Versioning**: MAJOR for principle removals or redefinitions, MINOR
  for new principles or material expansions, PATCH for clarifications
  and wording fixes.
- **Compliance review**: every pull request and design review MUST
  verify alignment with the principles above. Non-compliance MUST be
  resolved or explicitly justified with a Complexity Tracking entry
  before merge.

**Version**: 1.0.0 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-05-12
