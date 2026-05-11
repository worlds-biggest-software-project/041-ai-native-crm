# Data Model Suggestion 1: Entity-Centric Normalized Relational

> Project: AI-Native CRM · Created: 2026-05-11

## Philosophy

This model follows the classical normalized relational approach used by Salesforce, Microsoft Dynamics 365 (Dataverse), and the Microsoft Common Data Model (CDM). Every domain concept gets its own table with strongly typed columns, explicit foreign keys, and junction tables for many-to-many relationships. The schema is designed for data integrity first: every relationship is enforced at the database level, every field has a defined type and constraint, and the schema itself serves as living documentation of the domain.

The CDM defines over 400 standard entities for CRM concepts (Account, Contact, Lead, Opportunity, Activity, etc.) with well-defined attributes. This model draws on that heritage while streamlining it for an AI-native context -- adding first-class tables for email sync, meeting summaries, ML scoring, enrichment provenance, and MCP tool registrations that traditional CRM schemas lack.

This is the most familiar pattern for teams with relational database expertise. It produces the most predictable query performance, the strongest referential integrity, and the clearest audit surface. The trade-off is rigidity: adding a new entity type or custom field requires a schema migration.

**Best for:** Teams that value data integrity, have stable domain requirements, and prefer explicit schema over flexibility.

**Trade-offs:**
- (+) Strongest referential integrity; database enforces all relationships
- (+) Predictable query performance with well-understood indexing strategies
- (+) Schema serves as self-documenting domain model
- (+) Best tooling support (ORMs, migration tools, schema visualization)
- (-) Adding custom fields or new entity types requires schema migrations
- (-) Highest table count; more complex JOIN queries for cross-entity views
- (-) Less flexible for multi-jurisdiction or multi-vertical variations
- (-) Schema changes in production require careful migration planning

---

## Standards Alignment

| Standard | How It's Used |
|----------|---------------|
| Microsoft CDM | Entity names and core attributes (Account, Contact, Lead, Opportunity) align with CDM schema definitions |
| RFC 6350 (vCard 4.0) | Contact fields (FN, N, EMAIL, TEL, ADR, ORG) map to dedicated columns in `contacts` table |
| RFC 5545 (iCalendar) | Meeting/event fields (DTSTART, DTEND, SUMMARY, ATTENDEE) map to `meetings` table columns |
| ISO 8601 | All timestamps stored as TIMESTAMPTZ in ISO 8601 format |
| OAuth 2.0 / OIDC | `oauth_connections` table stores token grants per provider per user |
| GDPR Art. 6/14/25 | `enrichment_sources` table tracks provenance; `consent_records` table documents lawful basis |
| SCIM 2.0 (RFC 7644) | `users` and `teams` tables support SCIM provisioning attributes |
| OpenAPI 3.1 | Schema designed to map 1:1 to OpenAPI resource definitions |
| MCP (2025-11-25) | `mcp_tools` table registers MCP tool definitions for AI agent integration |

---

## Core Identity & Tenancy

```sql
-- ============================================================
-- TENANCY & USERS
-- ============================================================

CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    plan            VARCHAR(50) NOT NULL DEFAULT 'free',  -- free, starter, professional, enterprise
    settings        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email           VARCHAR(320) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer
    scim_external_id VARCHAR(255),  -- SCIM 2.0 provisioning ID
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, email)
);

CREATE INDEX idx_users_workspace ON users(workspace_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',  -- lead, member
    PRIMARY KEY (team_id, user_id)
);
```

---

## CRM Core Entities

