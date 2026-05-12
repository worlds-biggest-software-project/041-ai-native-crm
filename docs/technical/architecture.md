# NativeCRM System Architecture

## Overview

NativeCRM is a full-stack AI-native CRM platform built as a Next.js 16 monolith with co-located background workers. The system eliminates manual data entry through zero-entry pipeline population from connected email and calendar accounts, combined with LLM-powered meeting summaries, ML-driven deal health scoring, GDPR-safe enrichment, and a native MCP server for AI assistant integration.

**Tech Stack:**
- **Runtime:** Node.js 22 LTS, TypeScript 5 (strict mode, `noUncheckedIndexedAccess`)
- **Framework:** Next.js 16 (App Router)
- **API Layer:** tRPC v11 (internal), REST `/api/v1/*` (public)
- **Database:** PostgreSQL 16 with JSONB + GIN indexes
- **Cache / Queues:** Redis 7 (BullMQ 5.x job queues, rate limiting)
- **ORM:** Drizzle ORM
- **Auth:** Auth.js v5 (JWT strategy, Google + Microsoft OAuth)
- **Validation:** Zod v4
- **UI:** Tailwind CSS 4, shadcn/ui components
- **AI/ML:** Anthropic Claude SDK, Vercel AI SDK 4, ONNX Runtime
- **MCP:** @modelcontextprotocol/sdk (HTTP SSE transport)

## Architecture Diagram

```
                                  +---------------------------+
                                  |       Web Browsers        |
                                  |   (React / Next.js UI)    |
                                  +------------+--------------+
                                               |
                                     HTTPS (TLS 1.3)
                                               |
                   +---------------------------+---------------------------+
                   |                    Next.js 16 Server                  |
                   |                                                       |
                   |  +-------------+  +-------------+  +---------------+  |
                   |  |  App Router |  |  REST API   |  |  MCP Server   |  |
                   |  |  (Pages +   |  | /api/v1/*   |  | /api/mcp      |  |
                   |  |   tRPC)     |  | Bearer Auth |  | HTTP SSE      |  |
                   |  +------+------+  +------+------+  +-------+-------+  |
                   |         |                |                  |          |
                   |  +------+----------------+------------------+------+   |
                   |  |              Service Layer                      |   |
                   |  |  email-sync/ | calendar-sync/ | ai/            |   |
                   |  |  scoring/    | enrichment/    | mcp/           |   |
                   |  |  import/     | webhook-dispatch | workflow-engine|  |
                   |  +------+------------------------------------------+  |
                   |         |                                              |
                   +---------+----------------------------------------------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     |   PostgreSQL 16  |          |    Redis 7      |
     |                  |          |                  |
     |  - CRM entities  |          |  - BullMQ queues |
     |  - Audit logs    |          |  - Rate limits   |
     |  - Custom fields |          |  - Session cache  |
     |  - JSONB + GIN   |          |                  |
     +------------------+          +--------+--------+
                                            |
                                   +--------+--------+
                                   |  BullMQ Workers  |
                                   |  (separate proc) |
                                   |                  |
                                   |  - email-sync    |
                                   |  - calendar-sync |
                                   |  - ai-summary    |
                                   |  - scoring       |
                                   |  - enrichment    |
                                   |  - webhook       |
                                   +------------------+

     External Services:
     +------------------+  +---------------------+  +-------------------+
     | Gmail API        |  | Microsoft Graph API |  | OpenCorporates    |
     | Google Calendar  |  | Outlook Calendar    |  | Companies House   |
     +------------------+  +---------------------+  +-------------------+
     +------------------+  +---------------------+
     | Anthropic Claude |  | MCP Clients         |
     | (LLM inference)  |  | (Claude, Cursor...) |
     +------------------+  +---------------------+
```

## Component Breakdown

### Frontend (React / Next.js App Router)

The frontend is a server-side rendered React application using Next.js 16 App Router with two route groups:

- **`(auth)/`** -- Login page and OAuth callback handler.
- **`(dashboard)/`** -- Protected pages behind authentication: contacts, companies, deals (Kanban pipeline board), activities, settings, reports.

