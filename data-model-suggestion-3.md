# Data Model Suggestion 3: Hybrid Relational + JSONB

> Project: AI-Native CRM · Created: 2026-05-11

## Philosophy

This model follows the Attio-inspired approach of combining relational tables for structural integrity with JSONB columns for domain-specific flexibility. Core CRM entities (contacts, companies, deals) have well-defined relational columns for frequently queried, stable fields, while a `custom_fields` JSONB column on each entity allows tenants to define their own attributes without schema migrations.

The key insight from Attio's data model is that CRM schemas vary dramatically across industries and GTM motions. A SaaS company tracking ARR and contract renewal dates needs different fields than a real estate firm tracking property listings and commission rates. Rather than forcing all tenants into a single rigid schema (Salesforce's approach) or abandoning structure entirely (document databases), the hybrid model gives you both: relational columns where you need query performance and referential integrity, and JSONB where you need tenant-specific flexibility.

PostgreSQL's JSONB type is uniquely suited to this pattern. GIN indexes on JSONB columns enable fast containment queries (`@>`), key-existence checks (`?`), and path-based lookups (`->>`) without sacrificing the ability to JOIN on relational foreign keys. EF Core 10 and Prisma have both added first-class hybrid relational-JSONB support in 2025-2026, validating this as a mainstream architectural pattern.

**Best for:** Multi-tenant SaaS platforms that serve diverse industries, teams that need rapid MVP iteration with custom field support, and products where the schema will evolve significantly post-launch.

**Trade-offs:**
- (+) Fastest path to MVP: core schema is small; custom fields need no migration
- (+) Tenant-specific customization without per-tenant schema management
- (+) Lower table count than normalized model; simpler queries for most operations
- (+) GIN-indexed JSONB queries are fast for containment and key lookups
- (+) Custom field definitions stored as metadata; tenant admins can add fields via UI
- (-) JSONB fields lack referential integrity; application must enforce consistency
- (-) Complex JSONB queries are slower than equivalent relational column queries
- (-) Reporting on JSONB fields requires more complex SQL (path extraction operators)
- (-) Schema validation for JSONB fields must be enforced at the application layer
- (-) JSONB column updates rewrite the entire JSONB value (not individual keys)

---

## Standards Alignment

| Standard | How It's Used |
|----------|---------------|
| RFC 6350 (vCard 4.0) | Core contact columns align with vCard properties; custom vCard extensions go into `custom_fields` |
| RFC 5545 (iCalendar) | Core meeting columns align with iCalendar properties; custom meeting metadata in `custom_fields` |
| ISO 8601 | All TIMESTAMPTZ columns use ISO 8601; JSONB date fields stored as ISO 8601 strings |
| JSON Schema 2020-12 | `field_definitions` table stores JSON Schema for validating custom field values |
| ISO 4217 | Currency codes in relational columns; custom currency fields validated via JSON Schema |
| ISO 3166-1 | Country codes in relational columns |
| GDPR Art. 6/14/25 | `enrichment_log` tracks provenance; custom fields include GDPR classification metadata |
| OAuth 2.0 | OAuth connections stored relationally (security-critical data stays in typed columns) |
| MCP (2025-11-25) | Custom objects exposed as MCP resources with schema derived from field_definitions |
| OpenAPI 3.1 / JSON Schema | API schema generated dynamically from relational columns + field_definitions |

---

## Custom Field System (Meta-Schema)