```sql
-- ============================================================
-- CONTACTS & COMPANIES
-- ============================================================

CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(500) NOT NULL,
    domain          VARCHAR(255),          -- primary website domain
    industry        VARCHAR(255),          -- aligned with CDM industry codes
    employee_count  INTEGER,
    annual_revenue  BIGINT,                -- in cents (minor currency unit)
    revenue_currency VARCHAR(3) DEFAULT 'USD',  -- ISO 4217
    phone           VARCHAR(50),
    address_line1   VARCHAR(500),
    address_line2   VARCHAR(500),
    city            VARCHAR(255),
    state_province  VARCHAR(255),
    postal_code     VARCHAR(20),
    country_code    CHAR(2),               -- ISO 3166-1 alpha-2
    description     TEXT,
    website         TEXT,
    linkedin_url    TEXT,
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    source          VARCHAR(100),          -- how this company entered the CRM
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_domain ON companies(workspace_id, domain);
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_name ON companies(workspace_id, name);

CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    -- vCard 4.0 aligned fields (RFC 6350)
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    full_name       VARCHAR(500) NOT NULL,  -- vCard FN property
    email           VARCHAR(320),           -- primary email
    phone           VARCHAR(50),            -- primary phone (vCard TEL)
    mobile_phone    VARCHAR(50),
    job_title       VARCHAR(255),           -- vCard TITLE
    department      VARCHAR(255),
    address_line1   VARCHAR(500),
    address_line2   VARCHAR(500),
    city            VARCHAR(255),
    state_province  VARCHAR(255),
    postal_code     VARCHAR(20),
    country_code    CHAR(2),               -- ISO 3166-1 alpha-2
    linkedin_url    TEXT,
    twitter_handle  VARCHAR(100),
    avatar_url      TEXT,                   -- vCard PHOTO
    timezone        VARCHAR(50),            -- IANA timezone (e.g., America/New_York)
    preferred_language VARCHAR(10),         -- BCP 47 language tag
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    source          VARCHAR(100),
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',  -- lead, mql, sql, opportunity, customer, churned
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(workspace_id, email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(workspace_id, lifecycle_stage);
CREATE INDEX idx_contacts_name ON contacts(workspace_id, last_name, first_name);

-- Secondary email addresses for contacts
CREATE TABLE contact_emails (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    email           VARCHAR(320) NOT NULL,
    label           VARCHAR(50),            -- work, personal, other
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_emails_contact ON contact_emails(contact_id);
CREATE INDEX idx_contact_emails_email ON contact_emails(email);
```

---

## Pipeline & Deals

```sql
-- ============================================================
-- PIPELINES & DEALS
-- ============================================================

CREATE TABLE pipelines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0,
    probability     NUMERIC(5,2) DEFAULT 0,   -- win probability percentage (0-100)
    stage_type      VARCHAR(20) NOT NULL DEFAULT 'open',  -- open, won, lost
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);

CREATE TABLE deals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
    stage_id        UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    name            VARCHAR(500) NOT NULL,
    amount          BIGINT,                 -- in cents (minor currency unit)
    currency        VARCHAR(3) DEFAULT 'USD',  -- ISO 4217
    expected_close_date DATE,
    actual_close_date   DATE,
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    source          VARCHAR(100),
    loss_reason     TEXT,
    priority        VARCHAR(20) DEFAULT 'medium',  -- low, medium, high, critical
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_workspace ON deals(workspace_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_close_date ON deals(workspace_id, expected_close_date);

-- Many-to-many: deals <-> contacts
CREATE TABLE deal_contacts (
    deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    role            VARCHAR(100),           -- decision_maker, champion, influencer, blocker, user
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (deal_id, contact_id)
);

-- Deal stage history for tracking progression
CREATE TABLE deal_stage_changes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    from_stage_id   UUID REFERENCES pipeline_stages(id),
    to_stage_id     UUID NOT NULL REFERENCES pipeline_stages(id),
    changed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_seconds BIGINT                 -- time spent in the previous stage
);

CREATE INDEX idx_deal_stage_changes_deal ON deal_stage_changes(deal_id);
CREATE INDEX idx_deal_stage_changes_date ON deal_stage_changes(changed_at);
```

---

## Activities, Email & Calendar

