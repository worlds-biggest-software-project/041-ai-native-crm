# NativeCRM Data Model Reference

## Overview

NativeCRM uses a hybrid relational + JSONB data model on PostgreSQL 16. Core CRM fields are stored as relational columns with proper indexes, foreign keys, and constraints. Custom fields use a `custom_fields JSONB` column per entity, validated at the application layer against workspace-scoped `field_definition` metadata.

All entities are workspace-scoped. Every table with business data includes a `workspace_id` foreign key to enforce tenant isolation.

## Entity Relationship Diagram

```
                              +---------------+
                              |   workspace   |
                              +-------+-------+
                                      |
           +-----------+-----------+--+--+----------+----------+-----------+
           |           |           |     |          |          |           |
        +--+--+     +--+--+    +--+--+  |    +-----+----+ +---+---+ +----+----+
        | user|     |contact|  |company| |    | pipeline | |  tag  | |field_def|
        +--+--+     +--+--+   +--+--+   |    +----+-----+ +---+---+ +---------+
           |           |         |       |         |           |
           |     +-----+    +---+       |    +----+----+  +---+------+
           |     |           |          |    |  deal   |  |entity_tag|
           |     |     +-----+          |    +----+----+  +----------+
           |     |     |                |         |
           |  +--+-----+---+           |    +----+----+
           |  |  activity   |           |    |  task   |
           |  +------+------+           |    +---------+
           |         |                  |
           |   +-----+-------+         |
           |   | ai_summary  |         |
           |   +-------------+         |
           |   | ai_follow_up|         |
           |   +-------------+         |
           |                           |
     +-----+----------+         +-----+----------+
     |oauth_connection |         |enrichment_source|
     +-----------------+         +-------+--------+
                                         |
                                 +-------+--------+
                                 | enrichment_log  |
                                 +----------------+

     +----------------+    +-------------------+    +------------------+
     | scoring_model  |    |custom_object_def  |    |    webhook       |
     +-------+--------+    +--------+----------+    +--------+---------+
             |                      |                        |
     +-------+--------+    +-------+-----------+    +--------+---------+
     | score_history   |    |custom_object_record|   | webhook_delivery |
     +----------------+    +-------------------+    +------------------+

     +----------------+    +-------------------+
     |   workflow      |    |    audit_log      |
     +-------+--------+    +-------------------+
             |
     +-------+------------+
     | workflow_execution  |
     +--------------------+
```

### Key Relationships

```
workspace 1--* user
workspace 1--* contact
workspace 1--* company
workspace 1--* pipeline
workspace 1--* deal
workspace 1--* activity
workspace 1--* task
workspace 1--* tag
workspace 1--* field_definition
workspace 1--* custom_object_definition
workspace 1--* oauth_connection
workspace 1--* webhook
workspace 1--* workflow
workspace 1--* enrichment_source
workspace 1--* scoring_model

company  1--* contact              (contact.company_id -> company.id, SET NULL)
company  1--* deal                 (deal.company_id -> company.id, SET NULL)

pipeline 1--* deal                 (deal.pipeline_id -> pipeline.id, RESTRICT)

user     1--* contact (owner)      (contact.owner_id -> user.id, SET NULL)
user     1--* company (owner)      (company.owner_id -> user.id, SET NULL)
user     1--* deal (owner)         (deal.owner_id -> user.id, SET NULL)
user     1--* task (assignee)      (task.assignee_id -> user.id, SET NULL)

contact  0..* -- * deal            (deal.contact_ids UUID[], application-level)
contact  1--* activity             (activity.contact_id -> contact.id, SET NULL)
company  1--* activity             (activity.company_id -> company.id, SET NULL)
deal     1--* activity             (activity.deal_id -> deal.id, SET NULL)

activity 1--0..1 ai_summary       (ai_summary.activity_id -> activity.id, CASCADE)
contact  1--* ai_follow_up        (ai_follow_up.contact_id -> contact.id, CASCADE)

custom_object_definition 1--* custom_object_record
```