```sql
-- ============================================================
-- CUSTOM FIELD DEFINITIONS — the meta-schema layer
-- ============================================================
-- This is the heart of the hybrid model: field definitions describe
-- what custom fields exist for each entity type in each workspace.

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
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email           VARCHAR(320) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, email)
);

CREATE INDEX idx_users_workspace ON users(workspace_id);

-- ============================================================
-- FIELD DEFINITIONS
-- ============================================================

CREATE TABLE field_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL,   -- contact, company, deal, custom_object
    field_key       VARCHAR(100) NOT NULL,  -- machine-readable key (e.g., "contract_renewal_date")
    display_name    VARCHAR(255) NOT NULL,  -- human-readable label (e.g., "Contract Renewal Date")
    field_type      VARCHAR(50) NOT NULL,   -- text, number, currency, date, datetime, email, phone,
                                            -- url, select, multi_select, checkbox, user_reference,
                                            -- entity_reference, rich_text
    description     TEXT,
    is_required     BOOLEAN NOT NULL DEFAULT false,
    is_unique       BOOLEAN NOT NULL DEFAULT false,
    default_value   JSONB,
    validation      JSONB,                  -- JSON Schema for value validation
    -- Example validation for a currency field:
    -- {
    --   "type": "object",
    --   "properties": {
    --     "amount": { "type": "integer", "minimum": 0 },
    --     "currency": { "type": "string", "pattern": "^[A-Z]{3}$" }
    --   },
    --   "required": ["amount", "currency"]
    -- }
    options         JSONB,                  -- for select/multi_select: [{"value": "hot", "label": "Hot", "color": "#ff0000"}]
    display_order   INTEGER NOT NULL DEFAULT 0,
    group_name      VARCHAR(100),           -- field group for UI organization (e.g., "Financial", "Social")
    is_system       BOOLEAN NOT NULL DEFAULT false,  -- system fields can't be deleted by tenants
    gdpr_category   VARCHAR(50),            -- personally_identifiable, sensitive, business, none
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, entity_type, field_key)
);

CREATE INDEX idx_field_definitions_workspace ON field_definitions(workspace_id, entity_type);

-- ============================================================
-- CUSTOM OBJECTS — user-defined entity types (Attio-style)
-- ============================================================

CREATE TABLE custom_object_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    object_key      VARCHAR(100) NOT NULL,  -- machine-readable key (e.g., "invoices")
    display_name    VARCHAR(255) NOT NULL,  -- human-readable name (e.g., "Invoices")
    display_name_plural VARCHAR(255),
    icon            VARCHAR(50),            -- icon identifier for UI
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, object_key)
);

-- Custom object records use the generic entity pattern below
```

---

## CRM Core Entities (Relational + JSONB Hybrid)