```sql
-- ============================================================
-- ACTIVITIES (unified activity timeline)
-- ============================================================

CREATE TABLE activities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_type   VARCHAR(50) NOT NULL,   -- email, meeting, call, note, task
    subject         VARCHAR(1000),
    body            TEXT,
    body_html       TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_minutes INTEGER,
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Polymorphic association to parent entity
    related_deal_id    UUID REFERENCES deals(id) ON DELETE SET NULL,
    related_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    related_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_workspace ON activities(workspace_id);
CREATE INDEX idx_activities_type ON activities(workspace_id, activity_type);
CREATE INDEX idx_activities_deal ON activities(related_deal_id);
CREATE INDEX idx_activities_contact ON activities(related_contact_id);
CREATE INDEX idx_activities_occurred ON activities(workspace_id, occurred_at DESC);

-- ============================================================
-- EMAIL SYNC
-- ============================================================

CREATE TABLE email_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id) ON DELETE SET NULL,
    message_id      VARCHAR(500) NOT NULL,  -- RFC 5322 Message-ID header
    thread_id       VARCHAR(500),           -- provider thread ID (Gmail/Outlook)
    in_reply_to     VARCHAR(500),           -- RFC 5322 In-Reply-To header
    subject         VARCHAR(1000),
    body_text       TEXT,
    body_html       TEXT,
    from_address    VARCHAR(320) NOT NULL,
    from_name       VARCHAR(255),
    sent_at         TIMESTAMPTZ NOT NULL,
    received_at     TIMESTAMPTZ,
    direction       VARCHAR(10) NOT NULL,   -- inbound, outbound
    provider        VARCHAR(20) NOT NULL,   -- gmail, outlook, imap
    provider_message_id VARCHAR(500),       -- provider-specific message ID
    has_attachments BOOLEAN DEFAULT false,
    is_tracked      BOOLEAN DEFAULT false,  -- whether open/click tracking is enabled
    opened_at       TIMESTAMPTZ,
    opened_count    INTEGER DEFAULT 0,
    clicked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_messages_workspace ON email_messages(workspace_id);
CREATE INDEX idx_email_messages_thread ON email_messages(workspace_id, thread_id);
CREATE INDEX idx_email_messages_message_id ON email_messages(message_id);
CREATE INDEX idx_email_messages_from ON email_messages(from_address);
CREATE INDEX idx_email_messages_sent ON email_messages(workspace_id, sent_at DESC);

-- Email recipients (to, cc, bcc)
CREATE TABLE email_recipients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    recipient_type  VARCHAR(3) NOT NULL,    -- to, cc, bcc
    email           VARCHAR(320) NOT NULL,
    name            VARCHAR(255),
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL  -- resolved contact
);

CREATE INDEX idx_email_recipients_message ON email_recipients(email_message_id);
CREATE INDEX idx_email_recipients_email ON email_recipients(email);

-- Email attachments
CREATE TABLE email_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    filename        VARCHAR(500) NOT NULL,
    content_type    VARCHAR(255),
    size_bytes      BIGINT,
    storage_key     VARCHAR(500),           -- object storage reference
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MEETINGS (iCalendar / RFC 5545 aligned)
-- ============================================================

CREATE TABLE meetings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id) ON DELETE SET NULL,
    title           VARCHAR(1000) NOT NULL,  -- iCal SUMMARY
    description     TEXT,                    -- iCal DESCRIPTION
    location        VARCHAR(500),            -- iCal LOCATION
    start_at        TIMESTAMPTZ NOT NULL,    -- iCal DTSTART
    end_at          TIMESTAMPTZ NOT NULL,    -- iCal DTEND
    timezone        VARCHAR(50),             -- IANA timezone
    is_all_day      BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(500),            -- iCal RRULE
    provider        VARCHAR(20),             -- google_calendar, outlook, caldav
    provider_event_id VARCHAR(500),
    conference_url  TEXT,                     -- Zoom/Meet/Teams link
    organizer_email VARCHAR(320),
    status          VARCHAR(20) DEFAULT 'confirmed',  -- confirmed, tentative, cancelled
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_workspace ON meetings(workspace_id);
CREATE INDEX idx_meetings_start ON meetings(workspace_id, start_at);
CREATE INDEX idx_meetings_provider ON meetings(provider, provider_event_id);

-- Meeting attendees
CREATE TABLE meeting_attendees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    email           VARCHAR(320) NOT NULL,
    name            VARCHAR(255),
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    response_status VARCHAR(20) DEFAULT 'needs_action',  -- accepted, declined, tentative, needs_action
    is_organizer    BOOLEAN DEFAULT false
);

CREATE INDEX idx_meeting_attendees_meeting ON meeting_attendees(meeting_id);
CREATE INDEX idx_meeting_attendees_contact ON meeting_attendees(contact_id);

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id) ON DELETE SET NULL,
    title           VARCHAR(1000) NOT NULL,
    description     TEXT,
    due_at          TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    priority        VARCHAR(20) DEFAULT 'medium',
    status          VARCHAR(20) DEFAULT 'todo',  -- todo, in_progress, done, cancelled
    assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    related_deal_id    UUID REFERENCES deals(id) ON DELETE SET NULL,
    related_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due ON tasks(workspace_id, due_at);
CREATE INDEX idx_tasks_status ON tasks(workspace_id, status);
```