---

## Core Entities

### workspace

The top-level tenant boundary. All CRM data is scoped to a workspace.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `name` | VARCHAR(255) | NOT NULL | | Workspace display name |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | | URL-safe identifier |
| `plan` | VARCHAR(50) | NOT NULL | `'free'` | Tier: free, pro, enterprise |
| `settings` | JSONB | NOT NULL | `'{}'` | Workspace-level configuration |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Settings JSONB schema:**
```json
{
  "excluded_domains": ["ourcompany.com"],
  "auto_apply_enrichment": true,
  "enrichment_threshold": 0.8
}
```

---

### user

A person with access to a workspace.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `email` | VARCHAR(320) | NOT NULL | | |
| `full_name` | VARCHAR(255) | NOT NULL | | |
| `avatar_url` | TEXT | | | |
| `role` | VARCHAR(50) | NOT NULL | `'member'` | `admin` or `member` |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `last_login_at` | TIMESTAMPTZ | | | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `UNIQUE(workspace_id, email)` -- One account per email per workspace
- `INDEX(workspace_id)`

**Role Permissions:**
- **admin** -- All actions: workspace settings, integrations, custom fields/objects, webhooks, workflows, user management, MCP API keys, plus all member permissions.
- **member** -- CRUD on contacts, companies, deals, activities, tasks. Read-only on settings/integrations.

---

### contact

A person tracked in the CRM. Supports soft delete.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `company_id` | UUID | FK -> company.id SET NULL | | Associated company |
| `first_name` | VARCHAR(255) | | | |
| `last_name` | VARCHAR(255) | | | |
| `full_name` | VARCHAR(500) | NOT NULL | | Display name |
| `email` | VARCHAR(320) | | | Deduplicated within workspace |
| `phone` | VARCHAR(50) | | | |
| `job_title` | VARCHAR(255) | | | |
| `city` | VARCHAR(255) | | | |
| `country_code` | CHAR(2) | | | ISO 3166-1 alpha-2 |
| `lifecycle_stage` | VARCHAR(50) | | `'lead'` | lead, subscriber, opportunity, customer, evangelist, other |
| `owner_id` | UUID | FK -> user.id SET NULL | | Record owner |
| `source` | VARCHAR(100) | | | email_sync, calendar_sync, csv_import, vcard_import, manual, enrichment |
| `custom_fields` | JSONB | NOT NULL | `'{}'` | Validated against field_definitions |
| `lead_score` | NUMERIC(7,4) | | | 0-100 |
| `lead_score_label` | VARCHAR(20) | | | hot, warm, cool, cold |
| `lead_score_updated_at` | TIMESTAMPTZ | | | |
| `last_activity_at` | TIMESTAMPTZ | | | Denormalized for sort performance |
| `email_count` | INTEGER | | `0` | Denormalized counter |
| `meeting_count` | INTEGER | | `0` | Denormalized counter |
| `search_vector` | TSVECTOR | | | Full-text search (A=name, B=email, C=title, D=city) |
| `deleted_at` | TIMESTAMPTZ | | | NULL = active; non-NULL = soft-deleted |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `INDEX(workspace_id)` -- Workspace-scoped queries
- `INDEX(workspace_id, email)` -- Deduplication lookups
- `INDEX(company_id)` -- Company relation
- `INDEX(owner_id)` -- Owner filtering
- `INDEX(workspace_id, lifecycle_stage)` -- Stage filtering
- `INDEX(workspace_id, last_name, first_name)` -- Name sorting
- `INDEX(workspace_id, lead_score)` -- Score-based sorting
- `GIN(search_vector)` -- Full-text search

---

### company

