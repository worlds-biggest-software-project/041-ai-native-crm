# Tasks: AI-Native CRM Platform

**Input**: Design documents from `specs/001-ai-native-crm-platform/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Included per Constitution Principle IV (Test-First Development). Contract and integration tests precede implementation within each story.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the Next.js project, configure tooling, and set up the development environment.

- [x] T001 Scaffold Next.js 15 project with TypeScript, Tailwind CSS, ESLint, and pnpm in target/
- [x] T002 Configure tsconfig.json with strict mode, noUncheckedIndexedAccess, and path alias @/* → ./src/*
- [x] T003 [P] Create .env.example with all required environment variables per quickstart.md
- [x] T004 [P] Create docker-compose.yml with PostgreSQL 16, Redis 7, and app services per plan.md
- [x] T005 [P] Create multi-stage Dockerfile (development, builder, production targets) per plan.md
- [x] T006 [P] Install and configure ESLint 9 flat config with no-explicit-any rule and Prettier in target/eslint.config.mjs
- [x] T007 Install core dependencies: drizzle-orm, postgres, @auth/core, @auth/drizzle-adapter, @trpc/server, @trpc/client, @trpc/next, superjson, bullmq, ioredis, zod
- [x] T008 Install dev dependencies: drizzle-kit, vitest, @playwright/test, @types/node
- [x] T009 [P] Configure Vitest in target/vitest.config.ts with path aliases and test file patterns
- [x] T010 [P] Configure Playwright in target/playwright.config.ts for E2E tests against localhost:3000

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database connection, authentication, tRPC scaffold, and base infrastructure that ALL user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T011 Create Drizzle ORM client and connection in target/src/server/db/index.ts
- [x] T012 Configure target/drizzle.config.ts with PostgreSQL connection and schema/migration paths
- [x] T013 Create workspace schema in target/src/server/db/schema/workspaces.ts per data-model.md
- [x] T014 [P] Create user schema in target/src/server/db/schema/users.ts with workspace FK and unique(workspace_id, email) per data-model.md
- [x] T015 [P] Create field_definition schema in target/src/server/db/schema/field-definitions.ts per data-model.md
- [x] T016 Configure Auth.js v5 with Google and Microsoft Entra ID OAuth providers, Drizzle adapter, and JWT session strategy in target/src/server/lib/auth.ts
- [x] T017 Create NextAuth type augmentation for workspaceId and role in session at target/src/types/next-auth.d.ts
- [x] T018 Create tRPC initialization with superjson transformer in target/src/server/trpc/router.ts
- [x] T019 Create tRPC context with auth session and db injection in target/src/server/trpc/context.ts
- [x] T020 Create publicProcedure, protectedProcedure (with workspace isolation middleware), and adminProcedure (extends protectedProcedure, rejects non-admin role) in target/src/server/trpc/router.ts
- [x] T021 Create health check procedure in root tRPC router
- [x] T022 Create tRPC HTTP handler route at target/src/app/api/trpc/[trpc]/route.ts
- [x] T023 [P] Create Redis client in target/src/server/lib/redis.ts
- [x] T024 [P] Create BullMQ queue definitions (email-sync, calendar-sync, ai-jobs, scoring, enrichment, webhook-dispatch) in target/src/server/lib/queue.ts
- [x] T025 [P] Create AES-256-GCM encrypt/decrypt helpers in target/src/server/lib/encryption.ts
- [x] T026 [P] Create shared Zod validator schemas in target/src/server/lib/validators.ts
- [x] T027 [P] Create tRPC client for React in target/src/lib/trpc-client.ts
- [ ] T028 Run initial database migration: pnpm drizzle-kit push
- [x] T029 Write integration test: health procedure returns ok without auth in target/tests/integration/trpc-health.test.ts
- [x] T030 Write integration test: protectedProcedure rejects unauthenticated request in target/tests/integration/trpc-auth.test.ts
- [x] T217 [P] Create workspace settings tRPC router (getWorkspace, updateWorkspace, listUsers, inviteUser, updateUserRole, deactivateUser) in target/src/server/trpc/routers/settings.ts
- [x] T218 [P] Create workspace settings page at target/src/app/(dashboard)/settings/workspace/page.tsx

**Checkpoint**: Foundation ready — database connected, auth working, tRPC scaffold operational, workspace admin settings available. User story implementation can begin.

---

## Phase 3: User Story 1 — Sales Rep Manages Contacts, Companies, and Deals (Priority: P1)

**Goal**: Authenticated users can CRUD contacts, companies, and deals. Pipeline Kanban board with drag-and-drop. Dashboard shell with sidebar navigation.

**Independent Test**: Create workspace, log in, add contacts/companies/deals, drag deals across pipeline stages.

### Tests for User Story 1

- [x] T031 [P] [US1] Write contract tests for REST API contacts endpoints (GET/POST/PATCH/DELETE) in target/tests/contract/contacts-api.test.ts
- [x] T032 [P] [US1] Write contract tests for REST API companies endpoints in target/tests/contract/companies-api.test.ts
- [x] T033 [P] [US1] Write contract tests for REST API deals endpoints (including stage move via PATCH) in target/tests/contract/deals-api.test.ts
- [x] T034 [P] [US1] Write contract tests for REST API pipelines endpoints in target/tests/contract/pipelines-api.test.ts
- [x] T035 [P] [US1] Write integration test: create contact, list contacts, contact appears in list in target/tests/integration/contacts.test.ts
- [x] T036 [P] [US1] Write integration test: workspace isolation — contact in workspace A not visible from workspace B in target/tests/integration/workspace-isolation.test.ts
- [x] T037 [P] [US1] Write integration test: deal stage change sets actualCloseDate on won/lost in target/tests/integration/deals-stage.test.ts

### Implementation for User Story 1

#### Database Schemas

- [x] T038 [P] [US1] Create contact schema with all columns, indexes, and soft delete (deleted_at) in target/src/server/db/schema/contacts.ts per data-model.md
- [x] T039 [P] [US1] Create company schema with all columns, indexes, and soft delete in target/src/server/db/schema/companies.ts per data-model.md
- [x] T040 [P] [US1] Create pipeline schema with JSONB stages column in target/src/server/db/schema/pipelines.ts per data-model.md
- [x] T041 [P] [US1] Create deal schema with all columns, indexes, contact_ids array, and soft delete in target/src/server/db/schema/deals.ts per data-model.md
- [x] T042 [P] [US1] Create audit_log schema (partitioned by quarter) in target/src/server/db/schema/audit-log.ts per data-model.md
- [x] T043 [P] [US1] Create tag and entity_tag schemas in target/src/server/db/schema/tags.ts per data-model.md
- [ ] T044 [US1] Run migration to apply all Phase 3 schemas: pnpm drizzle-kit push

#### Zod Validators

- [x] T045 [P] [US1] Add createContactSchema, updateContactSchema, listContactsSchema to target/src/server/lib/validators.ts
- [x] T046 [P] [US1] Add createCompanySchema, updateCompanySchema, listCompaniesSchema to target/src/server/lib/validators.ts
- [x] T047 [P] [US1] Add createDealSchema, updateDealSchema, listDealsSchema, pipelineStageSchema to target/src/server/lib/validators.ts

#### tRPC Routers (CRUD)

- [x] T048 [US1] Create contacts tRPC router (list, getById, create, update, delete) with workspace isolation in target/src/server/trpc/routers/contacts.ts
- [x] T049 [US1] Create companies tRPC router (list, getById, create, update, delete) with contactCount/dealCount denormalization in target/src/server/trpc/routers/companies.ts
- [x] T050 [US1] Create pipelines tRPC router (list, create, update) with default pipeline seeding in target/src/server/trpc/routers/pipelines.ts
- [x] T051 [US1] Create deals tRPC router (list, getById, create, update, delete, moveStage) with stage validation and audit logging in target/src/server/trpc/routers/deals.ts
- [x] T052 [US1] Create audit log helper function writeAuditLog in target/src/server/lib/audit.ts
- [x] T053 [US1] Register all routers in root tRPC appRouter in target/src/server/trpc/router.ts

#### Public REST API

- [x] T054 [P] [US1] Create REST contacts routes (GET/POST list, GET/PATCH/DELETE by id) at target/src/app/api/v1/contacts/route.ts and src/app/api/v1/contacts/[id]/route.ts
- [x] T055 [P] [US1] Create REST companies routes at target/src/app/api/v1/companies/route.ts and src/app/api/v1/companies/[id]/route.ts
- [x] T056 [P] [US1] Create REST deals routes at target/src/app/api/v1/deals/route.ts and src/app/api/v1/deals/[id]/route.ts
- [x] T057 [P] [US1] Create REST pipelines routes at target/src/app/api/v1/pipelines/route.ts and src/app/api/v1/pipelines/[id]/route.ts
- [x] T058 [US1] Create API key authentication middleware for Bearer token auth on /api/v1/* routes in target/src/server/lib/api-auth.ts

#### Frontend Shell

- [x] T059 [US1] Install UI dependencies: @shadcn/ui, @dnd-kit/core, @dnd-kit/sortable, @tanstack/react-table, @tanstack/react-query, recharts
- [x] T060 [US1] Initialize shadcn/ui components (button, input, dialog, dropdown-menu, table, badge, avatar, tabs, command, separator, sheet) in target/src/components/ui/
- [x] T061 [US1] Create dashboard layout shell with collapsible sidebar in target/src/app/(dashboard)/layout.tsx
- [x] T062 [P] [US1] Create sidebar component with nav items (Contacts, Companies, Deals, Activities, Reports, Settings) in target/src/components/layout/sidebar.tsx
- [x] T063 [P] [US1] Create header component with breadcrumb, search trigger, and user menu in target/src/components/layout/header.tsx
- [x] T064 [US1] Create command palette component (Cmd+K) with global search via tRPC in target/src/components/layout/command-palette.tsx
- [x] T065 [US1] Create auth pages: login page at target/src/app/(auth)/login/page.tsx and OAuth callback at target/src/app/(auth)/callback/route.ts

#### Contact & Company List Views

- [x] T066 [US1] Create contact table component with TanStack Table (server-side pagination, sorting, filtering, bulk actions) in target/src/components/contacts/contact-table.tsx
- [x] T067 [US1] Create contacts list page at target/src/app/(dashboard)/contacts/page.tsx
- [x] T068 [P] [US1] Create company table component in target/src/components/companies/company-table.tsx
- [x] T069 [P] [US1] Create companies list page at target/src/app/(dashboard)/companies/page.tsx

#### Pipeline Kanban Board

- [x] T070 [US1] Create pipeline board component with @dnd-kit drag-and-drop, stage columns, and optimistic updates in target/src/components/deals/pipeline-board.tsx
- [x] T071 [P] [US1] Create deal card component (name, company, amount, health badge, owner, days-in-stage) in target/src/components/deals/deal-card.tsx
- [x] T072 [US1] Create deals pipeline page with pipeline selector at target/src/app/(dashboard)/deals/page.tsx

#### Detail Pages

- [x] T073 [US1] Create contact detail page (header, action bar, tabs: Overview/Activity/Deals/Tasks) at target/src/app/(dashboard)/contacts/[id]/page.tsx
- [x] T074 [P] [US1] Create contact detail component with field display and inline editing in target/src/components/contacts/contact-detail.tsx
- [x] T075 [P] [US1] Create contact form component for create/edit in target/src/components/contacts/contact-form.tsx
- [x] T076 [US1] Create deal detail page (header, stage badge, tabs: Overview/Activity/Contacts/AI Insights) at target/src/app/(dashboard)/deals/[id]/page.tsx
- [x] T077 [P] [US1] Create deal detail component in target/src/components/deals/deal-detail.tsx
- [x] T078 [P] [US1] Create deal form component in target/src/components/deals/deal-form.tsx
- [x] T079 [P] [US1] Create company detail page at target/src/app/(dashboard)/companies/[id]/page.tsx
- [x] T080 [P] [US1] Create shared empty state component in target/src/components/shared/empty-state.tsx
- [x] T081 [P] [US1] Create shared entity tags component in target/src/components/shared/entity-tags.tsx

#### E2E Tests

- [x] T082 [US1] Write E2E test: login, sidebar navigation, create contact, verify in list in target/tests/e2e/contacts.spec.ts
- [x] T083 [US1] Write E2E test: pipeline board drag deal between stages, verify totals update in target/tests/e2e/pipeline-board.spec.ts

**Checkpoint**: Core CRM is fully functional — contacts, companies, deals, pipeline board, REST API. This is the Core CRM Checkpoint (not yet constitution MVP — see Phase 9 checkpoint).

---

## Phase 4: User Story 2 — Zero-Entry Pipeline Population via Email and Calendar Sync (Priority: P1)

**Goal**: Connect Gmail/Outlook inbox and calendar. System auto-populates contacts and activities from email and calendar data.

**Independent Test**: Connect inbox, verify contacts auto-created from email senders, calendar meetings logged as activities.

### Tests for User Story 2

- [ ] T084 [P] [US2] Write unit test: parseEmailToActivity extracts subject, direction, from, to for inbound/outbound email in target/tests/unit/email-parser.test.ts
- [ ] T085 [P] [US2] Write unit test: extractUniqueContacts deduplicates by email across from/to/cc in target/tests/unit/email-parser.test.ts
- [ ] T086 [P] [US2] Write unit test: encrypt/decrypt round-trip and wrong-key rejection in target/tests/unit/encryption.test.ts
- [ ] T087 [P] [US2] Write integration test (mocked Gmail API): initial sync of 100 threads creates activities and contacts in target/tests/integration/gmail-sync.test.ts
- [ ] T088 [P] [US2] Write integration test (mocked Graph API): delta sync processes only new messages in target/tests/integration/outlook-sync.test.ts

### Implementation for User Story 2

#### Database Schema

- [ ] T089 [US2] Create oauth_connection schema with encrypted token columns in target/src/server/db/schema/oauth-connections.ts per data-model.md
- [ ] T090 [US2] Create activity schema with JSONB detail column in target/src/server/db/schema/activities.ts per data-model.md
- [ ] T091 [US2] Create task schema in target/src/server/db/schema/tasks.ts per data-model.md
- [ ] T092 [US2] Run migration for Phase 4 schemas: pnpm drizzle-kit push

#### Email Sync Services

- [ ] T093 [US2] Create email parser service (parseEmailToActivity, extractUniqueContacts, isFromUs) in target/src/server/services/email-sync/parser.ts
- [ ] T094 [US2] Create Gmail sync service (initialSync, incrementalSync, registerPushNotifications) in target/src/server/services/email-sync/gmail.ts
- [ ] T095 [US2] Create Outlook sync service (initialSync via Graph, incrementalSync via delta query, registerChangeNotifications) in target/src/server/services/email-sync/outlook.ts
- [ ] T096 [US2] Create domain exclusion filter that skips internal emails based on workspace settings.excluded_domains in target/src/server/services/email-sync/parser.ts

#### Calendar Sync Services

- [ ] T097 [P] [US2] Create Google Calendar sync service (syncEvents, attendee-to-contact mapping) in target/src/server/services/calendar-sync/google-calendar.ts
- [ ] T098 [P] [US2] Create Outlook Calendar sync service (syncEvents via Microsoft Graph) in target/src/server/services/calendar-sync/outlook-calendar.ts

#### OAuth & Webhook Routes

- [ ] T099 [US2] Create sync tRPC router (getConnections, initiateOAuth, revokeConnection) in target/src/server/trpc/routers/sync.ts
- [ ] T100 [P] [US2] Create Gmail push notification webhook receiver at target/src/app/api/webhooks/gmail/route.ts
- [ ] T101 [P] [US2] Create Outlook change notification webhook receiver at target/src/app/api/webhooks/outlook/route.ts

#### Background Workers

- [ ] T102 [US2] Create email sync BullMQ worker (initial + incremental, provider dispatch, rate limiting) in target/src/server/workers/email-sync.worker.ts
- [ ] T103 [P] [US2] Create calendar sync BullMQ worker in target/src/server/workers/calendar-sync.worker.ts
- [ ] T104 [US2] Create worker bootstrap entry point with repeatable job scheduling in target/src/server/workers/index.ts
- [ ] T105 [US2] Create token refresh repeatable job (check tokenExpiresAt, refresh via provider endpoint) in target/src/server/workers/index.ts

#### Settings UI

- [ ] T106 [US2] Create integrations settings page with OAuth connect/disconnect buttons at target/src/app/(dashboard)/settings/integrations/page.tsx
- [ ] T107 [US2] Create domain exclusion configuration in workspace settings UI at target/src/app/(dashboard)/settings/workspace/page.tsx

**Checkpoint**: Email and calendar sync operational. Contacts auto-created, activities auto-logged. Zero-entry pipeline population working.

---

## Phase 5: User Story 5 — Activity Timeline and Global Search (Priority: P2)

**Goal**: Unified activity timeline on every record. Full-text search across all entities via command palette.

**Independent Test**: View contact with mixed activity types, use command palette to search across entity types.

**Note**: This story is prioritized before US3/US4 because the timeline and search are prerequisites for the AI features to be visible and useful.

### Tests for User Story 5

- [ ] T108 [P] [US5] Write integration test: create activities, query timeline with cursor pagination in target/tests/integration/activities-timeline.test.ts
- [ ] T109 [P] [US5] Write integration test: search "acme" returns matching company and contacts in target/tests/integration/global-search.test.ts

### Implementation for User Story 5

- [ ] T110 [US5] Create activities tRPC router (timeline query with cursor pagination, create note/call, filter by type/contact/deal/company) in target/src/server/trpc/routers/activities.ts
- [ ] T111 [US5] Add search_vector tsvector columns to contacts, companies, deals schemas and create GIN indexes via SQL migration
- [ ] T112 [US5] Create PostgreSQL trigger functions for auto-updating search_vector on INSERT/UPDATE for contacts, companies, deals via raw SQL migration
- [ ] T113 [US5] Create search tRPC router (global search across contacts/companies/deals with ts_rank_cd ranking) in target/src/server/trpc/routers/search.ts
- [ ] T114 [US5] Create activity timeline UI component (vertical timeline, type-specific icons/rendering, load-more pagination) in target/src/components/activities/activity-timeline.tsx
- [ ] T115 [P] [US5] Create activity item component (email: direction badge + body preview; meeting: attendees + conference link; note: collapsible text; stage_change: stage badges) in target/src/components/activities/activity-item.tsx
- [ ] T116 [P] [US5] Create email thread component for grouped email display in target/src/components/activities/email-thread.tsx
- [ ] T117 [US5] Create activities list page at target/src/app/(dashboard)/activities/page.tsx
- [ ] T118 [US5] Wire command palette search to tRPC search.global procedure in target/src/components/layout/command-palette.tsx
- [ ] T225 [P] [US5] Create REST activities routes (GET list, POST create, GET by id) at target/src/app/api/v1/activities/route.ts and src/app/api/v1/activities/[id]/route.ts per rest-api.md contract
- [ ] T119 [US5] Write E2E test: contact detail Activity tab shows timeline with mixed types, load more works in target/tests/e2e/activity-timeline.spec.ts

**Checkpoint**: Activity timelines visible on all detail pages. Global search working via command palette.

---

## Phase 6: User Story 3 — AI-Generated Meeting Summaries and Follow-Up Drafts (Priority: P2)

**Goal**: Auto-generate structured meeting summaries after synced meetings. Generate editable follow-up email drafts.

**Independent Test**: Trigger summary for a past meeting, review structured output, generate and send follow-up draft.

### Tests for User Story 3

- [ ] T120 [P] [US3] Write unit test: buildMeetingContext produces well-formatted prompt with all context sections in target/tests/unit/meeting-summary.test.ts
- [ ] T121 [P] [US3] Write unit test: parseMeetingSummaryResponse parses Claude response into typed MeetingSummaryOutput in target/tests/unit/meeting-summary.test.ts
- [ ] T122 [P] [US3] Write integration test (mocked LLM): meeting with email context generates summary with action items and creates tasks in target/tests/integration/ai-summary.test.ts

### Implementation for User Story 3

- [ ] T123 [US3] Install AI dependencies: @anthropic-ai/sdk, ai (Vercel AI SDK)
- [ ] T124 [US3] Create ai_summary schema in target/src/server/db/schema/ai-summaries.ts per data-model.md
- [ ] T125 [P] [US3] Create ai_follow_up schema in target/src/server/db/schema/ai-follow-ups.ts per data-model.md
- [ ] T126 [US3] Create meeting summary system prompt and context builder in target/src/server/services/ai/prompts.ts
- [ ] T127 [US3] Create meeting summary generation service (generateMeetingSummary with Claude, structured JSON output) in target/src/server/services/ai/meeting-summary.ts
- [ ] T128 [US3] Create entity extraction service for identifying contacts/companies from email text in target/src/server/services/ai/entity-extraction.ts
- [ ] T129 [US3] Create follow-up draft generation service (generateFollowUpDraft using summary + deal context) in target/src/server/services/ai/follow-up-draft.ts
- [ ] T130 [US3] Create AI summary BullMQ worker (load context, generate summary, store result, create tasks from action items) in target/src/server/workers/ai-summary.worker.ts
- [ ] T131 [US3] Create AI tRPC router (getSummary, generateSummary, reviewSummary, getFollowUp, generateFollowUp, sendFollowUp) in target/src/server/trpc/routers/ai.ts
- [ ] T132 [US3] Add auto-trigger: when calendar sync creates a past meeting activity, enqueue AI summary job in target/src/server/workers/calendar-sync.worker.ts
- [ ] T133 [US3] Create meeting summary card UI component (summary text, key points, action items checklist, sentiment badge, topics tags, regenerate button) in target/src/components/ai/meeting-summary-card.tsx
- [ ] T134 [US3] Create follow-up draft UI component (editable subject, rich text body, send/discard buttons) in target/src/components/ai/follow-up-draft.tsx
- [ ] T135 [US3] Wire AI Insights tab on deal detail page to display summaries and follow-up drafts in target/src/app/(dashboard)/deals/[id]/page.tsx
- [ ] T136 [US3] Write E2E test: deal AI Insights tab shows summary, click Generate Follow-Up, edit, send in target/tests/e2e/ai-insights.spec.ts

**Checkpoint**: Meeting summaries auto-generate after synced meetings. Follow-up drafts editable and sendable.

---

## Phase 7: User Story 4 — ML-Based Deal Health and Lead Scoring (Priority: P2)

**Goal**: Every deal shows a health score (0-100) from communication signals. Every contact shows a lead score. Heuristic fallback for workspaces without training data.

**Independent Test**: Create deals with varying activity patterns, verify health scores reflect engagement levels.

### Tests for User Story 4

- [ ] T137 [P] [US4] Write unit test: heuristicDealHealth returns "hot" for active deal and "cold" for stale deal in target/tests/unit/scoring-heuristic.test.ts
- [ ] T138 [P] [US4] Write unit test: computeDealHealthFeatures returns correct emailsLast7Days and handles zero-activity deals in target/tests/unit/feature-engineering.test.ts
- [ ] T139 [P] [US4] Write integration test: new activity triggers rescore, score updates on deal in target/tests/integration/scoring-pipeline.test.ts

### Implementation for User Story 4

- [ ] T140 [US4] Create scoring_model and score_history schemas in target/src/server/db/schema/scoring.ts per data-model.md
- [ ] T141 [US4] Create deal health feature engineering (computeDealHealthFeatures: email velocity, meeting frequency, response time, stage velocity) in target/src/server/services/scoring/feature-engineering.ts
- [ ] T142 [P] [US4] Create lead score feature engineering (computeLeadScoreFeatures) in target/src/server/services/scoring/feature-engineering.ts
- [ ] T143 [US4] Create heuristic deal health scorer (heuristicDealHealth) as fallback in target/src/server/services/scoring/inference.ts
- [ ] T144 [US4] Create ONNX Runtime inference service (scoreDeal, featuresToArray) in target/src/server/services/scoring/inference.ts
- [ ] T145 [US4] Create scoring pipeline orchestrator (select model or fallback, compute features, run inference, store result) in target/src/server/services/scoring/pipeline.ts
- [ ] T146 [US4] Create scoring BullMQ worker (score-deal, score-lead, batch-rescore) in target/src/server/workers/scoring.worker.ts
- [ ] T147 [US4] Add score triggers: enqueue score-deal job on activity.created and deal.stage_changed in target/src/server/trpc/routers/activities.ts and src/server/trpc/routers/deals.ts
- [ ] T148 [US4] Create scoring tRPC router (getDealHealth, getLeadScore, rescore) in target/src/server/trpc/routers/scoring.ts
- [ ] T149 [US4] Create Python training script (export features, train XGBoost, export ONNX) in target/scripts/train-scoring-model.py
- [ ] T150 [US4] Create score badge UI component (colored badge with score, label, trend arrow, timestamp) in target/src/components/ai/score-badge.tsx
- [ ] T151 [US4] Wire score badges onto pipeline board deal cards and contact/deal detail pages

**Checkpoint**: Health scores visible on all deals. Lead scores on contacts. Heuristic fallback working.

---

## Phase 8: User Story 6 — GDPR-Safe Contact and Company Enrichment (Priority: P3)

**Goal**: Enrich contacts/companies from public data sources with auditable provenance. GDPR Article 14 transparency and right-to-erasure.

**Independent Test**: Enable enrichment source, create company with domain, verify enriched fields with source attribution.

### Tests for User Story 6

- [ ] T152 [P] [US6] Write unit test: validateEnrichmentGDPR rejects source without documented GDPR basis in target/tests/unit/gdpr-compliance.test.ts
- [ ] T153 [P] [US6] Write integration test (mocked API): enrich company by domain creates enrichment_log with provenance in target/tests/integration/enrichment.test.ts
- [ ] T154 [P] [US6] Write integration test: processErasureRequest reverts enriched fields and creates audit entry in target/tests/integration/gdpr-erasure.test.ts

### Implementation for User Story 6

- [ ] T155 [US6] Create enrichment_source and enrichment_log schemas in target/src/server/db/schema/enrichment.ts per data-model.md
- [ ] T156 [US6] Create enrichment engine interface (EnrichmentSource, EnrichmentResult) in target/src/server/services/enrichment/enrichment-engine.ts
- [ ] T157 [P] [US6] Create OpenCorporates enrichment source (company data from public registries) in target/src/server/services/enrichment/sources/opencorporates.ts
- [ ] T158 [P] [US6] Create company registries enrichment source (UK Companies House, US SEC EDGAR) in target/src/server/services/enrichment/sources/company-registries.ts
- [ ] T159 [US6] Create GDPR compliance layer (validateEnrichmentGDPR, generateArticle14Notice, processErasureRequest) in target/src/server/services/enrichment/gdpr-compliance.ts
- [ ] T160 [US6] Create enrichment BullMQ worker (load sources, enrich, confidence threshold, auto-apply or queue for review) in target/src/server/workers/enrichment.worker.ts
- [ ] T161 [US6] Create enrichment tRPC router (enrich, getLog, reviewEnrichment) in target/src/server/trpc/routers/enrichment.ts
- [ ] T162 [US6] Add enrichment triggers: enqueue job on contact.created and company.created with email/domain in target/src/server/trpc/routers/contacts.ts and src/server/trpc/routers/companies.ts
- [ ] T163 [US6] Add enrichment settings UI (source list, enable/disable, auto-apply threshold, LIA doc link) to target/src/app/(dashboard)/settings/integrations/page.tsx
- [ ] T164 [US6] Add enrichment log review UI (approve/reject pending enrichments) to company/contact detail pages

**Checkpoint**: Enrichment running from public sources with GDPR compliance. Provenance auditable.

---

## Phase 9: User Story 7 — Webhooks and Workflow Automation (Priority: P3)

**Goal**: Outbound webhooks for CRM events with HMAC signing and retry. Trigger-condition-action workflow builder.

**Independent Test**: Register webhook, trigger CRM event, verify signed payload delivered. Create workflow, trigger it, confirm action executes.

### Tests for User Story 7

- [ ] T165 [P] [US7] Write unit test: HMAC-SHA256 signature computed correctly with shared secret in target/tests/unit/webhook-signature.test.ts
- [ ] T166 [P] [US7] Write integration test: create contact triggers webhook dispatch to mock endpoint in target/tests/integration/webhook-dispatch.test.ts
- [ ] T167 [P] [US7] Write integration test: workflow "on stage_changed to Negotiation, create task" executes correctly in target/tests/integration/workflow-engine.test.ts

### Implementation for User Story 7

- [ ] T168 [US7] Create webhook and workflow/workflow_execution schemas in target/src/server/db/schema/webhooks.ts and src/server/db/schema/workflows.ts per data-model.md
- [ ] T169 [US7] Create webhook dispatch service (find matching webhooks, enqueue delivery jobs, HMAC signing) in target/src/server/services/webhook-dispatch.ts
- [ ] T170 [US7] Create webhook BullMQ worker (sign payload, POST to URL, retry on 5xx with backoff, log delivery status) in target/src/server/workers/webhook.worker.ts
- [ ] T171 [US7] Wire webhook dispatch into CRM event points (contact/company/deal create/update/delete, deal.stage_changed, activity.created, task events)
- [ ] T172 [US7] Create workflow engine (evaluateTrigger, walkStepTree, execute actions: create_task, update_field, send_notification, wait, call_webhook) in target/src/server/services/workflow-engine.ts
- [ ] T173 [US7] Create webhooks tRPC router (list, create, update, delete) admin-only in target/src/server/trpc/routers/webhooks.ts
- [ ] T174 [US7] Create workflows tRPC router (list, create, update, delete, getExecutions) admin-only in target/src/server/trpc/routers/workflows.ts
- [ ] T175 [US7] Create webhooks settings page (register URL, select events, view delivery log) at target/src/app/(dashboard)/settings/webhooks/page.tsx
- [ ] T176 [US7] Create workflow builder UI in settings (trigger selector, condition builder, action steps) at target/src/app/(dashboard)/settings/workflows/page.tsx

**Checkpoint**: Webhooks dispatching CRM events. Workflows automating sales sequences.

**CONSTITUTION MVP COMPLETE**: After Phases 3-7 + 9, the constitution's MVP scope is met: contact/company/deal management, two-way email and calendar sync, pipeline board, LLM meeting summaries, ML deal scoring, and REST API with webhooks. Validate before proceeding to post-MVP features.

---

## Phase 10: User Story 8 — MCP Server for AI Assistant Integration (Priority: P3)

**Goal**: Native MCP server exposing CRM data as resources, write operations as tools, and prompt templates. HTTP transport with API key auth.

**Independent Test**: Connect MCP client with API key, list resources/tools/prompts, read contact resource, call create_contact tool.

### Tests for User Story 8

- [ ] T177 [P] [US8] Write integration test: MCP client connects, resources/list returns contacts/deals/companies/activities in target/tests/integration/mcp-resources.test.ts
- [ ] T178 [P] [US8] Write integration test: MCP tool create_contact creates contact in database in target/tests/integration/mcp-tools.test.ts
- [ ] T179 [P] [US8] Write integration test: MCP prompt meeting_prep returns formatted context in target/tests/integration/mcp-prompts.test.ts

### Implementation for User Story 8

- [ ] T180 [US8] Install MCP dependency: @modelcontextprotocol/sdk
- [ ] T181 [US8] Create MCP server factory (createMcpServer with workspace-scoped resources, tools, prompts) in target/src/server/services/mcp/server.ts
- [ ] T182 [US8] Register MCP resources (crm://contacts, crm://contacts/{id}, crm://deals, crm://deals/{id}, crm://companies/{id}, crm://activities) in target/src/server/services/mcp/resources.ts
- [ ] T183 [US8] Register MCP tools (create_contact, update_contact, create_deal, update_deal_stage, log_activity, create_task, search_crm, get_deal_health) in target/src/server/services/mcp/tools.ts
- [ ] T184 [US8] Register MCP prompts (meeting_prep, deal_summary, follow_up_draft, pipeline_review) in target/src/server/services/mcp/prompts.ts
- [ ] T185 [US8] Create MCP HTTP SSE transport route with Bearer token authentication at target/src/app/api/mcp/route.ts
- [ ] T186 [US8] Create MCP API key generation (generateMcpKey mutation, display-once key) in target/src/server/trpc/routers/settings.ts
- [ ] T187 [US8] Add MCP settings section (generate key, connection instructions, active connections) to target/src/app/(dashboard)/settings/integrations/page.tsx

**Checkpoint**: MCP server operational. AI assistants can connect and interact with CRM data.

---

## Phase 11: User Story 9 — Custom Fields and Custom Objects (Priority: P3)

**Goal**: Workspace admins define custom fields on entities and create custom object types with their own schemas.

**Independent Test**: Create custom "Contract Value" currency field on deals, create deal, verify field appears and validates.

### Tests for User Story 9

- [ ] T188 [P] [US9] Write unit test: validateCustomFields rejects required field missing and unknown field key in target/tests/unit/custom-fields-validation.test.ts
- [ ] T189 [P] [US9] Write integration test: create field definition, create contact with custom field, validate and retrieve in target/tests/integration/custom-fields.test.ts

### Implementation for User Story 9

- [ ] T190 [US9] Create custom_object_definition and custom_object_record schemas in target/src/server/db/schema/custom-objects.ts per data-model.md
- [ ] T191 [US9] Create validateCustomFields function (validate JSONB against field_definitions, reject unknown keys, type-check values) in target/src/server/lib/validators.ts
- [ ] T192 [US9] Create custom fields tRPC router (list, create, update, delete, reorder) admin-only in target/src/server/trpc/routers/custom-fields.ts
- [ ] T193 [US9] Wire validateCustomFields into contact, company, and deal create/update mutations
- [ ] T194 [US9] Create custom objects tRPC router (listDefinitions, createDefinition, deleteDefinition, listRecords, createRecord, updateRecord, deleteRecord) in target/src/server/trpc/routers/custom-objects.ts
- [ ] T195 [US9] Create custom field renderer component (maps fieldType to appropriate input: TextInput, NumberInput, CurrencyInput, DatePicker, SelectDropdown, etc.) in target/src/components/shared/custom-field-renderer.tsx
- [ ] T196 [US9] Create custom fields settings page (add/edit/reorder/delete field definitions) at target/src/app/(dashboard)/settings/custom-fields/page.tsx
- [ ] T197 [US9] Wire custom field renderer into contact, company, and deal detail/form components
- [ ] T198 [US9] Add dynamic sidebar navigation for custom objects in target/src/components/layout/sidebar.tsx

**Checkpoint**: Custom fields visible on all entity forms. Custom objects navigable in sidebar.

---

## Phase 12: User Story 10 — Reporting Dashboard and Data Import/Export (Priority: P3)

**Goal**: Pipeline analytics dashboard. vCard/CSV import/export. OpenAPI 3.1 spec generation. Seed data script.

**Independent Test**: Load dashboard with seed data, verify charts render. Import CSV, confirm contacts created.

### Tests for User Story 10

- [ ] T199 [P] [US10] Write unit test: vCard parser extracts FN, EMAIL, ORG into contact/company in target/tests/unit/vcard-parser.test.ts
- [ ] T200 [P] [US10] Write integration test: pipelineSummary returns correct aggregates for known deal data in target/tests/integration/reports.test.ts
- [ ] T201 [P] [US10] Write integration test: import 100-contact CSV with deduplication by email in target/tests/integration/csv-import.test.ts

### Implementation for User Story 10

#### Reports

- [ ] T202 [US10] Create reports tRPC router (pipelineSummary, activityVolume, staleDeals) in target/src/server/trpc/routers/reports.ts
- [ ] T203 [US10] Create dashboard page with KPI cards, funnel chart, health distribution, activity volume chart, stale deals table at target/src/app/(dashboard)/reports/page.tsx
- [ ] T204 [US10] Wire root page (src/app/page.tsx) to redirect authenticated users to dashboard

#### Import/Export

- [ ] T205 [US10] Create vCard parser (RFC 6350: FN→fullName, N→first/last, EMAIL, TEL, TITLE, ADR, ORG→company) in target/src/server/services/import/vcard-parser.ts
- [ ] T206 [P] [US10] Create CSV parser with configurable column mapping and deduplication in target/src/server/services/import/csv-parser.ts
- [ ] T207 [US10] Create export tRPC router (contacts as CSV/vCard, companies as CSV, deals as CSV) in target/src/server/trpc/routers/export.ts
- [ ] T208 [US10] Create import UI page (upload file, preview, column mapping, confirm) at target/src/app/(dashboard)/contacts/import/page.tsx

#### OpenAPI & Seed

- [ ] T209 [US10] Install zod-to-openapi and create OpenAPI 3.1 spec generation route at target/src/app/api/v1/openapi.json/route.ts
- [ ] T210 [US10] Create seed data script (1 workspace, 3 users, 1 pipeline, 50 companies, 200 contacts, 30 deals, 500 activities, 5 custom fields, pre-computed scores) in target/scripts/seed.ts

#### E2E Tests

- [ ] T211 [US10] Write E2E test: dashboard loads with seed data, funnel chart renders, click stage filters deals in target/tests/e2e/dashboard.spec.ts
- [ ] T212 [US10] Write E2E test: import CSV, preview, confirm, contacts appear in list in target/tests/e2e/import.spec.ts

**Checkpoint**: Dashboard analytics operational. Import/export working. OpenAPI spec published. Seed data available.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Quality, security, and documentation improvements across all stories.

- [ ] T213 [P] Verify OWASP API Security Top 10 compliance: BOLA (workspace isolation), mass assignment (Zod validation), excessive data exposure (field selection) across all API routes
- [ ] T214 [P] Add rate limiting middleware for /api/v1/* REST endpoints and MCP transport in target/src/server/lib/rate-limit.ts
- [ ] T215 [P] Configure Content Security Policy, CORS, and security headers in target/next.config.ts
- [ ] T216 Verify soft delete filtering is applied on all list/search queries (contacts, companies, deals, custom objects)
- [ ] T219 Run full test suite: pnpm test && pnpm test:e2e
- [ ] T220 Run TypeScript strict mode build: pnpm build with zero errors
- [ ] T221 Run ESLint: pnpm lint with zero errors
- [ ] T222 Verify Docker build succeeds: docker build .
- [ ] T223 Validate quickstart.md by following setup steps on clean environment
- [ ] T224 Run seed data script and verify dashboard, pipeline board, and activity timelines render correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — core CRM checkpoint
- **US2 (Phase 4)**: Depends on Foundational — can parallel with US1 backend, needs US1 schemas
- **US5 (Phase 5)**: Depends on US1 + US2 schemas (activities) — timeline needs both
- **US3 (Phase 6)**: Depends on US2 (synced meetings) + US5 (timeline display)
- **US4 (Phase 7)**: Depends on US2 (activity data) + US5 (timeline)
- **US6 (Phase 8)**: Depends on Foundational — can parallel with US1-US5
- **US7 (Phase 9)**: Depends on Foundational — can parallel with US1-US6
- **US8 (Phase 10)**: Depends on US1 (CRM CRUD) — benefits from US3/US4 but not required
- **US9 (Phase 11)**: Depends on US1 (entity forms) — can parallel with US3-US8
- **US10 (Phase 12)**: Depends on US1 (entities) + US5 (search) — benefits from all prior
- **Polish (Phase 13)**: Depends on all desired stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
Phase 3: US1 (Core CRM)  ←──────────────────────────────── CORE CRM CHECKPOINT
    ↓                    ↘
Phase 4: US2 (Sync)      Phase 8: US6 (Enrichment)  ┐
    ↓                     Phase 9: US7 (Webhooks)    ├── Can parallel after Phase 2
Phase 5: US5 (Timeline)   Phase 11: US9 (Custom Fields)┘
    ↓        ↘
Phase 6: US3  Phase 7: US4    Phase 10: US8 (MCP) ← after US1
(AI Summary)  (ML Scoring)
              ↓               ←──────────────────── CONSTITUTION MVP (Phases 3-7 + 9)
Phase 12: US10 (Reports/Import/Export)
    ↓
Phase 13: Polish
```