---

## AI & ML Features

```sql
-- ============================================================
-- AI: MEETING SUMMARIES & FOLLOW-UPS
-- ============================================================

CREATE TABLE meeting_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    summary_text    TEXT NOT NULL,
    key_points      TEXT[],                 -- array of extracted key points
    action_items    TEXT[],                 -- array of extracted action items
    sentiment       VARCHAR(20),            -- positive, neutral, negative, mixed
    model_id        VARCHAR(100) NOT NULL,  -- LLM model used (e.g., claude-opus-4-20250514)
    model_version   VARCHAR(50),
    confidence      NUMERIC(5,4),           -- 0.0000 to 1.0000
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX idx_meeting_summaries_meeting ON meeting_summaries(meeting_id);

CREATE TABLE follow_up_drafts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID REFERENCES meetings(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    subject         VARCHAR(1000),
    body_text       TEXT NOT NULL,
    body_html       TEXT,
    status          VARCHAR(20) DEFAULT 'draft',  -- draft, sent, discarded
    model_id        VARCHAR(100) NOT NULL,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at         TIMESTAMPTZ,
    sent_by         UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_follow_up_drafts_meeting ON follow_up_drafts(meeting_id);
CREATE INDEX idx_follow_up_drafts_deal ON follow_up_drafts(deal_id);

-- ============================================================
-- AI: LEAD & DEAL SCORING
-- ============================================================

CREATE TABLE scoring_models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    model_type      VARCHAR(50) NOT NULL,   -- lead_score, deal_health, churn_risk
    algorithm       VARCHAR(100),           -- gradient_boost, logistic_regression, neural_net
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    training_metadata JSONB,               -- feature importance, training metrics, etc.
    trained_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    scoring_model_id UUID NOT NULL REFERENCES scoring_models(id) ON DELETE CASCADE,
    score           NUMERIC(7,4) NOT NULL,  -- 0.0000 to 100.0000
    score_label     VARCHAR(20),            -- hot, warm, cold
    feature_values  JSONB,                  -- input features used for this score
    -- Example feature_values:
    -- {
    --   "email_response_rate": 0.85,
    --   "avg_response_time_hours": 2.3,
    --   "meeting_acceptance_rate": 0.90,
    --   "emails_sent_30d": 12,
    --   "emails_received_30d": 8,
    --   "meetings_30d": 3,
    --   "last_activity_days_ago": 2
    -- }
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_scores_contact ON contact_scores(contact_id);
CREATE INDEX idx_contact_scores_model ON contact_scores(scoring_model_id);
CREATE INDEX idx_contact_scores_score ON contact_scores(score DESC);

CREATE TABLE deal_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    scoring_model_id UUID NOT NULL REFERENCES scoring_models(id) ON DELETE CASCADE,
    score           NUMERIC(7,4) NOT NULL,
    score_label     VARCHAR(20),            -- healthy, at_risk, critical
    feature_values  JSONB,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_scores_deal ON deal_scores(deal_id);
CREATE INDEX idx_deal_scores_score ON deal_scores(score DESC);

-- ============================================================
-- AI: ENRICHMENT (GDPR-safe provenance tracking)
-- ============================================================

CREATE TABLE enrichment_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,  -- e.g., "OpenCorporates", "Companies House", "LinkedIn Public"
    source_type     VARCHAR(50) NOT NULL,   -- public_registry, api, manual, web_scrape
    base_url        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    gdpr_basis      VARCHAR(50),            -- legitimate_interest, consent, public_task
    lia_document_url TEXT,                  -- Legitimate Interest Assessment document
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enrichment_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID NOT NULL REFERENCES enrichment_sources(id) ON DELETE CASCADE,
    contact_id      UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
    field_name      VARCHAR(100) NOT NULL,  -- which field was enriched
    old_value       TEXT,
    new_value       TEXT,
    confidence      NUMERIC(5,4),
    source_url      TEXT,                   -- direct URL to source data (Art. 14 transparency)
    enriched_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at     TIMESTAMPTZ,
    CONSTRAINT chk_enrichment_target CHECK (
        (contact_id IS NOT NULL AND company_id IS NULL) OR
        (contact_id IS NULL AND company_id IS NOT NULL)
    )
);

CREATE INDEX idx_enrichment_records_contact ON enrichment_records(contact_id);
CREATE INDEX idx_enrichment_records_company ON enrichment_records(company_id);
CREATE INDEX idx_enrichment_records_date ON enrichment_records(enriched_at DESC);
```