An organization in the CRM. Supports soft delete.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `name` | VARCHAR(500) | NOT NULL | | |
| `domain` | VARCHAR(255) | | | Enrichment lookup key |
| `industry` | VARCHAR(255) | | | |
| `employee_count` | INTEGER | | | |
| `annual_revenue` | BIGINT | | | In smallest currency unit |
| `revenue_currency` | VARCHAR(3) | | `'USD'` | ISO 4217 |
| `country_code` | CHAR(2) | | | ISO 3166-1 alpha-2 |
| `owner_id` | UUID | FK -> user.id SET NULL | | |
| `custom_fields` | JSONB | NOT NULL | `'{}'` | |
| `contact_count` | INTEGER | | `0` | Denormalized |
| `open_deal_count` | INTEGER | | `0` | Denormalized |
| `total_deal_value` | BIGINT | | `0` | Denormalized |
| `last_activity_at` | TIMESTAMPTZ | | | |
| `search_vector` | TSVECTOR | | | Full-text search |
| `deleted_at` | TIMESTAMPTZ | | | Soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `INDEX(workspace_id)`
- `INDEX(workspace_id, domain)` -- Domain-based lookups
- `INDEX(workspace_id, name)` -- Name search
- `GIN(search_vector)` -- Full-text search

---

### pipeline

A configurable sales pipeline with stage definitions stored as JSONB.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `name` | VARCHAR(255) | NOT NULL | | |
| `is_default` | BOOLEAN | NOT NULL | `false` | One default per workspace |
| `stages` | JSONB | NOT NULL | `'[]'` | Array of PipelineStage objects |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**PipelineStage JSONB schema (validated at application layer):**
```json
{
  "id": "uuid",
  "name": "string (1-255 chars)",
  "order": "integer (0-based)",
  "probability": "integer (0-100)",
  "type": "open | won | lost"
}
```

**Default stages (seeded on workspace creation):**

| Name | Order | Probability | Type |
|------|-------|-------------|------|
| Qualification | 0 | 10% | open |
| Discovery | 1 | 25% | open |
| Proposal | 2 | 50% | open |
| Negotiation | 3 | 75% | open |
| Closed Won | 4 | 100% | won |
| Closed Lost | 5 | 0% | lost |

---

### deal

A sales opportunity. Belongs to a pipeline and stage. Supports soft delete.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `pipeline_id` | UUID | FK -> pipeline.id RESTRICT, NOT NULL | | |
| `stage_id` | UUID | NOT NULL | | References stages JSONB; validated at app layer |
| `company_id` | UUID | FK -> company.id SET NULL | | |
| `name` | VARCHAR(500) | NOT NULL | | |
| `amount` | BIGINT | | | In smallest currency unit (cents) |
| `currency` | VARCHAR(3) | | `'USD'` | ISO 4217 |
| `expected_close_date` | DATE | | | |
| `actual_close_date` | DATE | | | Set when stage.type = won or lost |
| `owner_id` | UUID | FK -> user.id SET NULL | | |
| `source` | VARCHAR(100) | | | Lead source |
| `priority` | VARCHAR(20) | | `'medium'` | low, medium, high |
| `custom_fields` | JSONB | NOT NULL | `'{}'` | |
| `health_score` | NUMERIC(7,4) | | | 0-100 |
| `health_label` | VARCHAR(20) | | | hot, warm, cool, cold |
| `health_score_updated_at` | TIMESTAMPTZ | | | |
| `contact_ids` | UUID[] | | `'{}'` | Associated contacts (application-level relation) |
| `stage_entered_at` | TIMESTAMPTZ | | | Updated on stage change |
| `last_activity_at` | TIMESTAMPTZ | | | Denormalized |
| `email_count` | INTEGER | | `0` | Denormalized |
| `meeting_count` | INTEGER | | `0` | Denormalized |
| `search_vector` | TSVECTOR | | | Full-text search |
| `deleted_at` | TIMESTAMPTZ | | | Soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `INDEX(workspace_id)`
- `INDEX(pipeline_id)`
- `INDEX(stage_id)`
- `INDEX(company_id)`
- `INDEX(owner_id)`
- `INDEX(workspace_id, expected_close_date)` -- Close date filtering
- `INDEX(workspace_id, health_score)` -- Score-based sorting
- `GIN(search_vector)` -- Full-text search

