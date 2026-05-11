# Data Model Suggestion 2: Event-Sourced / Audit-First (CQRS)

> Project: AI-Native CRM · Created: 2026-05-11

## Philosophy

This model treats every state change in the CRM as an immutable event stored in an append-only event store. The current state of any entity (contact, deal, meeting) is derived by replaying its event stream. Separate materialized read models (projections) are maintained for fast queries -- the classic Command Query Responsibility Segregation (CQRS) pattern.

Event sourcing is the natural architecture for an AI-native CRM because AI features thrive on history. Meeting summaries need the full conversation timeline. Deal health scoring needs the complete sequence of interactions, stage changes, and communication patterns. Win/loss analysis needs to replay the entire lifecycle of closed deals. In a traditional CRUD schema, this history is either lost or stored in separate audit tables. In an event-sourced system, history IS the data -- the current state is merely a cached projection of it.

Banks, trading platforms, and healthcare systems use event sourcing for regulatory compliance. A CRM handling GDPR-regulated personal data benefits from the same pattern: every data change is traceable, every enrichment is auditable, and temporal queries ("what did we know about this contact on March 15?") are answerable by replaying events up to that timestamp.

**Best for:** Teams that need complete audit trails, temporal queries, AI/ML pipelines that consume change history, and regulatory environments where data provenance matters.

**Trade-offs:**
- (+) Complete, immutable audit trail -- every change is preserved forever
- (+) Temporal queries are trivial: replay events to any point in time
- (+) AI/ML pipelines can consume the event stream directly as training data
- (+) Extensible without schema migrations: new event types are just new JSON shapes
- (+) Natural fit for real-time features (webhooks, live dashboards, sync)
- (-) Higher storage requirements: events accumulate indefinitely
- (-) Read model projections add complexity and must be kept in sync
- (-) Debugging projection bugs requires understanding event replay mechanics
- (-) Simple CRUD queries require consulting projections rather than querying source data directly
- (-) Team must understand event sourcing concepts (non-trivial learning curve)

---

## Standards Alignment

| Standard | How It's Used |
|----------|---------------|
| RFC 6350 (vCard 4.0) | ContactCreated/ContactUpdated events carry vCard-aligned field names |
| RFC 5545 (iCalendar) | MeetingScheduled events carry iCalendar-aligned fields (DTSTART, DTEND, RRULE) |
| ISO 8601 | All event timestamps in ISO 8601 TIMESTAMPTZ; event metadata uses ISO 8601 |
| GDPR Art. 6/14/25 | Every data change is an auditable event; enrichment events include provenance metadata |
| CloudEvents 1.0 (CNCF) | Event envelope format aligns with CloudEvents specification for interoperability |
| MCP (2025-11-25) | Event stream exposes CRM changes as MCP resources for AI agent consumption |
| OAuth 2.0 | OAuth token lifecycle managed via events (TokenGranted, TokenRefreshed, TokenRevoked) |
| JSON Schema 2020-12 | Event payload schemas defined as JSON Schema for validation and documentation |

---

## Event Store (Source of Truth)

