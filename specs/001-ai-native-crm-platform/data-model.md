# Data Model: AI-Native CRM Platform

**Branch**: `001-ai-native-crm-platform` | **Date**: 2026-05-12

## Overview

Hybrid relational + JSONB model. Core CRM fields are relational columns (indexed, foreign-keyed). Custom fields are stored in a `custom_fields JSONB` column per entity, validated at the application layer against a `field_definitions` meta-schema table. All entities are workspace-scoped.

## Entity Relationship Diagram

```
workspace 1──* user
workspace 1──* contact
workspace 1──* company
workspace 1──* pipeline
workspace 1──* deal
workspace 1──* activity
workspace 1──* task
workspace 1──* tag
workspace 1──* field_definition
workspace 1──* custom_object_definition
workspace 1──* oauth_connection
workspace 1──* webhook
workspace 1──* workflow
workspace 1──* enrichment_source
workspace 1──* scoring_model

company 1──* contact              (contact.company_id → company.id, SET NULL on delete)
company 1──* deal                 (deal.company_id → company.id, SET NULL on delete)

pipeline 1──* deal                (deal.pipeline_id → pipeline.id, RESTRICT on delete)

user 1──* contact (owner)         (contact.owner_id → user.id, SET NULL on delete)
user 1──* company (owner)         (company.owner_id → user.id, SET NULL on delete)
user 1──* deal (owner)            (deal.owner_id → user.id, SET NULL on delete)
user 1──* task (assignee)         (task.assignee_id → user.id, SET NULL on delete)

contact 0..* ──* deal             (deal.contact_ids UUID[], application-level)
contact 1──* activity             (activity.contact_id → contact.id, SET NULL on delete)
company 1──* activity             (activity.company_id → company.id, SET NULL on delete)
deal 1──* activity                (activity.deal_id → deal.id, SET NULL on delete)

activity 1──0..1 ai_summary       (ai_summary.activity_id → activity.id, CASCADE)
contact 1──* ai_follow_up         (ai_follow_up.contact_id → contact.id, CASCADE)

custom_object_definition 1──* custom_object_record
```

## Core Entities

### workspace

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| name | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-safe identifier |
| plan | VARCHAR(50) | NOT NULL, default "free" | Tier: free, pro, enterprise |
| settings | JSONB | NOT NULL, default {} | excluded_domains, auto_apply_enrichment, enrichment_threshold |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

### user

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| email | VARCHAR(320) | NOT NULL | |
| full_name | VARCHAR(255) | NOT NULL | |
| avatar_url | TEXT | | |
| role | VARCHAR(50) | NOT NULL, default "member" | "admin" or "member" |
| is_active | BOOLEAN | NOT NULL, default true | |
| last_login_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: UNIQUE(workspace_id, email), INDEX(workspace_id)

**Role permissions**:
- **admin**: All actions including workspace settings, integrations, custom fields, webhooks, workflows, user management, MCP API keys
- **member**: CRUD on contacts, companies, deals, activities, tasks. Read-only on settings/integrations.

### contact

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| company_id | UUID | FK → company.id SET NULL | |
| first_name | VARCHAR(255) | | |
| last_name | VARCHAR(255) | | |
| full_name | VARCHAR(500) | NOT NULL | Display name |
| email | VARCHAR(320) | | Deduplicated within workspace |
| phone | VARCHAR(50) | | |
| job_title | VARCHAR(255) | | |
| city | VARCHAR(255) | | |
| country_code | CHAR(2) | | ISO 3166-1 alpha-2 |
| lifecycle_stage | VARCHAR(50) | default "lead" | lead, subscriber, opportunity, customer, evangelist, other |
| owner_id | UUID | FK → user.id SET NULL | |
| source | VARCHAR(100) | | email_sync, calendar_sync, csv_import, vcard_import, manual, enrichment |
| custom_fields | JSONB | NOT NULL, default {} | Validated against field_definitions |
| lead_score | NUMERIC(7,4) | | 0-100 |
| lead_score_label | VARCHAR(20) | | hot, warm, cool, cold |
| lead_score_updated_at | TIMESTAMPTZ | | |
| last_activity_at | TIMESTAMPTZ | | Denormalized for sort performance |
| email_count | INTEGER | default 0 | Denormalized counter |
| meeting_count | INTEGER | default 0 | Denormalized counter |
| search_vector | TSVECTOR | | Full-text search (weighted: A=name, B=email, C=title, D=city) |
| deleted_at | TIMESTAMPTZ | | Soft delete; NULL = active |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: INDEX(workspace_id), INDEX(workspace_id, email), INDEX(company_id), INDEX(owner_id), INDEX(workspace_id, lifecycle_stage), INDEX(workspace_id, last_name, first_name), INDEX(workspace_id, lead_score), GIN(search_vector)