```sql
-- ============================================================
-- CONTACTS — relational core + JSONB custom fields
-- ============================================================

CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    company_id      UUID,                   -- FK added after companies table

    -- ========== RELATIONAL CORE (stable, frequently queried) ==========
    -- vCard 4.0 aligned (RFC 6350)
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    full_name       VARCHAR(500) NOT NULL,
    email           VARCHAR(320),
    phone           VARCHAR(50),
    job_title       VARCHAR(255),
    city            VARCHAR(255),
    country_code    CHAR(2),               -- ISO 3166-1 alpha-2
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    source          VARCHAR(100),

    -- ========== JSONB FLEXIBLE FIELDS ==========
    custom_fields   JSONB NOT NULL DEFAULT '{}',
    -- Example custom_fields for a SaaS company:
    -- {
    --   "contract_renewal_date": "2026-12-15",
    --   "arr": {"amount": 12000000, "currency": "USD"},
    --   "tech_stack": ["React", "PostgreSQL", "AWS"],
    --   "buying_committee_role": "champion",
    --   "linkedin_url": "https://linkedin.com/in/janesmith",
    --   "preferred_language": "en-US",
    --   "gdpr_consent_marketing": true
    -- }
    --
    -- Example custom_fields for a real estate CRM:
    -- {
    --   "property_interest": "commercial",
    --   "budget_range": {"min": 500000, "max": 2000000, "currency": "USD"},
    --   "pre_approved": true,
    --   "preferred_neighborhoods": ["Downtown", "Midtown"],
    --   "agent_notes": "Prefers in-person viewings"
    -- }

    -- ========== AI DENORMALIZED SCORES ==========
    lead_score          NUMERIC(7,4),
    lead_score_label    VARCHAR(20),
    lead_score_updated_at TIMESTAMPTZ,

    -- ========== ACTIVITY STATS (denormalized, updated by triggers/workers) ==========
    last_activity_at    TIMESTAMPTZ,
    email_count         INTEGER DEFAULT 0,
    meeting_count       INTEGER DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(workspace_id, email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(workspace_id, lifecycle_stage);
CREATE INDEX idx_contacts_name ON contacts(workspace_id, last_name, first_name);
CREATE INDEX idx_contacts_score ON contacts(workspace_id, lead_score DESC NULLS LAST);
-- GIN index for custom field queries
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN (custom_fields);

-- ============================================================
-- COMPANIES — relational core + JSONB custom fields
-- ============================================================

CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- ========== RELATIONAL CORE ==========
    name            VARCHAR(500) NOT NULL,
    domain          VARCHAR(255),
    industry        VARCHAR(255),
    employee_count  INTEGER,
    annual_revenue  BIGINT,
    revenue_currency VARCHAR(3) DEFAULT 'USD',
    country_code    CHAR(2),
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,

    -- ========== JSONB FLEXIBLE FIELDS ==========
    custom_fields   JSONB NOT NULL DEFAULT '{}',
    -- Example:
    -- {
    --   "founded_year": 2018,
    --   "funding_stage": "series_c",
    --   "total_funding": {"amount": 85000000, "currency": "USD"},
    --   "tech_stack": ["React", "Node.js", "AWS"],
    --   "compliance_certifications": ["SOC2", "ISO27001"],
    --   "headquarters": {"city": "San Francisco", "state": "CA", "country": "US"}
    -- }

    -- ========== DENORMALIZED STATS ==========
    contact_count       INTEGER DEFAULT 0,
    open_deal_count     INTEGER DEFAULT 0,
    total_deal_value    BIGINT DEFAULT 0,
    last_activity_at    TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contacts ADD CONSTRAINT fk_contacts_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_domain ON companies(workspace_id, domain);
CREATE INDEX idx_companies_name ON companies(workspace_id, name);
CREATE INDEX idx_companies_custom_fields ON companies USING GIN (custom_fields);

-- ============================================================
-- DEALS — relational core + JSONB custom fields
-- ============================================================

CREATE TABLE pipelines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    stages          JSONB NOT NULL DEFAULT '[]',
    -- Example stages:
    -- [
    --   {"id": "uuid", "name": "Qualification", "order": 0, "probability": 10, "type": "open"},
    --   {"id": "uuid", "name": "Discovery", "order": 1, "probability": 25, "type": "open"},
    --   {"id": "uuid", "name": "Proposal", "order": 2, "probability": 50, "type": "open"},
    --   {"id": "uuid", "name": "Negotiation", "order": 3, "probability": 75, "type": "open"},
    --   {"id": "uuid", "name": "Closed Won", "order": 4, "probability": 100, "type": "won"},
    --   {"id": "uuid", "name": "Closed Lost", "order": 5, "probability": 0, "type": "lost"}
    -- ]
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
    stage_id        UUID NOT NULL,          -- references a stage within pipeline.stages JSONB
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,

    -- ========== RELATIONAL CORE ==========
    name            VARCHAR(500) NOT NULL,
    amount          BIGINT,
    currency        VARCHAR(3) DEFAULT 'USD',
    expected_close_date DATE,
    actual_close_date   DATE,
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    source          VARCHAR(100),
    priority        VARCHAR(20) DEFAULT 'medium',

    -- ========== JSONB FLEXIBLE FIELDS ==========
    custom_fields   JSONB NOT NULL DEFAULT '{}',
    -- Example for SaaS:
    -- {
    --   "contract_term_months": 12,
    --   "payment_terms": "net_30",
    --   "competitor_mentioned": "Salesforce",
    --   "procurement_contact_id": "uuid",
    --   "security_review_status": "in_progress",
    --   "legal_review_required": true
    -- }

    -- ========== AI SCORES ==========
    health_score        NUMERIC(7,4),
    health_label        VARCHAR(20),
    health_score_updated_at TIMESTAMPTZ,

    -- ========== DENORMALIZED ==========
    contact_ids     UUID[] DEFAULT '{}',    -- array of associated contact IDs
    stage_entered_at    TIMESTAMPTZ,
    last_activity_at    TIMESTAMPTZ,
    email_count         INTEGER DEFAULT 0,
    meeting_count       INTEGER DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_workspace ON deals(workspace_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_close_date ON deals(workspace_id, expected_close_date);
CREATE INDEX idx_deals_health ON deals(workspace_id, health_score DESC NULLS LAST);
CREATE INDEX idx_deals_custom_fields ON deals USING GIN (custom_fields);
CREATE INDEX idx_deals_contacts ON deals USING GIN (contact_ids);

-- ============================================================
-- CUSTOM OBJECT RECORDS — generic table for user-defined objects
-- ============================================================

CREATE TABLE custom_object_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    object_def_id   UUID NOT NULL REFERENCES custom_object_definitions(id) ON DELETE CASCADE,
    display_name    VARCHAR(500),           -- computed primary display field
    fields          JSONB NOT NULL DEFAULT '{}',
    -- fields contains ALL data for this record, validated against field_definitions
    -- Example for a custom "Invoice" object:
    -- {
    --   "invoice_number": "INV-2026-001",
    --   "amount": {"amount": 5000000, "currency": "USD"},
    --   "status": "sent",
    --   "due_date": "2026-06-15",
    --   "deal_id": "uuid",
    --   "contact_id": "uuid",
    --   "line_items": [
    --     {"description": "Enterprise Plan - Annual", "qty": 1, "unit_price": 5000000}
    --   ]
    -- }
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_records_workspace ON custom_object_records(workspace_id, object_def_id);
CREATE INDEX idx_custom_records_fields ON custom_object_records USING GIN (fields);
```