**Stage Transition Logic:**

When `stage_id` changes:
1. Validate new stage exists in `pipeline.stages` JSONB.
2. Update `stage_entered_at` to current timestamp.
3. Write an `audit_log` entry (action: `deal.stage_changed`).
4. If new stage type is `won` or `lost`, set `actual_close_date` to today.
5. Update `company.open_deal_count` and `company.total_deal_value`.
6. Dispatch `deal.stage_changed` webhook event.

---

### activity

A recorded interaction linked to contacts, companies, and/or deals.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `activity_type` | VARCHAR(50) | NOT NULL | | email, meeting, call, note, stage_change |
| `subject` | VARCHAR(1000) | | | |
| `occurred_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `owner_id` | UUID | FK -> user.id SET NULL | | |
| `contact_id` | UUID | FK -> contact.id SET NULL | | |
| `company_id` | UUID | FK -> company.id SET NULL | | |
| `deal_id` | UUID | FK -> deal.id SET NULL | | |
| `detail` | JSONB | NOT NULL | `'{}'` | Type-specific payload |
| `is_ai_generated` | BOOLEAN | NOT NULL | `false` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `INDEX(workspace_id, occurred_at)` -- Timeline queries
- `INDEX(workspace_id, activity_type)` -- Type filtering
- `INDEX(contact_id, occurred_at)` -- Contact timeline
- `INDEX(deal_id, occurred_at)` -- Deal timeline
- `INDEX(company_id, occurred_at)` -- Company timeline

#### Detail JSONB Schemas

**email:**
```json
{
  "message_id": "<abc123@mail.gmail.com>",
  "thread_id": "thread-xyz",
  "direction": "inbound | outbound",
  "from": { "email": "jane@acme.com", "name": "Jane Smith" },
  "to": [{ "email": "sales@co.com", "name": "Sales Team" }],
  "cc": [{ "email": "...", "name": "..." }],
  "body_text": "Plain text body (HTML stripped)",
  "has_attachments": false,
  "attachment_names": [],
  "provider": "gmail | outlook"
}
```

**meeting:**
```json
{
  "start_at": "2026-05-12T10:00:00Z",
  "end_at": "2026-05-12T11:00:00Z",
  "location": "Conference Room A",
  "conference_url": "https://meet.google.com/abc-defg-hij",
  "attendees": [
    {
      "email": "jane@acme.com",
      "name": "Jane Smith",
      "status": "accepted | declined | tentative | needsAction",
      "contact_id": "uuid-or-null"
    }
  ],
  "provider": "google_calendar | outlook_calendar",
  "provider_event_id": "provider-event-id"
}
```

**call:**
```json
{
  "duration_seconds": 1200,
  "outcome": "connected | voicemail | no_answer",
  "direction": "inbound | outbound",
  "notes": "Discussed pricing tiers."
}
```

**note:**
```json
{
  "body_text": "Free-form note content.",
  "is_pinned": false
}
```

**stage_change:**
```json
{
  "from_stage_id": "uuid",
  "from_stage_name": "Discovery",
  "to_stage_id": "uuid",
  "to_stage_name": "Proposal",
  "pipeline_id": "uuid"
}
```

---

### task

An action item, optionally AI-generated from meeting summaries.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `title` | VARCHAR(1000) | NOT NULL | | |
| `description` | TEXT | | | |
| `due_at` | TIMESTAMPTZ | | | |
| `completed_at` | TIMESTAMPTZ | | | |
| `priority` | VARCHAR(20) | | `'medium'` | low, medium, high |
| `status` | VARCHAR(20) | | `'todo'` | todo, in_progress, done |
| `assignee_id` | UUID | FK -> user.id SET NULL | | |
| `contact_id` | UUID | FK -> contact.id SET NULL | | |
| `deal_id` | UUID | FK -> deal.id SET NULL | | |
| `is_ai_generated` | BOOLEAN | NOT NULL | `false` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

---

## AI and Scoring Entities

### ai_summary

A structured meeting summary generated by an LLM.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `activity_id` | UUID | FK -> activity.id CASCADE, NOT NULL | | Source meeting activity |
| `summary_type` | VARCHAR(50) | NOT NULL | | `meeting_summary` |
| `content` | JSONB | NOT NULL | | Structured summary |
| `model_id` | VARCHAR(100) | NOT NULL | | LLM model identifier |
| `confidence` | NUMERIC(5,4) | | | 0-1 confidence score |
| `reviewed_by` | UUID | FK -> user.id SET NULL | | |
| `reviewed_at` | TIMESTAMPTZ | | | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Content JSONB schema:**
```json
{
  "summary": "2-3 sentence overview of the meeting",
  "key_points": [
    "Budget approved for Q3",
    "Need technical deep-dive next week"
  ],
  "action_items": [
    {
      "description": "Send revised proposal",
      "assignee": "jane@acme.com",
      "due_date": "2026-05-15"
    }
  ],
  "sentiment": "positive | neutral | negative | mixed",
  "topics": ["pricing", "technical requirements", "timeline"]
}
```

---

### ai_follow_up

A draft follow-up email generated by an LLM.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `activity_id` | UUID | FK -> activity.id SET NULL | | Source meeting |
| `deal_id` | UUID | FK -> deal.id SET NULL | | |
| `contact_id` | UUID | FK -> contact.id CASCADE, NOT NULL | | Recipient |
| `subject` | VARCHAR(1000) | | | Email subject line |
| `body_text` | TEXT | NOT NULL | | Plain text draft |
| `body_html` | TEXT | | | Rich text draft |
| `status` | VARCHAR(20) | | `'draft'` | draft, sent, discarded |
| `model_id` | VARCHAR(100) | NOT NULL | | LLM model identifier |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `sent_at` | TIMESTAMPTZ | | | |
| `sent_by` | UUID | FK -> user.id SET NULL | | |

---

### scoring_model

ML or heuristic model configuration for scoring.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `name` | VARCHAR(255) | NOT NULL | | |
| `model_type` | VARCHAR(50) | NOT NULL | | `deal_health` or `lead_score` |
| `config` | JSONB | NOT NULL | `'{}'` | Feature names, thresholds, hyperparameters |
| `version` | INTEGER | NOT NULL | `1` | |
| `is_active` | BOOLEAN | NOT NULL | `false` | One active per workspace+type |
| `trained_at` | TIMESTAMPTZ | | | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

---

### score_history

Historical score snapshots for trend analysis.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `entity_type` | VARCHAR(50) | NOT NULL | | `deal` or `contact` |
| `entity_id` | UUID | NOT NULL | | |
| `model_id` | UUID | FK -> scoring_model.id CASCADE, NOT NULL | | |
| `score` | NUMERIC(7,4) | NOT NULL | | |
| `label` | VARCHAR(20) | | | hot, warm, cool, cold |
| `features` | JSONB | | | Feature snapshot at scoring time |
| `computed_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `INDEX(entity_type, entity_id, computed_at)` -- History queries