### Within Each User Story

1. Tests FIRST (write, verify they fail)
2. Database schemas
3. Zod validators
4. tRPC routers / services
5. Background workers (if applicable)
6. REST API routes (if applicable)
7. Frontend components
8. E2E tests (verify everything works together)

### Parallel Opportunities

- **Phase 1**: All [P] setup tasks run in parallel
- **Phase 2**: T014-T015 parallel, T023-T027 parallel
- **Phase 3**: All schema tasks (T038-T043) parallel, all validator tasks (T045-T047) parallel, all REST routes (T054-T057) parallel, UI components with [P] parallel
- **Phase 4**: Calendar sync services (T097-T098) parallel, webhook routes (T100-T101) parallel
- **US6, US7, US9**: Can develop concurrently after Phase 2 (independent features)
- **US8**: Can start after US1 (uses same CRUD operations)

---

## Parallel Example: User Story 1

```text
# Parallel batch 1: All database schemas
T038: contact schema
T039: company schema
T040: pipeline schema
T041: deal schema
T042: audit_log schema
T043: tag schemas

# Parallel batch 2: All Zod validators (after schemas)
T045: contact validators
T046: company validators
T047: deal validators

# Parallel batch 3: All REST routes (after tRPC routers)
T054: contacts REST
T055: companies REST
T056: deals REST
T057: pipelines REST

# Parallel batch 4: UI components (after tRPC client wired)
T062: sidebar
T063: header
T068: company table
T069: companies page
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Core CRM)
4. **CORE CRM CHECKPOINT**: Full CRM with contacts, companies, deals, pipeline board, REST API
5. Continue to constitution MVP (Phases 4-7 + 9)

### Constitution MVP (Recommended)

1. Setup + Foundational → Foundation ready
2. US1 → Core CRM checkpoint → Deploy/Demo
3. US2 → Zero-entry sync → Deploy/Demo (primary differentiator)
4. US5 → Timeline + Search → Deploy/Demo (makes sync data visible)
5. US3 + US4 → AI summaries + ML scoring → Deploy/Demo (AI features)
6. US7 → Webhooks → **CONSTITUTION MVP COMPLETE** → Deploy/Demo
7. US6 + US8 + US9 → Enrichment, MCP, custom fields (parallel post-MVP sprint)
8. US10 → Reports + Import/Export → Deploy/Demo (production readiness)
9. Polish → Security hardening, performance, documentation

### Parallel Team Strategy

With 3 developers after Foundational:

- **Developer A**: US1 → US5 → US3 (core UI → timeline → AI)
- **Developer B**: US2 → US4 → US10 (sync → scoring → reports)
- **Developer C**: US6 → US7 → US8 → US9 (enrichment → webhooks → MCP → custom fields)

---

## Notes

- [P] tasks = different files, no dependencies on in-progress tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Foundational phase
- Constitution requires test-first: write tests, verify they fail, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