---

## Activities & Communication

```sql
-- ============================================================
-- ACTIVITIES — unified timeline with JSONB detail
-- ============================================================

CREATE TABLE activities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_type   VARCHAR(50) NOT NULL,   -- email, meeting, call, note, task, stage_change

    -- ========== RELATIONAL CORE ==========
    subject         VARCHAR(1000),
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,

    -- ========== JSONB DETAIL (activity-type-specific) ==========
    detail          JSONB NOT NULL DEFAULT '{}',
    -- Example for activity_type = 'email':
    -- {
    --   "message_id": "<abc@gmail.com>",
    --   "thread_id": "thread-xyz",
    --   "direction": "inbound",
    --   "from": {"email": "jane@acme.com", "name": "Jane Smith"},
    --   "to": [{"email": "rep@company.com", "name": "Sales Rep"}],
    --   "cc": [],
    --   "body_text": "...",
    --   "body_html": "...",
    --   "has_attachments": true,
    --   "attachments": [{"filename": "proposal.pdf", "size": 245000, "storage_key": "..."}],
    --   "provider": "gmail",
    --   "tracking": {"opened": true, "opened_at": "2026-05-11T10:30:00Z", "open_count": 3}
    -- }
    --
    -- Example for activity_type = 'meeting':
    -- {
    --   "start_at": "2026-05-12T14:00:00Z",
    --   "end_at": "2026-05-12T15:00:00Z",
    --   "location": "Zoom",
    --   "conference_url": "https://zoom.us/j/123",
    --   "attendees": [
    --     {"email": "jane@acme.com", "name": "Jane Smith", "status": "accepted", "contact_id": "uuid"},
    --     {"email": "rep@company.com", "name": "Sales Rep", "status": "accepted"}
    --   ],
    --   "provider": "google_calendar",
    --   "provider_event_id": "abc123"
    -- }
    --
    -- Example for activity_type = 'call':
    -- {
    --   "duration_minutes": 23,
    --   "direction": "outbound",
    --   "outcome": "connected",
    --   "phone_number": "+1-555-0123",
    --   "recording_url": "https://...",
    --   "transcript": "..."
    -- }
    --
    -- Example for activity_type = 'note':
    -- {
    --   "body": "Discussed pricing. Decision expected by Friday.",
    --   "body_html": "<p>Discussed pricing...</p>",
    --   "is_ai_generated": false
    -- }

    is_ai_generated BOOLEAN NOT NULL DEFAULT false,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_workspace ON activities(workspace_id, occurred_at DESC);
CREATE INDEX idx_activities_type ON activities(workspace_id, activity_type);
CREATE INDEX idx_activities_contact ON activities(contact_id, occurred_at DESC);
CREATE INDEX idx_activities_deal ON activities(deal_id, occurred_at DESC);
CREATE INDEX idx_activities_company ON activities(company_id, occurred_at DESC);
CREATE INDEX idx_activities_detail ON activities USING GIN (detail);

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title           VARCHAR(1000) NOT NULL,
    description     TEXT,
    due_at          TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    priority        VARCHAR(20) DEFAULT 'medium',
    status          VARCHAR(20) DEFAULT 'todo',
    assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_due ON tasks(workspace_id, due_at);
```