---

## Integration Entities

### oauth_connection

Encrypted OAuth token storage for email/calendar sync.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `user_id` | UUID | FK -> user.id CASCADE, NOT NULL | | |
| `provider` | VARCHAR(50) | NOT NULL | | gmail, outlook, google_calendar, outlook_calendar |
| `provider_user_id` | VARCHAR(500) | | | |
| `access_token` | TEXT | NOT NULL | | AES-256-GCM encrypted |
| `refresh_token` | TEXT | | | AES-256-GCM encrypted |
| `token_expires_at` | TIMESTAMPTZ | | | |
| `scopes` | TEXT[] | | | Granted OAuth scopes |
| `sync_config` | JSONB | NOT NULL | `'{}'` | Sync state |
| `is_active` | BOOLEAN | NOT NULL | `true` | Set false on revocation |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `UNIQUE(workspace_id, user_id, provider)` -- One connection per user per provider per workspace

**Sync Config JSONB schema:**
```json
{
  "last_history_id": "gmail-history-id",
  "last_delta_link": "microsoft-graph-delta-link",
  "last_sync_at": "2026-05-12T09:30:00Z"
}
```

---

## Enrichment Entities

### enrichment_source

Configured external data source for enrichment.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `name` | VARCHAR(255) | NOT NULL | | |
| `source_type` | VARCHAR(50) | NOT NULL | | opencorporates, companies_house, sec_edgar |
| `config` | JSONB | NOT NULL | `'{}'` | API keys, rate limits |
| `gdpr_basis` | VARCHAR(100) | | | legitimate_interest, public_data |
| `lia_document_url` | TEXT | | | Link to Legitimate Interest Assessment |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