Key UI components are organized by domain under `src/components/`:

| Directory | Purpose |
|-----------|---------|
| `ui/` | shadcn/ui base components (Button, Dialog, Table, etc.) |
| `layout/` | Sidebar navigation, header bar, command palette (global search) |
| `contacts/` | Contact table (TanStack Table v8), detail view, create/edit form |
| `companies/` | Company table, detail view |
| `deals/` | Pipeline Kanban board (@dnd-kit), deal cards, deal detail |
| `activities/` | Unified timeline, activity items, email thread view |
| `ai/` | Meeting summary card, follow-up draft editor, score badge |
| `enrichment/` | Enrichment review queue |
| `settings/` | Domain exclusion config, MCP key management |
| `shared/` | Custom field renderer, entity tags, empty states |

### API Layer

NativeCRM exposes two API surfaces:

**tRPC (Internal)** -- Served at `/api/trpc/[trpc]` via Next.js App Router. Used by the React frontend for all data operations. SuperJSON serialization supports native Date, BigInt, Map, and Set types. 17 routers plus a public health check endpoint.

**REST (Public)** -- Served at `/api/v1/*`. Bearer token authentication. Designed for third-party integrations, webhooks, and programmatic access. Cursor-based pagination, Zod-validated inputs, OpenAPI 3.1 spec at `/api/v1/openapi.json`.

**MCP Server** -- Served at `/api/mcp` via HTTP SSE transport. Exposes CRM data as MCP resources, write operations as tools, and reusable prompt templates. Bearer token authentication (MCP API key).

### Service Layer

Business logic lives in `src/server/services/`, isolated from the transport layer:

| Service | Purpose |
|---------|---------|
| `email-sync/gmail.ts`, `email-sync/outlook.ts` | OAuth-authenticated email sync via Gmail API and Microsoft Graph |
| `email-sync/parser.ts` | Email body extraction, HTML stripping, contact matching |
| `calendar-sync/google-calendar.ts`, `calendar-sync/outlook-calendar.ts` | Calendar event sync with attendee-to-contact mapping |
| `ai/meeting-summary.ts` | LLM-powered structured meeting summary generation |
| `ai/follow-up-draft.ts` | Context-aware follow-up email draft generation |
| `ai/entity-extraction.ts` | NLP entity extraction from email/meeting content |
| `ai/prompts.ts` | Prompt templates for AI operations |
| `scoring/pipeline.ts` | Orchestrates deal health and lead scoring pipeline |
| `scoring/feature-engineering.ts` | Feature extraction from activity data |
| `scoring/inference.ts` | ONNX Runtime model inference + heuristic fallback |
| `enrichment/enrichment-engine.ts` | Orchestrates multi-source enrichment with confidence scoring |
| `enrichment/gdpr-compliance.ts` | GDPR Article 14 notices, erasure, LIA documentation |
| `enrichment/sources/` | Individual enrichment adapters (OpenCorporates, company registries) |
| `mcp/server.ts` | MCP server setup and transport configuration |
| `mcp/resources.ts` | CRM data exposed as MCP resources |
| `mcp/tools.ts` | CRM write operations exposed as MCP tools |
| `mcp/prompts.ts` | Reusable MCP prompt templates |
| `import/csv-parser.ts` | CSV import with field mapping and deduplication |
| `import/vcard-parser.ts` | vCard (RFC 6350) import parser |
| `webhook-dispatch.ts` | Webhook matching, HMAC signing, queue dispatch |
| `workflow-engine.ts` | Trigger-condition-action workflow execution |

### Background Workers (BullMQ)

Workers run in a separate Node.js process from the same codebase. They consume jobs from Redis-backed BullMQ queues:

| Queue | Worker | Schedule | Purpose |
|-------|--------|----------|---------|
| `email-sync` | `email-sync.worker.ts` | Every 5 min (repeatable) | Sync emails from Gmail and Outlook |
| `calendar-sync` | `calendar-sync.worker.ts` | Every 15 min (repeatable) | Sync calendar events |
| `ai-summary` | `ai-summary.worker.ts` | On demand | Generate meeting summaries via LLM |
| `ai-jobs` | -- | On demand | General AI processing jobs |
| `scoring` | `scoring.worker.ts` | On activity + daily batch | Compute deal health and lead scores |
| `enrichment` | `enrichment.worker.ts` | On entity creation | Enrich contacts/companies from public sources |
| `webhook` | `webhook.worker.ts` | On CRM events | Deliver webhook payloads to registered endpoints |
| `webhook-dispatch` | -- | On CRM events | Route events to matching webhook subscriptions |

Workers support:
- Configurable retry with exponential backoff
- Graceful shutdown on SIGTERM/SIGINT
- Token refresh jobs (every 5 min, refreshes tokens expiring within 10 min)
- Concurrent job processing per queue

### Database (PostgreSQL 16)

The database uses a hybrid relational + JSONB model:

- **Core fields** are relational columns with proper foreign keys, indexes, and constraints.
- **Custom fields** are stored in a `custom_fields JSONB` column per entity, validated at the application layer against the `field_definitions` table.
- **Activity detail** payloads use JSONB with type-specific schemas (email, meeting, call, note, stage_change).
- **Full-text search** uses PostgreSQL `tsvector` columns with GIN indexes and weighted search vectors.
- **Audit logs** are partitioned by quarter on `occurred_at` for query performance at scale.

### Cache (Redis 7)

Redis serves three roles:

1. **Job Queues** -- BullMQ stores job definitions, state, and scheduling metadata.
2. **Rate Limiting** -- Per-IP sliding window rate limit counters (100 req/min default).
3. **Session State** -- Auth.js JWT validation cache.

## Request Flows

### Web UI Request Flow

```
Browser
  --> Next.js App Router (SSR/RSC)
    --> tRPC client (SuperJSON over HTTP)
      --> /api/trpc/[trpc]/route.ts
        --> createContext() (reads Auth.js JWT session)
          --> protectedProcedure middleware (validates session, injects workspaceId)
            --> Router handler (e.g., contacts.list)
              --> Drizzle ORM query (workspace-scoped WHERE clause)
                --> PostgreSQL
              <-- Typed result
            <-- SuperJSON response
          <-- React component renders
        <-- HTML/JSON to browser
```

### REST API Request Flow

```
External Client
  --> HTTPS request with Bearer token
    --> /api/v1/contacts/route.ts
      --> authenticateApiRequest() (validates workspace_id:secret against API_SECRET)
      --> rateLimit() (per-IP, 100 req/min)
      --> Zod schema validation (createContactSchema / listContactsSchema)
      --> Drizzle ORM query (workspace-scoped)
        --> PostgreSQL
      <-- JSON response with data envelope + meta (cursor, hasMore, total)
```

### Background Processing Flow

```
CRM Event (e.g., deal stage changed)
  --> Service layer dispatches to BullMQ queue
    --> Redis stores job
      --> Worker picks up job
        --> Process (e.g., generate AI summary, compute score, deliver webhook)
          --> Write results to PostgreSQL
          --> Optionally enqueue follow-up jobs
        <-- Job marked complete (or retried on failure)
```

### Email Sync Flow

```
Repeatable Job (every 5 min)
  --> email-sync.worker picks up job
    --> Load active OAuth connections for provider
      --> Decrypt refresh token (AES-256-GCM)
      --> Call Gmail API / Microsoft Graph (incremental sync)
        --> Parse email bodies (strip HTML, extract plain text)
        --> Match sender/recipients to existing contacts (by email within workspace)
        --> Auto-create contacts for unknown addresses (respecting domain exclusion)
        --> Create activity records (type: email) with detail JSONB
        --> Update denormalized counters (email_count on contact/deal)
      <-- Persist sync cursor (history_id / deltaLink) for next run
```

## Authentication Flow

### OAuth Sign-In