---

## AI Features

```sql
-- ============================================================
-- AI: MEETING SUMMARIES
-- ============================================================

CREATE TABLE ai_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_id     UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    summary_type    VARCHAR(50) NOT NULL,   -- meeting_summary, email_thread_summary, deal_summary
    content         JSONB NOT NULL,
    -- Example content for meeting_summary:
    -- {
    --   "summary": "Discussed Enterprise pricing and security requirements...",
    --   "key_points": ["Budget approved for Q3", "Need SOC 2 report"],
    --   "action_items": [
    --     {"text": "Send SOC 2 report", "assignee": "rep@company.com", "due": "2026-05-15"},
    --     {"text": "Schedule technical deep-dive", "assignee": "se@company.com"}
    --   ],
    --   "sentiment": "positive",
    --   "topics": ["pricing", "security", "timeline"]
    -- }
    model_id        VARCHAR(100) NOT NULL,
    confidence      NUMERIC(5,4),
    reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_summaries_activity ON ai_summaries(activity_id);

-- ============================================================
-- AI: FOLLOW-UP DRAFTS
-- ============================================================

CREATE TABLE ai_follow_ups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    subject         VARCHAR(1000),
    body_text       TEXT NOT NULL,
    body_html       TEXT,
    status          VARCHAR(20) DEFAULT 'draft',
    model_id        VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at         TIMESTAMPTZ,
    sent_by         UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ai_follow_ups_deal ON ai_follow_ups(deal_id);

-- ============================================================
-- AI: SCORING
-- ============================================================

CREATE TABLE scoring_models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    model_type      VARCHAR(50) NOT NULL,
    config          JSONB NOT NULL DEFAULT '{}',
    -- Example config:
    -- {
    --   "algorithm": "gradient_boost",
    --   "features": ["email_response_rate", "meeting_frequency", "stage_velocity"],
    --   "training_metrics": {"auc": 0.87, "precision": 0.82, "recall": 0.79},
    --   "feature_importance": {"email_response_rate": 0.35, "meeting_frequency": 0.25, ...}
    -- }
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    trained_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE score_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL,   -- contact, deal
    entity_id       UUID NOT NULL,
    model_id        UUID NOT NULL REFERENCES scoring_models(id) ON DELETE CASCADE,
    score           NUMERIC(7,4) NOT NULL,
    label           VARCHAR(20),
    features        JSONB,                  -- input feature values
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_history_entity ON score_history(entity_type, entity_id, computed_at DESC);
CREATE INDEX idx_score_history_workspace ON score_history(workspace_id, computed_at DESC);
```

---

## Enrichment & GDPR

```sql
-- ============================================================
-- ENRICHMENT (GDPR-safe provenance)
-- ============================================================

CREATE TABLE enrichment_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    source_type     VARCHAR(50) NOT NULL,
    config          JSONB NOT NULL DEFAULT '{}',
    -- Example:
    -- {
    --   "base_url": "https://api.opencorporates.com",
    --   "gdpr_basis": "legitimate_interest",
    --   "lia_document_url": "https://...",
    --   "rate_limit_per_minute": 60,
    --   "fields_provided": ["industry", "employee_count", "founded_year"]
    -- }
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enrichment_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_id       UUID NOT NULL REFERENCES enrichment_sources(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    changes         JSONB NOT NULL,
    -- Example:
    -- {
    --   "industry": {"old": null, "new": "Technology", "confidence": 0.95},
    --   "employee_count": {"old": null, "new": 250, "confidence": 0.88},
    --   "founded_year": {"old": null, "new": 2018, "confidence": 0.99}
    -- }
    source_url      TEXT,
    status          VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected
    enriched_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX idx_enrichment_log_entity ON enrichment_log(entity_type, entity_id);
CREATE INDEX idx_enrichment_log_workspace ON enrichment_log(workspace_id, enriched_at DESC);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    changes         JSONB,
    ip_address      INET,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (occurred_at);

CREATE TABLE audit_log_2026_q1 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE audit_log_2026_q2 PARTITION OF audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE audit_log_2026_q3 PARTITION OF audit_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE audit_log_2026_q4 PARTITION OF audit_log
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

CREATE INDEX idx_audit_log_workspace ON audit_log(workspace_id, occurred_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
```