---

### enrichment_log

Auditable record of each enrichment change.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `source_id` | UUID | FK -> enrichment_source.id CASCADE, NOT NULL | | |
| `entity_type` | VARCHAR(50) | NOT NULL | | contact or company |
| `entity_id` | UUID | NOT NULL | | |
| `changes` | JSONB | NOT NULL | | Change payload |
| `source_url` | TEXT | | | Provenance URL |
| `status` | VARCHAR(20) | | `'pending'` | pending, accepted, rejected |
| `enriched_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `reviewed_by` | UUID | FK -> user.id SET NULL | | |
| `reviewed_at` | TIMESTAMPTZ | | | |

**Indexes:**
- `INDEX(entity_type, entity_id)` -- Entity-scoped lookups

**Changes JSONB schema:**
```json
{
  "industry": {
    "old": null,
    "new": "Technology",
    "confidence": 0.92
  },
  "employee_count": {
    "old": null,
    "new": 250,
    "confidence": 0.85
  }
}
```

The `status` field controls the enrichment workflow:
- **pending** -- Enrichment found but below auto-apply confidence threshold. Queued for manual review.
- **accepted** -- Applied to the entity record (automatically if above threshold, or manually approved).
- **rejected** -- Discarded by a reviewer.

---

## Custom Field System

### field_definition

Metadata for custom fields attached to entities.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `entity_type` | VARCHAR(50) | NOT NULL | | contact, company, deal, or custom object key |
| `field_key` | VARCHAR(100) | NOT NULL | | Must match `^[a-z][a-z0-9_]*$` |
| `display_name` | VARCHAR(255) | NOT NULL | | |
| `field_type` | VARCHAR(50) | NOT NULL | | See supported types below |
| `description` | TEXT | | | |
| `is_required` | BOOLEAN | NOT NULL | `false` | |
| `is_unique` | BOOLEAN | NOT NULL | `false` | |
| `default_value` | JSONB | | | |
| `validation` | JSONB | | | JSON Schema for complex validation |
| `options` | JSONB | | | For select/multi_select types |
| `display_order` | INTEGER | NOT NULL | `0` | |
| `group_name` | VARCHAR(100) | | | Visual grouping |
| `is_system` | BOOLEAN | NOT NULL | `false` | Prevents deletion of built-in fields |
| `gdpr_category` | VARCHAR(50) | | | personally_identifiable, sensitive, business, none |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `UNIQUE(workspace_id, entity_type, field_key)` -- One definition per key per entity type per workspace
- `INDEX(workspace_id, entity_type)` -- List definitions for an entity type

**Supported field types (14):**

| Type | Value stored in JSONB | Validation |
|------|----------------------|------------|
| `text` | string | Max length from validation config |
| `number` | number | Min/max from validation config |
| `currency` | number | Stored in smallest unit |
| `date` | string | ISO 8601 date (YYYY-MM-DD) |
| `datetime` | string | ISO 8601 datetime |
| `email` | string | Email format validation |
| `phone` | string | Free-form |
| `url` | string | URL format validation |
| `select` | string | Must be one of defined options |
| `multi_select` | string[] | Each must be a defined option |
| `checkbox` | boolean | |
| `user_reference` | UUID string | Must be valid user in workspace |
| `entity_reference` | UUID string | Must be valid entity |
| `rich_text` | string | HTML/Markdown content |

**Options JSONB (for select/multi_select):**
```json
[
  { "value": "enterprise", "label": "Enterprise", "color": "#3B82F6" },
  { "value": "mid_market", "label": "Mid-Market", "color": "#10B981" },
  { "value": "smb", "label": "SMB", "color": "#F59E0B" }
]
```

### How Custom Fields Work

1. **Definition:** Admin creates a `field_definition` for an entity type (e.g., "contract_value" of type "currency" on deals).

2. **Storage:** Custom field values are stored in the entity's `custom_fields` JSONB column:
   ```json
   { "contract_value": 50000, "renewal_date": "2027-01-15" }
   ```

3. **Validation:** On create/update, the application layer:
   - Loads all `field_definition` rows for the entity type in the workspace.
   - Validates each value against its definition (type check, required check, options check).
   - Rejects unknown keys not defined in `field_definitions`.

4. **Display:** The frontend renders custom fields alongside standard fields using the `custom-field-renderer` component, respecting `display_order` and `group_name`.

5. **Deletion:** When a field definition is deleted, existing data in `custom_fields` JSONB is preserved (no data loss). The field simply no longer appears on forms.

---

### custom_object_definition

Admin-defined entity types (e.g., Invoices, Subscriptions).

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `object_key` | VARCHAR(100) | NOT NULL | | Unique within workspace |
| `display_name` | VARCHAR(255) | NOT NULL | | |
| `display_name_plural` | VARCHAR(255) | | | |
| `icon` | VARCHAR(50) | | | Icon identifier |
| `description` | TEXT | | | |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `UNIQUE(workspace_id, object_key)`

### custom_object_record

Records belonging to custom objects.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `object_def_id` | UUID | FK -> custom_object_definition.id CASCADE, NOT NULL | | |
| `display_name` | VARCHAR(500) | | | |
| `fields` | JSONB | NOT NULL | `'{}'` | Validated against field_definitions for object_key |
| `owner_id` | UUID | FK -> user.id SET NULL | | |
| `deleted_at` | TIMESTAMPTZ | | | Soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Indexes:**
- `INDEX(workspace_id, object_def_id)`

Custom objects use the same `field_definition` table as built-in entities. The `entity_type` column in `field_definition` is set to the custom object's `object_key`, allowing the same validation and rendering infrastructure.

---

## Automation Entities

### webhook

Registered endpoint for outbound event notifications.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `url` | TEXT | NOT NULL | | Endpoint URL |
| `events` | TEXT[] | NOT NULL | | Subscribed event types |
| `secret` | VARCHAR(255) | NOT NULL | | HMAC-SHA256 signing secret |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `config` | JSONB | NOT NULL | `'{}'` | Additional configuration |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Supported events:** `contact.created`, `contact.updated`, `contact.deleted`, `company.created`, `company.updated`, `company.deleted`, `deal.created`, `deal.updated`, `deal.deleted`, `deal.stage_changed`, `activity.created`, `task.created`, `task.completed`

---

### workflow

Trigger-condition-action automation definition.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `name` | VARCHAR(255) | NOT NULL | | |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `definition` | JSONB | NOT NULL | | Workflow definition |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Definition JSONB schema:**
```json
{
  "trigger": {
    "event": "deal.stage_changed",
    "conditions": {
      "to_stage_name": "Negotiation"
    }
  },
  "steps": [
    {
      "type": "create_task",
      "config": {
        "title": "Legal review for {{deal.name}}",
        "assignee_role": "admin"
      }
    },
    {
      "type": "wait",
      "config": {
        "duration": "2d"
      }
    },
    {
      "type": "condition",
      "config": {
        "field": "task.status",
        "operator": "eq",
        "value": "done"
      },
      "then": [],
      "else": [
        {
          "type": "send_notification",
          "config": {
            "message": "Legal review overdue for {{deal.name}}"
          }
        }
      ]
    }
  ]
}
```

### workflow_execution

Runtime state for a workflow execution instance.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workflow_id` | UUID | FK -> workflow.id CASCADE, NOT NULL | | |
| `trigger_entity_type` | VARCHAR(50) | | | |
| `trigger_entity_id` | UUID | | | |
| `status` | VARCHAR(20) | NOT NULL | `'running'` | running, completed, failed |
| `result` | JSONB | | | |
| `started_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `completed_at` | TIMESTAMPTZ | | | |
| `error` | TEXT | | | |

---

## Audit and Tagging

### audit_log

Immutable record of all data changes. Partitioned by quarter on `occurred_at`.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `user_id` | UUID | FK -> user.id SET NULL | | |
| `action` | VARCHAR(100) | NOT NULL | | entity.verb format (e.g., `deal.stage_changed`) |
| `entity_type` | VARCHAR(50) | NOT NULL | | |
| `entity_id` | UUID | NOT NULL | | |
| `changes` | JSONB | | | `{ field: { old, new } }` |
| `ip_address` | INET | | | |
| `occurred_at` | TIMESTAMPTZ | NOT NULL | `now()` | |

**Partitioning:** Partitioned by quarter on `occurred_at` for query performance at scale. Old partitions can be archived without affecting active queries.

---

### tag

User-defined labels for categorizing entities.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PK | `gen_random_uuid()` | |
| `workspace_id` | UUID | FK -> workspace.id CASCADE, NOT NULL | | |
| `name` | VARCHAR(100) | NOT NULL | | |
| `color` | VARCHAR(7) | | | Hex color (e.g., `#3B82F6`) |