```
1. User clicks "Sign in with Google" (or Microsoft)
2. Browser redirects to provider's OAuth consent screen
   - Google scopes: openid, email, profile, gmail.readonly, calendar.readonly
   - Microsoft scopes: openid, email, profile, offline_access, Mail.Read, Calendars.Read
3. Provider redirects back to /callback with authorization code
4. Auth.js exchanges code for tokens
5. JWT callback fires:
   a. Looks up user by email in users table (must be active, pre-provisioned)
   b. Embeds workspaceId and role into JWT token
6. Session callback injects workspaceId and role into session object
7. Browser receives JWT cookie
8. All subsequent requests include JWT cookie
9. protectedProcedure middleware extracts workspaceId from JWT
```

### API Token Authentication (REST + MCP)

```
1. Admin generates API key via settings.generateMcpKey tRPC mutation
2. Token format: workspace_id:secret
3. Client sends: Authorization: Bearer <workspace_id>:<secret>
4. authenticateApiRequest() splits token, validates secret against API_SECRET env var
5. Returns { workspaceId, userId: "api" } for workspace-scoped queries
```

## Data Isolation Model

Every database query is scoped to a workspace. This is enforced at multiple layers:

1. **tRPC middleware** -- `protectedProcedure` injects `ctx.workspaceId` from the JWT. All router handlers use this value in WHERE clauses.
2. **REST API middleware** -- `authenticateApiRequest()` extracts `workspaceId` from the Bearer token.
3. **MCP server** -- Workspace ID derived from the MCP API key.
4. **Service layer** -- All service functions accept `workspaceId` as a required parameter.
5. **Database indexes** -- Composite indexes on `(workspace_id, ...)` ensure efficient scoped queries.

Records from one workspace are never visible to another workspace. There is no cross-workspace query capability.

## Caching Strategy

| Use Case | Store | TTL | Eviction |
|----------|-------|-----|----------|
| BullMQ job queues and state | Redis | Per-job (varies) | BullMQ manages lifecycle |
| Rate limit counters | In-memory Map | 60 seconds (sliding window) | Automatic on window expiry |
| Auth.js JWT sessions | Stateless JWT | Token expiry | N/A (validated on each request) |
| OAuth sync cursors | PostgreSQL (sync_config JSONB) | Permanent | Updated on each sync run |

Note: The current architecture uses in-memory rate limiting. For multi-instance deployments, this should be migrated to Redis-backed rate limiting.

## Error Handling Patterns

### API Layer

All REST endpoints return a consistent error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

HTTP status codes follow REST conventions:
- `400` -- Zod validation failure
- `401` -- Missing or invalid authentication
- `403` -- Insufficient permissions (member accessing admin-only resource)
- `404` -- Resource not found or soft-deleted
- `409` -- Duplicate unique constraint violation
- `429` -- Rate limit exceeded (includes `Retry-After` header)
- `500` -- Unhandled server error (logged, generic message returned)

### tRPC Layer

tRPC errors use typed error codes mapped to HTTP equivalents:
- `UNAUTHORIZED` -- No valid session
- `FORBIDDEN` -- Admin-only operation attempted by member
- `NOT_FOUND` -- Entity not found in workspace
- `BAD_REQUEST` -- Input validation failure
- `INTERNAL_SERVER_ERROR` -- Unhandled error

### Background Workers

Worker failures use BullMQ's built-in retry mechanism:
- Configurable retry count per queue (default: 3-5 attempts)
- Exponential backoff (base delay varies by queue)
- Failed jobs are preserved in Redis for inspection
- Graceful shutdown allows in-progress jobs to complete before exit

### External Service Failures

- **OAuth token refresh failure:** Connection marked inactive, sync jobs stop, user notified to re-authorize.
- **LLM service unavailable:** Job retried with exponential backoff; meeting activity visible without summary ("Summary pending" indicator).
- **Email provider rate limit:** Worker respects rate limit headers, resumes on next polling interval.
- **Enrichment source timeout:** Job retried; partial enrichment results preserved.

## Deployment Topology

### Production Architecture