---

## Integration & Automation

```sql
-- ============================================================
-- OAUTH & INTEGRATIONS
-- ============================================================

CREATE TABLE oauth_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(500),
    access_token    TEXT NOT NULL,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes          TEXT[],
    sync_config     JSONB NOT NULL DEFAULT '{}',
    -- Example:
    -- {
    --   "sync_email": true,
    --   "sync_calendar": true,
    --   "email_folders": ["INBOX", "SENT"],
    --   "last_email_sync_at": "2026-05-11T10:00:00Z",
    --   "last_calendar_sync_at": "2026-05-11T10:00:00Z"
    -- }
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id, provider)
);

-- ============================================================
-- WEBHOOKS
-- ============================================================

CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    events          TEXT[] NOT NULL,
    secret          VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    config          JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- WORKFLOWS
-- ============================================================

CREATE TABLE workflows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    definition      JSONB NOT NULL,
    -- Example definition:
    -- {
    --   "trigger": {
    --     "type": "record_updated",
    --     "entity_type": "deal",
    --     "conditions": [{"field": "stage_id", "changed": true}]
    --   },
    --   "steps": [
    --     {
    --       "type": "condition",
    --       "if": {"field": "custom_fields.contract_term_months", "operator": ">=", "value": 12},
    --       "then": [
    --         {"type": "create_task", "config": {"title": "Schedule executive sponsor call", "assignee": "owner"}}
    --       ]
    --     },
    --     {"type": "send_notification", "config": {"channel": "slack", "message": "Deal {{name}} moved to {{stage}}"}}
    --   ]
    -- }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_entity_type VARCHAR(50),
    trigger_entity_id   UUID,
    status          VARCHAR(20) NOT NULL DEFAULT 'running',
    result          JSONB,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    error           TEXT
);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);

-- ============================================================
-- MCP TOOLS
-- ============================================================

CREATE TABLE mcp_tools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    tool_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    input_schema    JSONB NOT NULL,
    handler_type    VARCHAR(50) NOT NULL,
    handler_config  JSONB NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, tool_name)
);

-- ============================================================
-- TAGS
-- ============================================================

CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    color           VARCHAR(7),
    UNIQUE (workspace_id, name)
);

CREATE TABLE entity_tags (
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    PRIMARY KEY (tag_id, entity_type, entity_id)
);

CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_object_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation ON contacts
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON companies
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON deals
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON activities
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON custom_object_records
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
```

---

## Example Queries

### Custom Field Query: Find Contacts by Custom Field Value

```sql
-- Find all contacts with ARR > $100K (JSONB containment query)
SELECT id, full_name, email, custom_fields->>'arr' AS arr
FROM contacts
WHERE workspace_id = 'workspace-uuid'
  AND (custom_fields->'arr'->>'amount')::bigint > 10000000;

-- Find contacts interested in commercial properties (multi-value JSONB)
SELECT id, full_name, email
FROM contacts
WHERE workspace_id = 'workspace-uuid'
  AND custom_fields @> '{"property_interest": "commercial"}';

-- Find contacts with specific tech stack (JSONB array containment)
SELECT id, full_name, email
FROM contacts
WHERE workspace_id = 'workspace-uuid'
  AND custom_fields->'tech_stack' @> '"React"';
```

### Dynamic Field Discovery: List All Custom Fields for an Entity Type

```sql
-- Get all custom field definitions for contacts in a workspace
SELECT field_key, display_name, field_type, is_required, options
FROM field_definitions
WHERE workspace_id = 'workspace-uuid'
  AND entity_type = 'contact'
ORDER BY display_order;
```