### company

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| name | VARCHAR(500) | NOT NULL | |
| domain | VARCHAR(255) | | Enrichment lookup key |
| industry | VARCHAR(255) | | |
| employee_count | INTEGER | | |
| annual_revenue | BIGINT | | |
| revenue_currency | VARCHAR(3) | default "USD" | ISO 4217 |
| country_code | CHAR(2) | | |
| owner_id | UUID | FK → user.id SET NULL | |
| custom_fields | JSONB | NOT NULL, default {} | |
| contact_count | INTEGER | default 0 | Denormalized |
| open_deal_count | INTEGER | default 0 | Denormalized |
| total_deal_value | BIGINT | default 0 | Denormalized |
| last_activity_at | TIMESTAMPTZ | | |
| search_vector | TSVECTOR | | Full-text search |
| deleted_at | TIMESTAMPTZ | | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: INDEX(workspace_id), INDEX(workspace_id, domain), INDEX(workspace_id, name), GIN(search_vector)

### pipeline

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| is_default | BOOLEAN | NOT NULL, default false | One default per workspace |
| stages | JSONB | NOT NULL, default [] | Array of PipelineStage objects |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**PipelineStage shape** (validated at application layer):
```
{ id: UUID, name: string, order: number, probability: 0-100, type: "open" | "won" | "lost" }
```

**Default stages** (seeded on workspace creation): Qualification (10%), Discovery (25%), Proposal (50%), Negotiation (75%), Closed Won (100%), Closed Lost (0%).

### deal

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| pipeline_id | UUID | FK → pipeline.id RESTRICT, NOT NULL | |
| stage_id | UUID | NOT NULL | References stages JSONB; validated at application layer |
| company_id | UUID | FK → company.id SET NULL | |
| name | VARCHAR(500) | NOT NULL | |
| amount | BIGINT | | In smallest currency unit (cents) |
| currency | VARCHAR(3) | default "USD" | |
| expected_close_date | DATE | | |
| actual_close_date | DATE | | Set when stage.type = "won" or "lost" |
| owner_id | UUID | FK → user.id SET NULL | |
| source | VARCHAR(100) | | |
| priority | VARCHAR(20) | default "medium" | low, medium, high |
| custom_fields | JSONB | NOT NULL, default {} | |
| health_score | NUMERIC(7,4) | | 0-100 |
| health_label | VARCHAR(20) | | hot, warm, cool, cold |
| health_score_updated_at | TIMESTAMPTZ | | |
| contact_ids | UUID[] | default {} | Associated contacts |
| stage_entered_at | TIMESTAMPTZ | | Updated on stage change |
| last_activity_at | TIMESTAMPTZ | | |
| email_count | INTEGER | default 0 | |
| meeting_count | INTEGER | default 0 | |
| search_vector | TSVECTOR | | Full-text search |
| deleted_at | TIMESTAMPTZ | | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: INDEX(workspace_id), INDEX(pipeline_id), INDEX(stage_id), INDEX(company_id), INDEX(owner_id), INDEX(workspace_id, expected_close_date), INDEX(workspace_id, health_score), GIN(search_vector)

**State transitions**: When stage_id changes → validate stage exists in pipeline.stages → update stage_entered_at → write audit_log → if type="won"|"lost" set actual_close_date → update company.open_deal_count and company.total_deal_value.

### activity

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| activity_type | VARCHAR(50) | NOT NULL | email, meeting, call, note, stage_change |
| subject | VARCHAR(1000) | | |
| occurred_at | TIMESTAMPTZ | NOT NULL, default now() | |
| owner_id | UUID | FK → user.id SET NULL | |
| contact_id | UUID | FK → contact.id SET NULL | |
| company_id | UUID | FK → company.id SET NULL | |
| deal_id | UUID | FK → deal.id SET NULL | |
| detail | JSONB | NOT NULL, default {} | Type-specific payload (see below) |
| is_ai_generated | BOOLEAN | NOT NULL, default false | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: INDEX(workspace_id, occurred_at), INDEX(workspace_id, activity_type), INDEX(contact_id, occurred_at), INDEX(deal_id, occurred_at), INDEX(company_id, occurred_at)

**Detail JSONB by activity_type**:

- **email**: `{ message_id, thread_id, direction: "inbound"|"outbound", from: {email, name}, to: [{email, name}], cc: [{email, name}], body_text, has_attachments, attachment_names: [], provider: "gmail"|"outlook" }`
- **meeting**: `{ start_at, end_at, location, conference_url, attendees: [{email, name, status, contact_id}], provider: "google_calendar"|"outlook_calendar", provider_event_id }`
- **call**: `{ duration_seconds, outcome: "connected"|"voicemail"|"no_answer", direction: "inbound"|"outbound", notes }`
- **note**: `{ body_text, is_pinned }`
- **stage_change**: `{ from_stage_id, from_stage_name, to_stage_id, to_stage_name, pipeline_id }`

### task

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| title | VARCHAR(1000) | NOT NULL | |
| description | TEXT | | |
| due_at | TIMESTAMPTZ | | |
| completed_at | TIMESTAMPTZ | | |
| priority | VARCHAR(20) | default "medium" | |
| status | VARCHAR(20) | default "todo" | todo, in_progress, done |
| assignee_id | UUID | FK → user.id SET NULL | |
| contact_id | UUID | FK → contact.id SET NULL | |
| deal_id | UUID | FK → deal.id SET NULL | |
| is_ai_generated | BOOLEAN | NOT NULL, default false | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

## AI & Scoring Entities

### ai_summary

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| activity_id | UUID | FK → activity.id CASCADE, NOT NULL | |
| summary_type | VARCHAR(50) | NOT NULL | meeting_summary |
| content | JSONB | NOT NULL | { summary, key_points[], action_items[], sentiment, topics[] } |
| model_id | VARCHAR(100) | NOT NULL | LLM model identifier |
| confidence | NUMERIC(5,4) | | |
| reviewed_by | UUID | FK → user.id SET NULL | |
| reviewed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

### ai_follow_up

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| activity_id | UUID | FK → activity.id SET NULL | Source meeting |
| deal_id | UUID | FK → deal.id SET NULL | |
| contact_id | UUID | FK → contact.id CASCADE, NOT NULL | Recipient |
| subject | VARCHAR(1000) | | |
| body_text | TEXT | NOT NULL | Plain text draft |
| body_html | TEXT | | Rich text draft |
| status | VARCHAR(20) | default "draft" | draft, sent, discarded |
| model_id | VARCHAR(100) | NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| sent_at | TIMESTAMPTZ | | |
| sent_by | UUID | FK → user.id SET NULL | |

### scoring_model

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| model_type | VARCHAR(50) | NOT NULL | deal_health, lead_score |
| config | JSONB | NOT NULL, default {} | Feature names, thresholds, hyperparams |
| version | INTEGER | NOT NULL, default 1 | |
| is_active | BOOLEAN | NOT NULL, default false | Only one active per workspace+type |
| trained_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

### score_history

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| entity_type | VARCHAR(50) | NOT NULL | deal, contact |
| entity_id | UUID | NOT NULL | |
| model_id | UUID | FK → scoring_model.id CASCADE, NOT NULL | |
| score | NUMERIC(7,4) | NOT NULL | |
| label | VARCHAR(20) | | |
| features | JSONB | | Feature snapshot at scoring time |
| computed_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: INDEX(entity_type, entity_id, computed_at)

## Integration Entities

### oauth_connection

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| user_id | UUID | FK → user.id CASCADE, NOT NULL | |
| provider | VARCHAR(50) | NOT NULL | gmail, outlook, google_calendar, outlook_calendar |
| provider_user_id | VARCHAR(500) | | |
| access_token | TEXT | NOT NULL | AES-256-GCM encrypted |
| refresh_token | TEXT | | AES-256-GCM encrypted |
| token_expires_at | TIMESTAMPTZ | | |
| scopes | TEXT[] | | |
| sync_config | JSONB | NOT NULL, default {} | { last_history_id, last_delta_link, last_sync_at } |
| is_active | BOOLEAN | NOT NULL, default true | Set false on revocation |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: UNIQUE(workspace_id, user_id, provider)

## Enrichment Entities

### enrichment_source

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| source_type | VARCHAR(50) | NOT NULL | opencorporates, companies_house, sec_edgar |
| config | JSONB | NOT NULL, default {} | API keys, rate limits |
| gdpr_basis | VARCHAR(100) | | legitimate_interest, public_data |
| lia_document_url | TEXT | | Link to Legitimate Interest Assessment |
| is_active | BOOLEAN | NOT NULL, default true | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