```
                    +-------------------+
                    |   Load Balancer   |
                    |   (HTTPS / TLS)   |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     | Next.js Server  |          | Next.js Server  |
     | (App Router +   |          | (replica)       |
     | API routes)     |          |                 |
     +--------+--------+          +--------+--------+
              |                             |
              +--------------+--------------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     |   PostgreSQL 16  |          |    Redis 7      |
     |   (primary +     |          |   (standalone   |
     |    read replicas)|          |    or Sentinel)  |
     +------------------+          +--------+--------+
                                            |
                                   +--------+--------+
                                   |  Worker Process  |
                                   |  (BullMQ)        |
                                   |  Single instance  |
                                   |  or scaled        |
                                   +------------------+
```

### Docker Compose (Local Development / Self-Hosted)

The `docker-compose.yml` in `target/` defines:

| Service | Image | Ports |
|---------|-------|-------|
| `app` | Next.js application | 3000 |
| `worker` | Same image, different entrypoint | -- |
| `postgres` | PostgreSQL 16 | 5432 |
| `redis` | Redis 7 | 6379 |

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `NEXTAUTH_URL` | Base URL for Auth.js callbacks | Yes |
| `NEXTAUTH_SECRET` | JWT signing secret | Yes |
| `ENCRYPTION_KEY` | 64-char hex string (32 bytes) for AES-256-GCM | Yes |
| `API_SECRET` | Secret for REST API Bearer token validation | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `MICROSOFT_ENTRA_ID_CLIENT_ID` | Microsoft Entra ID client ID | Optional |
| `MICROSOFT_ENTRA_ID_CLIENT_SECRET` | Microsoft Entra ID client secret | Optional |
| `MICROSOFT_ENTRA_ID_TENANT_ID` | Microsoft tenant ID (defaults to "common") | Optional |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key for AI features | Yes |

## Performance Targets

| Metric | Target |
|--------|--------|
| Dashboard load (500 active deals) | < 2 seconds |
| API response (p95) | < 200 ms |
| Meeting summary generation | < 30 seconds |
| Email sync latency | < 5 minutes |
| CSV import (1,000 records) | < 60 seconds |
| Concurrent users per workspace | 50 |

## Project Structure Reference

```
target/
  src/
    app/                          # Next.js App Router
      (auth)/                     # Login + OAuth callback
      (dashboard)/                # Protected CRM pages
        contacts/                 # Contact list + detail
        companies/                # Company list + detail
        deals/                    # Pipeline board + deal detail
        activities/               # Activity timeline
        settings/                 # Workspace, integrations, webhooks, etc.
        reports/                  # Pipeline analytics
      api/
        trpc/[trpc]/              # tRPC endpoint
        v1/                       # Public REST API
        mcp/                      # MCP server (HTTP SSE)
        webhooks/                 # Gmail/Outlook push notification receivers
    server/
      db/
        index.ts                  # Drizzle client initialization
        schema/                   # All table definitions (Drizzle)
        migrations/               # Database migration files
      trpc/
        init.ts                   # tRPC initialization + middleware
        context.ts                # Request context (session, workspace)
        router.ts                 # Root router composition
        routers/                  # 17 domain routers
      services/                   # Business logic (see Service Layer above)
      workers/                    # BullMQ worker processes
      lib/                        # Shared utilities
        auth.ts                   # Auth.js configuration
        api-auth.ts               # REST API Bearer token authentication
        encryption.ts             # AES-256-GCM encrypt/decrypt
        queue.ts                  # BullMQ queue definitions
        redis.ts                  # Redis client
        rate-limit.ts             # Per-IP rate limiting
        audit.ts                  # Audit log writer
        validators.ts             # Zod schemas for all entities
    components/                   # React components (by domain)
    lib/                          # Client-side utilities
    types/                        # Shared TypeScript types
  tests/
    unit/                         # Vitest unit tests
    integration/                  # Vitest integration tests
    contract/                     # API contract tests
    e2e/                          # Playwright browser tests
    fixtures/                     # Test data fixtures
  scripts/
    seed.ts                       # Development seed data
    train-scoring-model.py        # Python ML training script
  models/                         # ONNX model files
```
