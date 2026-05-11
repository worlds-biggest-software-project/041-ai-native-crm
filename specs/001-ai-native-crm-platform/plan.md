# Implementation Plan: AI-Native CRM Platform

**Branch**: `001-ai-native-crm-platform` | **Date**: 2026-05-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-ai-native-crm-platform/spec.md`

## Summary

Build an open-source, AI-native CRM platform targeting B2B SaaS sales teams. The system eliminates manual data entry through zero-entry pipeline population from connected Gmail/Outlook inboxes and calendars, combined with LLM-powered meeting summaries and follow-up drafts, ML-driven deal health and lead scoring, GDPR-safe contact enrichment, and a native MCP server for AI assistant integration. The platform is implemented as a Next.js 15 full-stack application with PostgreSQL, Redis-backed job queues, and a hybrid relational + custom fields data model.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) on Node.js 22 LTS
**Primary Dependencies**: Next.js 15 (App Router), tRPC v11, Drizzle ORM, BullMQ 5.x, Auth.js v5, Anthropic Claude SDK, Vercel AI SDK 4, ONNX Runtime, @modelcontextprotocol/sdk, @dnd-kit, TanStack Table v8, shadcn/ui, Tailwind CSS 4, recharts
**Storage**: PostgreSQL 16 (JSONB + GIN indexes, RLS for workspace isolation, partitioned audit logs) + Redis 7 (BullMQ job queues, rate limiting)
**Testing**: Vitest (unit/integration), Playwright (E2E browser tests)
**Target Platform**: Web application (SaaS deployment); Docker Compose for local development and self-hosted deployment
**Project Type**: Full-stack web application (Next.js monolith with background workers)
**Performance Goals**: Dashboard loads in <2s with 500 active deals; API responses <200ms p95; meeting summaries generated within 30s; email sync latency <5 minutes
**Constraints**: Workspace isolation on all queries; AES-256-GCM encryption for OAuth tokens at rest; GDPR Article 14 compliance for enrichment; OWASP API Security Top 10 threat model
**Scale/Scope**: 50 concurrent users per workspace; 500+ active deals; 30-day email sync window; 1000-record CSV import in <60s

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. AI-Native by Default — PASS

- Zero-entry pipeline population is the primary interaction model (User Stories 1-2, FR-004/005/006).
- LLM summaries, scoring, and follow-up drafts are first-class features (User Stories 3-4, FR-008/009/011/012).
- All ML/LLM features expose confidence scores: enrichment has confidence thresholds, deal health has scored labels (hot/warm/cool/cold), AI summaries have confidence and human review workflow.

### II. Privacy-First Data Handling — PASS

- GDPR Article 14 transparency notices, Legitimate Interest Assessment, and right-to-erasure with data reversion are specified (FR-017, User Story 6).
- Enrichment uses only permissioned/auditable public sources: OpenCorporates, Companies House, SEC EDGAR (FR-016).
- Soft delete by default with 30-day recovery; hard delete for GDPR erasure (FR-001, Clarification Q4).
- Data retention and deletion workflows specified before enrichment pipeline (constitution requirement).
- Docker-based architecture supports self-hosted deployment.

### III. Open Standards & Interoperability — PASS

- OpenAPI 3.1 auto-generated from Zod schemas (FR-024).
- OAuth 2.0 for all external integrations; no plain-auth IMAP/SMTP (FR-002, FR-007).
- vCard RFC 6350 import/export, iCalendar via Google Calendar API and Microsoft Graph (FR-025, FR-005).
- ISO 8601 timestamps throughout API responses.
- Native MCP server ships with the platform (FR-022, User Story 8).
- Open-source codebase.

### IV. Test-First Development — PASS

- Development plan defines unit, integration, and E2E tests for every task across all 12 phases.
- Contract tests cover REST API endpoints (Phase 2.4).
- Integration tests verify email sync, calendar sync, enrichment, and scoring against mocked external services.
- Each user story is independently testable per spec design.

### V. Simplicity & Incremental Delivery — PASS

- 12-phase incremental delivery with clear dependencies.
- MVP scope matches constitution: contacts/companies/deals, email+calendar sync, pipeline board, LLM summaries, ML scoring, REST API with webhooks.
- Phases 8-11 (enrichment, custom fields, webhooks, MCP) can develop in parallel after Phase 2.
- User stories are prioritized P1/P2/P3 for incremental delivery.

### Technology & Compliance Constraints — PARTIAL (deferred items noted)

- ISO 27001:2022 / SOC 2 Type II readiness: Architecture supports (audit logs, encryption, workspace isolation, RBAC). Formal certification deferred post-MVP.
- OWASP API Security Top 10: Addressed via workspace isolation (BOLA), Zod validation (mass assignment), role-based access control.
- **SCIM 2.0**: Not included in current spec scope. Constitution requires it for enterprise identity provider integration. Deferred to post-MVP phase — logged in Complexity Tracking below.
- Licence compliance: No AGPL dependencies in the stack. All dependencies are MIT/Apache-2.0 compatible.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-native-crm-platform/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   ├── rest-api.md
│   ├── trpc-api.md
│   ├── mcp-api.md
│   └── webhook-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (under target/)

```text
ai-native-crm/target/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── drizzle.config.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Dashboard redirect
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Sidebar + header shell
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx          # Contact list table
│   │   │   │   └── [id]/page.tsx     # Contact detail + timeline
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── deals/
│   │   │   │   ├── page.tsx          # Pipeline Kanban board
│   │   │   │   └── [id]/page.tsx     # Deal detail + AI insights
│   │   │   ├── activities/page.tsx   # Unified activity timeline
│   │   │   ├── settings/
│   │   │   │   ├── workspace/page.tsx
│   │   │   │   ├── integrations/page.tsx
│   │   │   │   ├── custom-fields/page.tsx
│   │   │   │   └── webhooks/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── api/
│   │       ├── trpc/[trpc]/route.ts
│   │       ├── webhooks/
│   │       │   ├── gmail/route.ts
│   │       │   └── outlook/route.ts
│   │       ├── mcp/route.ts
│   │       └── v1/                   # Public REST API
│   │           ├── contacts/route.ts
│   │           ├── companies/route.ts
│   │           ├── deals/route.ts
│   │           └── activities/route.ts
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle client
│   │   │   ├── schema/               # All Drizzle table definitions
│   │   │   └── migrations/
│   │   ├── trpc/
│   │   │   ├── router.ts
│   │   │   ├── context.ts
│   │   │   └── routers/              # Per-entity tRPC routers
│   │   ├── services/
│   │   │   ├── email-sync/           # Gmail + Outlook sync
│   │   │   ├── calendar-sync/        # Google + Outlook calendar
│   │   │   ├── ai/                   # LLM summaries, follow-ups, extraction
│   │   │   ├── scoring/              # Feature engineering + ONNX inference
│   │   │   ├── enrichment/           # Sources, engine, GDPR compliance
│   │   │   ├── mcp/                  # MCP server, resources, tools, prompts
│   │   │   ├── webhook-dispatch.ts
│   │   │   └── workflow-engine.ts
│   │   ├── workers/                  # BullMQ background workers
│   │   └── lib/                      # Auth, queue, redis, encryption, validators
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── layout/                   # Sidebar, header, command palette
│   │   ├── contacts/                 # Contact table, detail, form
│   │   ├── companies/                # Company table, detail, form
│   │   ├── deals/                    # Pipeline board, deal card, detail
│   │   ├── activities/               # Timeline, activity items
│   │   ├── ai/                       # Summary card, follow-up, score badge
│   │   └── shared/                   # Tags, custom field renderer, empty state
│   └── lib/
│       ├── trpc-client.ts
│       └── utils.ts
├── scripts/
│   ├── seed.ts                       # Development seed data
│   └── train-scoring-model.py        # Python ML training script
├── models/                           # ONNX model files
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
└── public/
```

**Structure Decision**: All application code lives under `target/` — the top level contains only research, specs, and orchestration. Next.js App Router monolith with co-located server code under `target/src/server/` and React components under `target/src/components/`. Background workers run in a separate Node.js process from the same codebase. Run all `pnpm` commands from the `target/` directory.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| SCIM 2.0 deferred to post-MVP | Constitution requires SCIM for enterprise IdP integration. MVP targets Series B-D SaaS teams where Google/Microsoft OAuth covers 95%+ of users. | Adding SCIM doubles the auth surface area and requires IdP sandbox infrastructure for testing. Admin-provisioned workspaces with OAuth login is sufficient for MVP validation. |
| Separate BullMQ worker process | Background sync, AI, and scoring jobs require a persistent worker process alongside the Next.js web server. | In-process job handling would block the event loop during email sync and ONNX inference. The worker shares the codebase and Docker image — it's a runtime separation, not an architectural one. |
| ONNX Runtime + Python training scripts | ML scoring requires model training (Python/scikit-learn) and inference (Node.js/ONNX). | Pure-TypeScript ML libraries lack XGBoost-equivalent accuracy. The Python script runs offline during model training only; production inference is Node.js-native via ONNX Runtime. No Python in the production runtime. |
| Mocked external API integration tests | Constitution IV requires sandboxed external services for integration tests. Gmail API and Microsoft Graph test sandboxes require paid developer accounts, tenant provisioning, and network-dependent CI. | Sandboxed tests add CI flakiness from external service outages and require per-developer credentials. Mocked tests validate business logic, data transformation, and error handling. Pre-release validation against live sandboxes is performed manually before each major release. |
| Inter-story functional dependencies (US3→US2, US4→US2, US5→US1+US2) | Constitution V requires independent story delivery. AI summaries (US3) inherently require meeting data from sync (US2); scoring (US4) requires activity data. These are domain-level dependencies, not implementation coupling. | Making stories truly independent would require duplicating data ingestion logic in each story, adding complexity without user value. Each story's test suite includes seed/fixture data for isolated validation; full end-to-end functionality requires prior stories' data pipelines. |
