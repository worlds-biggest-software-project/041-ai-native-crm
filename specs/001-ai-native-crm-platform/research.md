# Research: AI-Native CRM Platform

**Branch**: `001-ai-native-crm-platform` | **Date**: 2026-05-12

## Technology Decisions

### 1. Hybrid Relational + JSONB Data Model

**Decision**: Use PostgreSQL relational tables for core entity structure with JSONB columns for custom fields, validated at the application layer against a `field_definitions` meta-schema table.

**Rationale**: This approach (documented as data-model-suggestion-3 in the project research) balances query performance on standard CRM fields (relational columns with indexes) with unlimited extensibility (JSONB custom fields). GIN indexes on JSONB columns support efficient queries on custom field values. Application-layer validation via Drizzle ORM and Zod keeps custom field rules in sync with the meta-schema without requiring database DDL changes per workspace.

**Alternatives considered**:
- Pure relational (EAV pattern): Too many JOINs for custom fields; EAV is slow at CRM scale.
- Pure JSONB (schema-less): Loses relational query performance on standard fields; harder to enforce foreign keys.
- Separate schema per workspace: Operational complexity scales linearly with tenants; migration management becomes unviable.

### 2. Email Sync Strategy: API-First with Push Notifications

**Decision**: Use Gmail API (history-based incremental sync + push notifications) and Microsoft Graph API (delta query + change notifications) rather than IMAP.

**Rationale**: Both Google and Microsoft have deprecated plain-auth IMAP (OAuth 2.0 mandatory since 2024). Their native APIs provide structured message data (headers, body, threading), push notification support for near-real-time sync, and rate-limit-friendly incremental sync patterns. The Gmail `history.list` endpoint and Graph `delta` query both support efficient "what changed since last sync" semantics.

**Alternatives considered**:
- IMAP with OAuth: Still supported technically, but provides unstructured raw email requiring additional parsing. No push notification support; requires polling.
- Third-party aggregator (Nylas, Context.IO): Adds vendor dependency and per-user cost; eliminates the open-source advantage.

### 3. LLM Provider: Anthropic Claude via Vercel AI SDK

**Decision**: Use the Anthropic Claude SDK for meeting summaries, follow-up drafts, and entity extraction, with Vercel AI SDK 4 for streaming responses and structured output.

**Rationale**: Claude provides strong instruction-following for structured JSON output (meeting summary schema), competitive quality for email drafting, and the Anthropic SDK has first-class TypeScript support. The Vercel AI SDK adds provider-swappable abstraction — teams can switch to OpenAI or other providers without changing application code.

**Alternatives considered**:
- OpenAI GPT-4: Comparable quality; Vercel AI SDK makes this a configuration change.
- Self-hosted LLM (Ollama/vLLM): Insufficient quality for meeting summarization at acceptable latency; viable for self-hosted deployment option in future.
- Direct API calls without SDK: Loses streaming, structured output helpers, and provider abstraction.

### 4. ML Scoring: ONNX Runtime for Production Inference

**Decision**: Train scoring models in Python (scikit-learn/XGBoost), export to ONNX format, and run inference in Node.js via ONNX Runtime.

**Rationale**: This separates the training environment (Python, where the ML ecosystem is mature) from the production runtime (Node.js, where the application runs). ONNX Runtime for Node.js provides native inference without a Python sidecar. The heuristic fallback ensures scoring works from day one before training data accumulates.

**Alternatives considered**:
- Python microservice for inference: Adds operational complexity, network latency, and a second runtime to deploy.
- TensorFlow.js: Limited XGBoost support; ONNX is the standard cross-platform format.
- Rule-based scoring only: Insufficient accuracy for the 70% prediction target in SC-003.

### 5. Background Job Processing: BullMQ on Redis

**Decision**: Use BullMQ 5.x with Redis 7 for all background processing: email sync, calendar sync, AI summarization, scoring, enrichment, and webhook dispatch.

**Rationale**: BullMQ provides repeatable jobs (for sync scheduling), rate limiting (for API quota compliance), retry with exponential backoff, concurrency control, and delayed jobs (for workflow "wait" steps). Redis is already required for session caching and rate limiting. BullMQ's TypeScript-first API integrates naturally with the codebase.