---

## Integration & OAuth

```sql
-- ============================================================
-- OAUTH CONNECTIONS & INTEGRATIONS
-- ============================================================

CREATE TABLE oauth_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,   -- google, microsoft, slack, zoom
    provider_user_id VARCHAR(500),
    access_token    TEXT NOT NULL,           -- encrypted at rest
    refresh_token   TEXT,                    -- encrypted at rest
    token_expires_at TIMESTAMPTZ,
    scopes          TEXT[],                 -- granted OAuth scopes
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_sync_at    TIMESTAMPTZ,
    sync_error      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id, provider)
);

CREATE INDEX idx_oauth_connections_workspace ON oauth_connections(workspace_id);
CREATE INDEX idx_oauth_connections_user ON oauth_connections(user_id);

-- ============================================================
-- WEBHOOKS
-- ============================================================

CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    events          TEXT[] NOT NULL,         -- contact.created, deal.stage_changed, etc.
    secret          VARCHAR(255) NOT NULL,   -- HMAC signing secret
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    failure_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MCP TOOL REGISTRY
-- ============================================================

CREATE TABLE mcp_tools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    tool_name       VARCHAR(255) NOT NULL,   -- MCP tool name
    description     TEXT,
    input_schema    JSONB NOT NULL,          -- JSON Schema for tool parameters
    handler_type    VARCHAR(50) NOT NULL,    -- internal, webhook, workflow
    handler_config  JSONB NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, tool_name)
);
```

---

## GDPR Consent & Audit

```sql
-- ============================================================
-- GDPR CONSENT RECORDS
-- ============================================================

CREATE TABLE consent_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    consent_type    VARCHAR(50) NOT NULL,    -- email_marketing, data_processing, enrichment
    lawful_basis    VARCHAR(50) NOT NULL,    -- consent, legitimate_interest, contract, legal_obligation
    status          VARCHAR(20) NOT NULL,    -- granted, withdrawn, expired
    granted_at      TIMESTAMPTZ,
    withdrawn_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    source          VARCHAR(100),            -- form, api, import, manual
    ip_address      INET,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_records_contact ON consent_records(contact_id);
CREATE INDEX idx_consent_records_type ON consent_records(workspace_id, consent_type);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,   -- contact.created, deal.updated, etc.
    entity_type     VARCHAR(50) NOT NULL,    -- contact, company, deal, etc.
    entity_id       UUID NOT NULL,
    changes         JSONB,                   -- { "field": { "old": "x", "new": "y" } }
    ip_address      INET,
    user_agent      TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_workspace ON audit_log(workspace_id, occurred_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (applied to each table above)
CREATE POLICY workspace_isolation ON contacts
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
```

---

## Workflow Automation