```sql
-- ============================================================
-- EVENT STORE — the single source of truth
-- ============================================================

CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    -- Aggregate identification
    aggregate_type  VARCHAR(50) NOT NULL,   -- contact, company, deal, meeting, email, task, workflow
    aggregate_id    UUID NOT NULL,          -- the entity this event belongs to
    -- Event metadata
    event_type      VARCHAR(100) NOT NULL,  -- e.g., ContactCreated, DealStageChanged, EmailReceived
    event_version   INTEGER NOT NULL DEFAULT 1,  -- schema version for this event type
    sequence_number BIGINT NOT NULL,        -- monotonically increasing per aggregate
    -- Event payload
    data            JSONB NOT NULL,         -- event-specific payload (see examples below)
    metadata        JSONB NOT NULL DEFAULT '{}',
    -- Example metadata:
    -- {
    --   "user_id": "uuid",
    --   "ip_address": "192.168.1.1",
    --   "user_agent": "...",
    --   "correlation_id": "uuid",    -- traces related events across aggregates
    --   "causation_id": "uuid",      -- the event that caused this event
    --   "source": "api|ui|sync|ai"   -- what triggered this event
    -- }
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Optimistic concurrency: unique per aggregate
    UNIQUE (aggregate_id, sequence_number)
) PARTITION BY RANGE (occurred_at);

-- Partition by month for manageable table sizes
CREATE TABLE events_2026_01 PARTITION OF events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE events_2026_02 PARTITION OF events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE events_2026_03 PARTITION OF events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE events_2026_04 PARTITION OF events
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE events_2026_05 PARTITION OF events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE events_2026_06 PARTITION OF events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
-- ... continue monthly partitions

-- Primary query patterns
CREATE INDEX idx_events_aggregate ON events(aggregate_id, sequence_number);
CREATE INDEX idx_events_workspace_type ON events(workspace_id, event_type, occurred_at DESC);
CREATE INDEX idx_events_workspace_time ON events(workspace_id, occurred_at DESC);
CREATE INDEX idx_events_correlation ON events USING GIN ((metadata->'correlation_id'));

-- ============================================================
-- EVENT TYPE REGISTRY — schema documentation
-- ============================================================

CREATE TABLE event_type_registry (
    event_type      VARCHAR(100) PRIMARY KEY,
    aggregate_type  VARCHAR(50) NOT NULL,
    description     TEXT NOT NULL,
    payload_schema  JSONB NOT NULL,         -- JSON Schema for the data field
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Example Event Payloads

```sql
-- ContactCreated event
-- {
--   "event_type": "ContactCreated",
--   "data": {
--     "first_name": "Jane",
--     "last_name": "Smith",
--     "full_name": "Jane Smith",
--     "email": "jane@acme.com",
--     "phone": "+1-555-0123",
--     "job_title": "VP Engineering",
--     "company_id": "uuid-of-acme",
--     "source": "email_sync",
--     "lifecycle_stage": "lead"
--   }
-- }

-- DealStageChanged event
-- {
--   "event_type": "DealStageChanged",
--   "data": {
--     "from_stage": "qualification",
--     "to_stage": "proposal",
--     "from_stage_id": "uuid",
--     "to_stage_id": "uuid",
--     "duration_in_previous_stage_seconds": 432000
--   }
-- }

-- EmailReceived event
-- {
--   "event_type": "EmailReceived",
--   "data": {
--     "message_id": "<abc123@mail.gmail.com>",
--     "thread_id": "thread-xyz",
--     "from_address": "jane@acme.com",
--     "from_name": "Jane Smith",
--     "to": [{"email": "rep@ourcompany.com", "name": "Sales Rep"}],
--     "subject": "Re: Proposal Review",
--     "body_text": "...",
--     "has_attachments": true,
--     "provider": "gmail",
--     "resolved_contact_id": "uuid"
--   }
-- }

-- ContactEnriched event (GDPR provenance)
-- {
--   "event_type": "ContactEnriched",
--   "data": {
--     "field": "job_title",
--     "old_value": null,
--     "new_value": "VP Engineering",
--     "source_name": "LinkedIn Public Profile",
--     "source_url": "https://linkedin.com/in/janesmith",
--     "source_type": "public_registry",
--     "gdpr_basis": "legitimate_interest",
--     "confidence": 0.95
--   }
-- }

-- DealScoreComputed event
-- {
--   "event_type": "DealScoreComputed",
--   "data": {
--     "model_id": "uuid",
--     "model_version": 3,
--     "score": 78.5,
--     "label": "healthy",
--     "features": {
--       "email_response_rate": 0.85,
--       "avg_response_time_hours": 2.3,
--       "meetings_30d": 4,
--       "stage_velocity_vs_avg": 1.2
--     }
--   }
-- }

-- MeetingSummarized event
-- {
--   "event_type": "MeetingSummarized",
--   "data": {
--     "meeting_id": "uuid",
--     "summary": "Discussed pricing for Enterprise tier...",
--     "key_points": ["Budget approved for Q3", "Need security review"],
--     "action_items": ["Send SOC 2 report", "Schedule technical deep-dive"],
--     "sentiment": "positive",
--     "model_id": "claude-opus-4-20250514",
--     "confidence": 0.92
--   }
-- }
```

---

## Snapshots (Performance Optimization)

```sql
-- ============================================================
-- SNAPSHOTS — periodic state snapshots to avoid full replay
-- ============================================================