### enrichment_log

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| source_id | UUID | FK → enrichment_source.id CASCADE, NOT NULL | |
| entity_type | VARCHAR(50) | NOT NULL | |
| entity_id | UUID | NOT NULL | |
| changes | JSONB | NOT NULL | { field: { old, new, confidence } } |
| source_url | TEXT | | Provenance URL |
| status | VARCHAR(20) | default "pending" | pending, accepted, rejected |
| enriched_at | TIMESTAMPTZ | NOT NULL, default now() | |
| reviewed_by | UUID | FK → user.id SET NULL | |
| reviewed_at | TIMESTAMPTZ | | |

**Indexes**: INDEX(entity_type, entity_id)

## Custom Field System

### field_definition

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| entity_type | VARCHAR(50) | NOT NULL | contact, company, deal, or custom object key |
| field_key | VARCHAR(100) | NOT NULL | Regex: ^[a-z][a-z0-9_]*$ |
| display_name | VARCHAR(255) | NOT NULL | |
| field_type | VARCHAR(50) | NOT NULL | text, number, currency, date, datetime, email, phone, url, select, multi_select, checkbox, user_reference, entity_reference, rich_text |
| description | TEXT | | |
| is_required | BOOLEAN | NOT NULL, default false | |
| is_unique | BOOLEAN | NOT NULL, default false | |
| default_value | JSONB | | |
| validation | JSONB | | JSON Schema for complex validation |
| options | JSONB | | For select/multi_select: [{ value, label, color }] |
| display_order | INTEGER | NOT NULL, default 0 | |
| group_name | VARCHAR(100) | | Visual grouping |
| is_system | BOOLEAN | NOT NULL, default false | Prevents deletion of built-in fields |
| gdpr_category | VARCHAR(50) | | personally_identifiable, sensitive, business, none |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: UNIQUE(workspace_id, entity_type, field_key), INDEX(workspace_id, entity_type)

### custom_object_definition

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| object_key | VARCHAR(100) | NOT NULL | Unique within workspace |
| display_name | VARCHAR(255) | NOT NULL | |
| display_name_plural | VARCHAR(255) | | |
| icon | VARCHAR(50) | | |
| description | TEXT | | |
| is_active | BOOLEAN | NOT NULL, default true | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: UNIQUE(workspace_id, object_key)

### custom_object_record

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| object_def_id | UUID | FK → custom_object_definition.id CASCADE, NOT NULL | |
| display_name | VARCHAR(500) | | |
| fields | JSONB | NOT NULL, default {} | Validated against field_definitions for object_key |
| owner_id | UUID | FK → user.id SET NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: INDEX(workspace_id, object_def_id)

## Automation Entities

### webhook

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| url | TEXT | NOT NULL | |
| events | TEXT[] | NOT NULL | Subscribed event types |
| secret | VARCHAR(255) | NOT NULL | HMAC-SHA256 signing secret |
| is_active | BOOLEAN | NOT NULL, default true | |
| config | JSONB | NOT NULL, default {} | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Webhook events**: contact.created, contact.updated, contact.deleted, company.created, company.updated, company.deleted, deal.created, deal.updated, deal.deleted, deal.stage_changed, activity.created, task.created, task.completed

### workflow

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| is_active | BOOLEAN | NOT NULL, default true | |
| definition | JSONB | NOT NULL | { trigger, steps[] } |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

### workflow_execution

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workflow_id | UUID | FK → workflow.id CASCADE, NOT NULL | |
| trigger_entity_type | VARCHAR(50) | | |
| trigger_entity_id | UUID | | |
| status | VARCHAR(20) | NOT NULL, default "running" | running, completed, failed |
| result | JSONB | | |
| started_at | TIMESTAMPTZ | NOT NULL, default now() | |
| completed_at | TIMESTAMPTZ | | |
| error | TEXT | | |

## Audit & Tagging

### audit_log

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| user_id | UUID | FK → user.id SET NULL | |
| action | VARCHAR(100) | NOT NULL | entity.verb format |
| entity_type | VARCHAR(50) | NOT NULL | |
| entity_id | UUID | NOT NULL | |
| changes | JSONB | | { field: { old, new } } |
| ip_address | INET | | |
| occurred_at | TIMESTAMPTZ | NOT NULL, default now() | |

Partitioned by quarter on `occurred_at` for performance at scale.

### tag

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default random | |
| workspace_id | UUID | FK → workspace.id CASCADE, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | |
| color | VARCHAR(7) | | Hex color |

**Indexes**: UNIQUE(workspace_id, name)

### entity_tag

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| tag_id | UUID | FK → tag.id CASCADE, NOT NULL | |
| entity_type | VARCHAR(50) | NOT NULL | |
| entity_id | UUID | NOT NULL | |

**Indexes**: PK(tag_id, entity_type, entity_id), INDEX(entity_type, entity_id)