**Indexes:**
- `UNIQUE(workspace_id, name)` -- No duplicate tag names within a workspace

### entity_tag

Polymorphic join table linking tags to any entity type.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `tag_id` | UUID | FK -> tag.id CASCADE, NOT NULL | | |
| `entity_type` | VARCHAR(50) | NOT NULL | | contact, company, deal, etc. |
| `entity_id` | UUID | NOT NULL | | |

**Indexes:**
- `PK(tag_id, entity_type, entity_id)` -- Composite primary key
- `INDEX(entity_type, entity_id)` -- Find all tags for an entity

---

## Soft Delete Behavior

Entities that support soft delete: **contact**, **company**, **deal**, **custom_object_record**.

When an entity is soft-deleted:
1. The `deleted_at` column is set to the current timestamp.
2. The record is excluded from all list queries via `WHERE deleted_at IS NULL`.
3. Direct GET requests return `404` for soft-deleted records.
4. The record is recoverable for 30 days.
5. After 30 days, a scheduled cleanup job permanently removes the record.
6. Hard delete (bypassing soft delete) is available only for GDPR right-to-erasure requests.
7. Foreign keys use SET NULL on delete, so related records retain their integrity.

---

## Audit/Timestamp Column Pattern

Every entity follows a consistent timestamp pattern:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `created_at` | TIMESTAMPTZ | `now()` | Record creation time, never updated |
| `updated_at` | TIMESTAMPTZ | `now()` | Updated on every modification |

Both columns are NOT NULL and use `withTimezone: true` in Drizzle schema definitions.

---

## Migration Notes

- **ORM:** Drizzle ORM with `drizzle-kit` for migration generation and execution.
- **Config:** `drizzle.config.ts` in the `target/` directory.
- **Migration files:** `target/src/server/db/migrations/`
- **Schema files:** `target/src/server/db/schema/*.ts` (one file per entity or entity group)
- **Circular imports:** Some foreign keys (e.g., `contact.company_id`) are defined without `.references()` in Drizzle schema to avoid circular module imports. These constraints are enforced via separate migration SQL.
- **JSONB validation:** Pipeline stages, activity details, custom fields, and workflow definitions are validated at the application layer using Zod schemas, not database constraints.
- **Full-text search:** `tsvector` columns and GIN indexes are managed via custom SQL migrations, not through Drizzle schema definitions.