CREATE TABLE snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type  VARCHAR(50) NOT NULL,
    aggregate_id    UUID NOT NULL,
    sequence_number BIGINT NOT NULL,        -- snapshot taken at this event sequence
    state           JSONB NOT NULL,         -- full aggregate state at this point
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (aggregate_id, sequence_number)
);

CREATE INDEX idx_snapshots_aggregate ON snapshots(aggregate_id, sequence_number DESC);

-- To reconstruct current state:
-- 1. Load latest snapshot for aggregate_id
-- 2. Replay events with sequence_number > snapshot.sequence_number
-- 3. Apply each event to the state
-- This bounds replay time to events since the last snapshot (typically < 100 events)
```

---

## Read Model Projections (Query Side)

```sql
-- ============================================================
-- PROJECTION: CONTACTS (materialized from events)
-- ============================================================

CREATE TABLE proj_contacts (
    id              UUID PRIMARY KEY,       -- same as aggregate_id
    workspace_id    UUID NOT NULL,
    company_id      UUID,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    full_name       VARCHAR(500) NOT NULL,
    email           VARCHAR(320),
    phone           VARCHAR(50),
    mobile_phone    VARCHAR(50),
    job_title       VARCHAR(255),
    department      VARCHAR(255),
    city            VARCHAR(255),
    state_province  VARCHAR(255),
    country_code    CHAR(2),
    linkedin_url    TEXT,
    timezone        VARCHAR(50),
    owner_id        UUID,
    source          VARCHAR(100),
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',
    -- Denormalized AI scores (updated by score projection)
    lead_score      NUMERIC(7,4),
    lead_score_label VARCHAR(20),
    lead_score_at   TIMESTAMPTZ,
    -- Denormalized activity stats
    last_activity_at    TIMESTAMPTZ,
    emails_sent_count   INTEGER DEFAULT 0,
    emails_received_count INTEGER DEFAULT 0,
    meetings_count      INTEGER DEFAULT 0,
    -- Projection bookkeeping
    last_event_sequence BIGINT NOT NULL,
    projected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_proj_contacts_workspace ON proj_contacts(workspace_id);
CREATE INDEX idx_proj_contacts_email ON proj_contacts(workspace_id, email);
CREATE INDEX idx_proj_contacts_company ON proj_contacts(company_id);
CREATE INDEX idx_proj_contacts_lifecycle ON proj_contacts(workspace_id, lifecycle_stage);
CREATE INDEX idx_proj_contacts_score ON proj_contacts(workspace_id, lead_score DESC NULLS LAST);

-- ============================================================
-- PROJECTION: COMPANIES
-- ============================================================

CREATE TABLE proj_companies (
    id              UUID PRIMARY KEY,
    workspace_id    UUID NOT NULL,
    name            VARCHAR(500) NOT NULL,
    domain          VARCHAR(255),
    industry        VARCHAR(255),
    employee_count  INTEGER,
    annual_revenue  BIGINT,
    revenue_currency VARCHAR(3),
    country_code    CHAR(2),
    owner_id        UUID,
    contact_count   INTEGER DEFAULT 0,      -- denormalized count
    open_deal_count INTEGER DEFAULT 0,
    total_deal_value BIGINT DEFAULT 0,
    last_event_sequence BIGINT NOT NULL,
    projected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_proj_companies_workspace ON proj_companies(workspace_id);
CREATE INDEX idx_proj_companies_domain ON proj_companies(workspace_id, domain);

-- ============================================================
-- PROJECTION: DEALS
-- ============================================================

CREATE TABLE proj_deals (
    id              UUID PRIMARY KEY,
    workspace_id    UUID NOT NULL,
    pipeline_id     UUID NOT NULL,
    stage_id        UUID NOT NULL,
    stage_name      VARCHAR(255),           -- denormalized for display
    company_id      UUID,
    company_name    VARCHAR(500),           -- denormalized for display
    name            VARCHAR(500) NOT NULL,
    amount          BIGINT,
    currency        VARCHAR(3),
    expected_close_date DATE,
    actual_close_date   DATE,
    owner_id        UUID,
    owner_name      VARCHAR(255),           -- denormalized
    priority        VARCHAR(20),
    -- Denormalized AI scores
    health_score    NUMERIC(7,4),
    health_label    VARCHAR(20),
    health_score_at TIMESTAMPTZ,
    -- Denormalized velocity metrics
    days_in_current_stage INTEGER DEFAULT 0,
    stage_entered_at    TIMESTAMPTZ,
    total_days_open     INTEGER DEFAULT 0,
    -- Denormalized activity stats
    last_activity_at    TIMESTAMPTZ,
    contact_count       INTEGER DEFAULT 0,
    email_count         INTEGER DEFAULT 0,
    meeting_count       INTEGER DEFAULT 0,
    last_event_sequence BIGINT NOT NULL,
    projected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_proj_deals_workspace ON proj_deals(workspace_id);
CREATE INDEX idx_proj_deals_pipeline ON proj_deals(pipeline_id, stage_id);
CREATE INDEX idx_proj_deals_company ON proj_deals(company_id);
CREATE INDEX idx_proj_deals_owner ON proj_deals(owner_id);
CREATE INDEX idx_proj_deals_close ON proj_deals(workspace_id, expected_close_date);
CREATE INDEX idx_proj_deals_health ON proj_deals(workspace_id, health_score DESC NULLS LAST);

-- ============================================================
-- PROJECTION: ACTIVITY TIMELINE
-- ============================================================

CREATE TABLE proj_activity_timeline (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    event_id        UUID NOT NULL,          -- reference to source event
    event_type      VARCHAR(100) NOT NULL,
    activity_type   VARCHAR(50) NOT NULL,   -- email, meeting, call, note, stage_change, score_update
    -- Polymorphic entity references
    contact_id      UUID,
    company_id      UUID,
    deal_id         UUID,
    -- Display fields (denormalized for fast rendering)
    title           VARCHAR(1000),
    summary         TEXT,
    actor_name      VARCHAR(255),
    actor_id        UUID,
    occurred_at     TIMESTAMPTZ NOT NULL,
    detail          JSONB                   -- activity-type-specific display data
);

CREATE INDEX idx_proj_timeline_contact ON proj_activity_timeline(contact_id, occurred_at DESC);
CREATE INDEX idx_proj_timeline_deal ON proj_activity_timeline(deal_id, occurred_at DESC);
CREATE INDEX idx_proj_timeline_company ON proj_activity_timeline(company_id, occurred_at DESC);
CREATE INDEX idx_proj_timeline_workspace ON proj_activity_timeline(workspace_id, occurred_at DESC);

-- ============================================================
-- PROJECTION: EMAIL THREADS
-- ============================================================

CREATE TABLE proj_email_threads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    thread_id       VARCHAR(500) NOT NULL,
    subject         VARCHAR(1000),
    last_message_at TIMESTAMPTZ NOT NULL,
    message_count   INTEGER NOT NULL DEFAULT 1,
    participant_emails TEXT[],
    -- Resolved entity references
    contact_ids     UUID[],
    deal_id         UUID,
    -- Tracking
    has_unread      BOOLEAN DEFAULT false,
    is_tracked      BOOLEAN DEFAULT false,
    last_opened_at  TIMESTAMPTZ,
    open_count      INTEGER DEFAULT 0,
    last_event_sequence BIGINT NOT NULL,
    projected_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proj_email_threads_workspace ON proj_email_threads(workspace_id, last_message_at DESC);
CREATE INDEX idx_proj_email_threads_thread ON proj_email_threads(workspace_id, thread_id);

-- ============================================================
-- PROJECTION: PIPELINE BOARD (optimized for Kanban view)
-- ============================================================

CREATE TABLE proj_pipeline_board (
    workspace_id    UUID NOT NULL,
    pipeline_id     UUID NOT NULL,
    stage_id        UUID NOT NULL,
    stage_name      VARCHAR(255) NOT NULL,
    stage_order     INTEGER NOT NULL,
    stage_type      VARCHAR(20) NOT NULL,
    deal_count      INTEGER NOT NULL DEFAULT 0,
    total_value     BIGINT NOT NULL DEFAULT 0,
    weighted_value  BIGINT NOT NULL DEFAULT 0,  -- value * stage probability
    currency        VARCHAR(3) DEFAULT 'USD',
    projected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, pipeline_id, stage_id)
);

-- ============================================================
-- PROJECTION: ENRICHMENT AUDIT TRAIL
-- ============================================================

CREATE TABLE proj_enrichment_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL,
    event_id        UUID NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,   -- contact, company
    entity_id       UUID NOT NULL,
    field_name      VARCHAR(100) NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    source_name     VARCHAR(255) NOT NULL,
    source_url      TEXT,
    gdpr_basis      VARCHAR(50),
    confidence      NUMERIC(5,4),
    enriched_at     TIMESTAMPTZ NOT NULL,
    accepted_by     UUID,
    accepted_at     TIMESTAMPTZ
);

CREATE INDEX idx_proj_enrichment_entity ON proj_enrichment_log(entity_type, entity_id, enriched_at DESC);
CREATE INDEX idx_proj_enrichment_workspace ON proj_enrichment_log(workspace_id, enriched_at DESC);
```

---

## Command-Side Infrastructure

```sql
-- ============================================================
-- WORKSPACE & USER CONFIG (command-side, not event-sourced)
-- ============================================================
-- These are configuration entities that don't benefit from event sourcing.
-- They are plain CRUD tables that the command side reads for validation.

CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    plan            VARCHAR(50) NOT NULL DEFAULT 'free',
    settings        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id),
    email           VARCHAR(320) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, email)
);