**Alternatives considered**:
- pg-boss (PostgreSQL-backed queues): Avoids Redis dependency but lacks BullMQ's rate limiting and repeatable job features.
- Temporal/Inngest: Over-engineered for the current scope; better suited if workflow complexity grows significantly.
- In-process setInterval: Not viable for email sync jobs that must survive server restarts.

### 6. Authentication: Auth.js v5 with Admin-Provisioned Workspaces

**Decision**: Use Auth.js v5 (NextAuth) with Google and Microsoft OAuth providers. Workspaces are admin-provisioned; users are added by admins and authenticate via OAuth.

**Rationale**: Auth.js v5 has native Next.js App Router support, built-in OAuth 2.0 flows for Google and Microsoft (the same providers used for email/calendar sync), and a Drizzle adapter for session/account storage. JWT session strategy supports stateless API authentication. Admin-provisioned workspaces (Clarification Q1) simplify onboarding for the initial release while maintaining security.

**Alternatives considered**:
- Clerk/Auth0: Adds vendor dependency and per-user cost; Auth.js is open-source and self-hostable.
- Custom OAuth implementation: Unnecessary complexity when Auth.js handles token refresh, PKCE, and session management.

### 7. Workspace Isolation Strategy

**Decision**: Application-layer workspace filtering on all queries via tRPC middleware (`ctx.workspaceId` injected into every protected procedure). PostgreSQL RLS as a secondary defense layer.

**Rationale**: Application-layer filtering is testable, debuggable, and works with Drizzle ORM's query builder. RLS provides defense-in-depth — if a query accidentally omits the workspace filter, RLS blocks cross-tenant data access. The `protectedProcedure` middleware ensures `workspaceId` is always available in context.

**Alternatives considered**:
- RLS only: Harder to debug, requires PostgreSQL-level session variables, and doesn't work cleanly with connection pooling.
- Schema-per-tenant: Not viable at scale; migration management per workspace is prohibitive.

### 8. Custom Field Validation Strategy

**Decision**: Application-layer validation using Zod schemas dynamically generated from `field_definitions` meta-schema. No database-level CHECK constraints for custom fields.

**Rationale**: Custom field types (select, multi-select, entity reference, rich text) require complex validation logic that PostgreSQL CHECK constraints cannot express. Zod schemas are generated per-request from the cached field definitions, providing type-safe validation with meaningful error messages. The field definitions table acts as a meta-schema that workspaces can modify without database DDL.

**Alternatives considered**:
- JSON Schema validation: Viable but Zod is already used throughout the codebase for tRPC input validation; adding a second validation library adds no value.
- Database triggers: Cannot provide user-friendly error messages; harder to maintain and test.

### 9. Soft Delete Implementation

**Decision**: Add `deleted_at` timestamp column to contacts, companies, deals, and custom object records. Soft-deleted records are hidden from all list/search queries but retained for 30 days. Hard delete is available for GDPR erasure requests.

**Rationale**: Soft delete protects against accidental data loss (critical for sales teams), preserves audit trail integrity, and supports GDPR's "right to be forgotten" with a separate hard-delete path that clears enrichment data and AI summaries.

**Alternatives considered**:
- Hard delete only: No recovery path for accidental deletions; audit trail loses entity references.
- Archive table: Adds complexity for marginal benefit over a `deleted_at` filter.

### 10. Domain Exclusion for Email Sync

**Decision**: Store an `excluded_domains` array in workspace settings. During email sync, emails where all participants (from + to + cc) are within excluded domains are skipped for activity logging and contact creation.

**Rationale**: Internal emails (between coworkers) create noise in the CRM timeline and auto-create contacts for every colleague. Domain exclusion is a simple, effective filter that covers the primary use case without requiring complex per-sender rules.

**Alternatives considered**:
- Per-sender allowlist/blocklist: Too granular for initial release; domain-level filtering covers 95% of the need.
- Sync everything, filter in UI: Wastes storage and processing for emails that will never be viewed in CRM context.