### Activity Timeline with JSONB Detail Extraction

```sql
-- Unified activity timeline for a contact, extracting type-specific fields
SELECT
    a.id,
    a.activity_type,
    a.subject,
    a.occurred_at,
    CASE a.activity_type
        WHEN 'email' THEN a.detail->>'direction'
        WHEN 'meeting' THEN 'meeting'
        WHEN 'call' THEN a.detail->>'outcome'
        ELSE NULL
    END AS direction_or_outcome,
    CASE a.activity_type
        WHEN 'email' THEN a.detail->'tracking'->>'opened'
        ELSE NULL
    END AS email_opened,
    a.is_ai_generated
FROM activities a
WHERE a.contact_id = 'contact-uuid'
ORDER BY a.occurred_at DESC
LIMIT 50;
```

---

## Table Count Summary

| Category | Tables | Notes |
|----------|--------|-------|
| Tenancy & Users | 2 | workspaces, users |
| Meta-Schema | 2 | field_definitions, custom_object_definitions |
| CRM Core | 5 | contacts, companies, pipelines, deals, custom_object_records |
| Activities | 2 | activities, tasks |
| AI Features | 4 | ai_summaries, ai_follow_ups, scoring_models, score_history |
| Enrichment & Audit | 3 | enrichment_sources, enrichment_log, audit_log (partitioned) |
| Integration | 5 | oauth_connections, webhooks, workflows, workflow_executions, mcp_tools |
| Tags | 2 | tags, entity_tags |
| **Total** | **25** | |

---

## Key Design Decisions

1. **Relational columns for query-hot fields, JSONB for everything else** -- Fields that appear in WHERE clauses, ORDER BY, or JOIN conditions (email, lifecycle_stage, owner_id, expected_close_date) are relational columns with proper indexes. Tenant-specific, industry-specific, or rarely-queried fields live in `custom_fields` JSONB. This balances query performance with schema flexibility.

2. **GIN indexes on all JSONB columns** -- Every `custom_fields` column has a GIN index enabling fast `@>` containment queries, `?` key-existence checks, and `->>` path lookups. This makes custom field filtering performant without per-field indexes.

3. **Field definitions as a meta-schema** -- The `field_definitions` table acts as a schema registry for custom fields. The application validates JSONB values against these definitions before writing. This provides the documentation and validation benefits of a relational schema without requiring schema migrations.

4. **Pipeline stages embedded in JSONB** -- Pipeline stages are stored as a JSONB array within the `pipelines` table rather than a separate table. This simplifies the most common query pattern (loading a pipeline with its stages) to a single row fetch, and stages are always read and written as a unit with their pipeline.

5. **Unified activity table with JSONB detail** -- A single `activities` table stores all activity types (email, meeting, call, note). The `activity_type` discriminator determines the shape of the `detail` JSONB column. This eliminates the need for JOIN-heavy timeline queries across multiple tables.

6. **Denormalized counts and scores on core entities** -- `contact_count`, `open_deal_count`, `lead_score`, and `last_activity_at` are stored directly on parent entities and updated by background workers. This eliminates expensive COUNT/MAX aggregations on every list view load.

7. **Custom objects via generic record table** -- User-defined entity types (Attio's "custom objects") use a single `custom_object_records` table with a `fields` JSONB column. The schema is defined by `field_definitions` entries linked to the object definition. This enables unlimited custom entity types without schema changes.

8. **Audit log partitioned by quarter** -- Audit logs grow unboundedly. Quarterly partitioning enables efficient archival and keeps individual partition sizes manageable. Partition pruning ensures time-range queries remain fast.

9. **Workflow definitions as JSONB** -- Workflow trigger/action definitions are stored as JSONB documents rather than normalized step tables. This matches the natural structure of a workflow (a tree of conditions and actions) and simplifies the workflow engine's read path.

10. **GDPR enrichment provenance with batch change tracking** -- `enrichment_log.changes` stores all field changes from a single enrichment operation as a JSONB document with old/new values and per-field confidence scores. This provides a complete audit trail while keeping the enrichment log compact (one row per enrichment operation rather than one row per field).