CREATE TABLE pipelines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id),
    name            VARCHAR(255) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id),
    name            VARCHAR(255) NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0,
    probability     NUMERIC(5,2) DEFAULT 0,
    stage_type      VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE oauth_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    provider        VARCHAR(50) NOT NULL,
    access_token    TEXT NOT NULL,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes          TEXT[],
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_sync_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id, provider)
);

CREATE TABLE scoring_models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id),
    name            VARCHAR(255) NOT NULL,
    model_type      VARCHAR(50) NOT NULL,
    algorithm       VARCHAR(100),
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    training_metadata JSONB,
    trained_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROJECTION TRACKING — tracks which events each projector has processed
-- ============================================================

CREATE TABLE projection_checkpoints (
    projection_name VARCHAR(100) PRIMARY KEY,
    last_event_id   UUID NOT NULL,
    last_event_at   TIMESTAMPTZ NOT NULL,
    events_processed BIGINT NOT NULL DEFAULT 0,
    last_error      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- OUTBOX — for reliable event publishing to external consumers
-- ============================================================

CREATE TABLE event_outbox (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL,
    destination     VARCHAR(100) NOT NULL,  -- webhook, mcp, scoring_pipeline
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, sent, failed
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    last_error      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_outbox_status ON event_outbox(status, created_at);
```

---

## Example Queries

### Temporal Query: Contact State at a Point in Time

```sql
-- "What did we know about this contact on March 15, 2026?"
SELECT data
FROM events
WHERE aggregate_type = 'contact'
  AND aggregate_id = '550e8400-e29b-41d4-a716-446655440000'
  AND occurred_at <= '2026-03-15T23:59:59Z'
ORDER BY sequence_number ASC;

-- Application code replays these events to reconstruct the contact's state
-- at that exact point in time.
```

### ML Feature Extraction: Communication Signals for Deal Scoring

```sql
-- Extract engagement features for deal scoring model training
SELECT
    e.aggregate_id AS deal_id,
    COUNT(*) FILTER (WHERE e.event_type = 'EmailSent') AS emails_sent,
    COUNT(*) FILTER (WHERE e.event_type = 'EmailReceived') AS emails_received,
    COUNT(*) FILTER (WHERE e.event_type = 'MeetingCompleted') AS meetings_held,
    COUNT(*) FILTER (WHERE e.event_type = 'DealStageChanged') AS stage_changes,
    AVG(EXTRACT(EPOCH FROM
        LEAD(e.occurred_at) OVER (PARTITION BY e.aggregate_id ORDER BY e.occurred_at)
        - e.occurred_at
    )) FILTER (WHERE e.event_type = 'EmailSent') AS avg_response_gap_seconds,
    MAX(e.occurred_at) AS last_activity_at
FROM events e
WHERE e.aggregate_type = 'deal'
  AND e.workspace_id = 'workspace-uuid'
  AND e.occurred_at >= now() - INTERVAL '30 days'
GROUP BY e.aggregate_id;
```

### Rebuild a Projection from Scratch

```sql
-- If proj_contacts gets corrupted or schema changes, rebuild it:
TRUNCATE proj_contacts;

-- The projection rebuilder reads ALL contact events and replays them:
-- SELECT * FROM events
-- WHERE aggregate_type = 'contact'
-- ORDER BY aggregate_id, sequence_number ASC;
--
-- For each event, the projector applies the state transition:
--   ContactCreated  -> INSERT INTO proj_contacts
--   ContactUpdated  -> UPDATE proj_contacts SET ...
--   ContactEnriched -> UPDATE proj_contacts SET ...
--   ContactDeleted  -> DELETE FROM proj_contacts

UPDATE projection_checkpoints
SET last_event_id = (SELECT id FROM events ORDER BY occurred_at DESC LIMIT 1),
    events_processed = (SELECT COUNT(*) FROM events WHERE aggregate_type = 'contact'),
    updated_at = now()
WHERE projection_name = 'contacts';
```

---

## Table Count Summary

| Category | Tables | Notes |
|----------|--------|-------|
| Event Store | 2 | events (partitioned), event_type_registry |
| Snapshots | 1 | snapshots |
| Config (CRUD) | 6 | workspaces, users, pipelines, pipeline_stages, oauth_connections, scoring_models |
| Projection: Core Entities | 3 | proj_contacts, proj_companies, proj_deals |
| Projection: Activities | 2 | proj_activity_timeline, proj_email_threads |
| Projection: Pipeline | 1 | proj_pipeline_board |
| Projection: Enrichment | 1 | proj_enrichment_log |
| Infrastructure | 2 | projection_checkpoints, event_outbox |
| **Total** | **18** | Plus monthly event partitions |

---

## Key Design Decisions

1. **Single `events` table as the sole source of truth** — All CRM state changes flow through one append-only table. This eliminates the need for separate audit tables, change-data-capture pipelines, or trigger-based logging. The event store IS the audit trail.

2. **Monthly table partitioning** — PostgreSQL declarative partitioning on `occurred_at` keeps individual partition sizes manageable, enables efficient time-range queries, and allows archival of old partitions to cheaper storage. Partition pruning ensures queries that filter by time only scan relevant partitions.

3. **JSONB event payloads with registered schemas** — Event data is stored as JSONB for flexibility (new event types require no schema migration), while `event_type_registry` documents the expected structure. JSON Schema validation can be enforced at the application layer or via PostgreSQL CHECK constraints.

4. **Snapshots for replay performance** — Without snapshots, reconstructing a contact with 10,000 events would require replaying all of them. Periodic snapshots (e.g., every 100 events) bound replay time. The application loads the latest snapshot and replays only subsequent events.

5. **Separate command-side config tables** — Workspaces, users, pipelines, and OAuth connections are simple configuration entities that don't benefit from event sourcing. They're plain CRUD tables that the command side reads for validation before writing events.

6. **Denormalized projections with activity stats** — Projections like `proj_contacts` include denormalized fields (lead_score, emails_sent_count, last_activity_at) that would require JOINs in a normalized model. This enables fast single-table reads for list views and API responses.

7. **Correlation and causation IDs in event metadata** — Every event carries `correlation_id` (traces a user action across aggregates) and `causation_id` (the event that triggered this one). This enables full causal chain tracing -- critical for debugging AI-triggered actions ("why did the system send this follow-up?").

8. **Outbox pattern for reliable external delivery** — Events destined for webhooks, MCP consumers, or ML scoring pipelines are written to `event_outbox` in the same transaction as the event itself. A separate worker polls the outbox and delivers events, retrying on failure. This guarantees at-least-once delivery without distributed transactions.

9. **AI/ML as first-class event consumers** — The event stream is the natural input for ML feature engineering. Deal scoring models consume EmailSent/EmailReceived/MeetingCompleted events directly. Meeting summarization consumes MeetingCompleted events. No separate ETL pipeline is needed -- the event store IS the feature source.

10. **Projection rebuild capability** — Any projection can be rebuilt from scratch by replaying the event stream. This means projections can evolve independently of the event schema -- you can add new denormalized fields, change indexing strategies, or create entirely new projections without data migration.