```sql
-- ============================================================
-- WORKFLOWS
-- ============================================================

CREATE TABLE workflows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    trigger_type    VARCHAR(50) NOT NULL,    -- record_created, record_updated, scheduled, manual
    trigger_config  JSONB NOT NULL,          -- e.g., { "entity": "deal", "field": "stage_id" }
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order      INTEGER NOT NULL,
    action_type     VARCHAR(50) NOT NULL,    -- send_email, update_field, create_task, webhook, wait, condition
    action_config   JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);

CREATE TABLE workflow_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_entity_type VARCHAR(50),
    trigger_entity_id   UUID,
    status          VARCHAR(20) NOT NULL DEFAULT 'running',  -- running, completed, failed, cancelled
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    step_results    JSONB                   -- results from each step execution
);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
```

---

## Notes & Tags

```sql
-- ============================================================
-- NOTES
-- ============================================================

CREATE TABLE notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    body_html       TEXT,
    -- Polymorphic association
    related_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    related_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    related_deal_id    UUID REFERENCES deals(id) ON DELETE CASCADE,
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_contact ON notes(related_contact_id);
CREATE INDEX idx_notes_company ON notes(related_company_id);
CREATE INDEX idx_notes_deal ON notes(related_deal_id);

-- ============================================================
-- TAGS
-- ============================================================

CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    color           VARCHAR(7),             -- hex color code
    UNIQUE (workspace_id, name)
);

CREATE TABLE entity_tags (
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL,   -- contact, company, deal
    entity_id       UUID NOT NULL,
    PRIMARY KEY (tag_id, entity_type, entity_id)
);

CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
```

---

## Table Count Summary

| Category | Tables | Notes |
|----------|--------|-------|
| Tenancy & Users | 4 | workspaces, users, teams, team_members |
| CRM Core | 4 | companies, contacts, contact_emails, tags/entity_tags (counted below) |
| Pipeline & Deals | 5 | pipelines, pipeline_stages, deals, deal_contacts, deal_stage_changes |
| Activities | 1 | activities (unified timeline) |
| Email Sync | 3 | email_messages, email_recipients, email_attachments |
| Calendar / Meetings | 2 | meetings, meeting_attendees |
| Tasks | 1 | tasks |
| AI / ML | 6 | meeting_summaries, follow_up_drafts, scoring_models, contact_scores, deal_scores |
| Enrichment | 2 | enrichment_sources, enrichment_records |
| Integration | 3 | oauth_connections, webhooks, mcp_tools |
| GDPR & Audit | 2 | consent_records, audit_log |
| Workflows | 3 | workflows, workflow_steps, workflow_executions |
| Notes & Tags | 3 | notes, tags, entity_tags |
| **Total** | **39** | |

---

## Key Design Decisions

1. **UUID primary keys everywhere** — enables distributed ID generation, safe merging of data from multiple sources, and compatibility with GraphQL/REST APIs that expose IDs in URLs.

2. **Monetary values in cents (BIGINT)** — avoids floating-point precision issues; currency stored separately as ISO 4217 code. Matches Stripe and most payment processor conventions.

3. **vCard 4.0 field alignment** — Contact fields map directly to RFC 6350 properties (FN, N, EMAIL, TEL, ADR, TITLE), enabling clean vCard import/export without field mapping.

4. **iCalendar field alignment** — Meeting fields map to RFC 5545 properties (DTSTART, DTEND, SUMMARY, LOCATION, RRULE), enabling clean .ics import/export.

5. **Explicit deal stage history** — `deal_stage_changes` table provides a complete audit trail of pipeline progression with duration tracking, enabling velocity analytics without event sourcing complexity.

6. **Unified activity timeline** — Single `activities` table with `activity_type` discriminator provides a single query surface for the contact/deal timeline view, while specialized tables (email_messages, meetings, tasks) store type-specific detail.

7. **GDPR-first enrichment provenance** — Every enrichment record links to a source with documented lawful basis and source URL, satisfying Article 14 transparency requirements. Enrichment records track old/new values and require explicit user acceptance.

8. **Row-Level Security for multi-tenancy** — PostgreSQL RLS policies enforce workspace isolation at the database level, preventing data leaks even if application code has bugs.

9. **ML scoring as time-series** — Contact and deal scores are append-only with timestamps, preserving score history for model evaluation and "what was the score on date X?" queries.

10. **MCP tool registry** — First-class table for registering MCP tool definitions enables AI agents to discover and invoke CRM operations through the Model Context Protocol standard.
