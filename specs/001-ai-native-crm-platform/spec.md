# Feature Specification: AI-Native CRM Platform

**Feature Branch**: `001-ai-native-crm-platform`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "Build an open-source, AI-first CRM platform that eliminates manual data entry through intelligent pipeline population from email and calendar data, combined with ML-driven deal scoring, LLM-powered meeting summaries, GDPR-safe enrichment, and a native MCP server for AI assistant integration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sales Rep Manages Contacts, Companies, and Deals (Priority: P1)

A sales rep logs in with their Google or Microsoft account, sees a dashboard with their pipeline, and manages the core CRM records. They create and edit contacts and companies, manage deals on a Kanban pipeline board by dragging them across stages (Qualification, Discovery, Proposal, Negotiation, Closed Won, Closed Lost), and view detail pages for any record. Custom fields defined by their workspace admin appear alongside standard fields.

**Why this priority**: Without core CRM entity management and a usable pipeline board, no other feature has value. This is the foundational experience that all AI features build upon.

**Independent Test**: Can be fully tested by creating a workspace, logging in, adding contacts/companies/deals, and dragging deals across pipeline stages. Delivers a usable pipeline management tool.

**Acceptance Scenarios**:

1. **Given** a user with valid Google credentials, **When** they sign in via OAuth, **Then** they see the dashboard with their pipeline board and navigation sidebar.
2. **Given** an authenticated user, **When** they create a contact with name, email, and company, **Then** the contact appears in the contact list and on the company's detail page.
3. **Given** a pipeline board with deals in various stages, **When** the rep drags a deal from "Discovery" to "Proposal," **Then** the deal moves immediately (optimistic update), the stage entry timestamp updates, and the stage column totals recalculate.
4. **Given** a deal moved to "Closed Won," **When** the stage transition completes, **Then** the actual close date is set to today and the associated company's deal totals update.

---

### User Story 2 - Zero-Entry Pipeline Population via Email and Calendar Sync (Priority: P1)

A sales rep connects their Gmail or Outlook inbox and calendar. The system automatically syncs emails and calendar events from the past 30 days and continues syncing incrementally. New contacts are auto-created from email correspondents not already in the CRM. Meeting events are logged as activities with attendee mapping. The rep no longer needs to manually enter interaction data.

**Why this priority**: Zero-entry data capture is the core innovation and primary differentiator. Without it, this is just another CRM with manual data entry.

**Independent Test**: Can be fully tested by connecting an inbox, verifying that contacts are auto-created from email senders/recipients, and confirming that calendar meetings appear as activities linked to the correct contacts and deals.

**Acceptance Scenarios**:

1. **Given** a rep connects their Gmail account, **When** the initial sync completes, **Then** emails from the last 30 days appear as activities, and unknown email addresses result in new contact records with source "email_sync."
2. **Given** an active email sync connection, **When** a new email arrives, **Then** it appears in the CRM activity timeline within 5 minutes.
3. **Given** a connected Google Calendar, **When** a meeting with external attendees occurs, **Then** a meeting activity is created with attendee emails matched to existing contacts (or new contacts created).
4. **Given** a rep connects their Outlook account, **When** the sync completes, **Then** the same contact and activity creation behavior occurs as with Gmail.

---

### User Story 3 - AI-Generated Meeting Summaries and Follow-Up Drafts (Priority: P2)

After a synced meeting concludes, the system automatically generates a structured summary with key discussion points, action items, sentiment assessment, and topics. The rep can view the summary on the deal's AI Insights tab and request a follow-up email draft that incorporates the meeting's action items and deal context. The rep can edit the draft before sending.

**Why this priority**: LLM-powered summaries and follow-ups are the second major AI differentiator and directly reduce rep admin time by an estimated 30-50%. They depend on email and calendar sync being functional.

**Independent Test**: Can be fully tested by having a synced meeting with associated email context, triggering summary generation, reviewing the structured output, and generating/editing/sending a follow-up draft.

**Acceptance Scenarios**:

1. **Given** a past meeting activity with associated email context, **When** the system generates a summary, **Then** the output includes a 2-3 sentence summary, key points, action items with assignees, sentiment, and topics.
2. **Given** a meeting summary with action items, **When** the system processes the summary, **Then** tasks are auto-created with the correct assignees and due dates, marked as AI-generated.
3. **Given** a completed meeting summary, **When** the rep clicks "Generate Follow-Up," **Then** a draft email appears with a subject line and body referencing the meeting's action items and deal context.
4. **Given** a follow-up draft, **When** the rep edits and clicks "Send," **Then** the email is sent and an outbound email activity is logged.

---

### User Story 4 - ML-Based Deal Health and Lead Scoring (Priority: P2)

Every active deal displays a health score (0-100) derived from communication engagement signals: email response velocity, meeting acceptance rates, conversation depth, and stage progression speed. Every contact displays a lead score based on similar engagement patterns. Scores update automatically when new activities occur and are batch-rescored daily. A heuristic fallback operates when insufficient training data exists.

**Why this priority**: Scoring transforms the CRM from a record-keeping system into a predictive sales tool. It depends on having activity data from sync but significantly increases the value of the pipeline board.

**Independent Test**: Can be fully tested by creating deals with varying activity patterns and verifying that health scores reflect engagement levels (active deals score higher than stale ones). Score badges appear on pipeline board cards and detail pages.

**Acceptance Scenarios**:

1. **Given** a deal with active email exchanges and recent meetings, **When** the scoring pipeline runs, **Then** the deal health score is above 50 and labeled "warm" or "hot."
2. **Given** a deal with no activity for 14 days, **When** the scoring pipeline runs, **Then** the deal health score is below 25 and labeled "cold."
3. **Given** a new activity logged for a deal, **When** the activity is saved, **Then** the deal health score is recomputed within 5 seconds.
4. **Given** a workspace with fewer than 50 closed deals, **When** scoring runs, **Then** the heuristic fallback is used instead of the ML model.

---

### User Story 5 - Activity Timeline and Global Search (Priority: P2)

Every contact, company, and deal detail page shows a unified activity timeline displaying all interactions (emails, meetings, calls, notes, stage changes) in chronological order with appropriate icons and detail extraction. A global search (accessible via command palette with keyboard shortcut) searches across all contacts, companies, and deals with ranked results.

**Why this priority**: The activity timeline makes synced data actionable by giving reps a complete interaction history. Global search enables fast navigation across the CRM. Both are essential for daily usability.

**Independent Test**: Can be fully tested by viewing a contact with mixed activity types and verifying correct rendering, then using the command palette to search across entity types.

**Acceptance Scenarios**:

1. **Given** a contact with emails, meetings, and notes, **When** the rep views the contact's Activity tab, **Then** all activities appear in reverse chronological order with type-specific icons and detail.
2. **Given** an email activity, **When** displayed in the timeline, **Then** it shows direction (inbound/outbound), subject, and a truncated body preview.
3. **Given** the user presses the keyboard shortcut for search, **When** they type a contact name, **Then** results appear grouped by type with clickable links to detail pages.
4. **Given** a search for a company domain, **When** results load, **Then** the matching company and all contacts at that company appear.

---

### User Story 6 - GDPR-Safe Contact and Company Enrichment (Priority: P3)

A workspace admin enables enrichment sources (OpenCorporates, public company registries) in settings. When new contacts or companies are created, the system enriches them from public, permissioned data sources with auditable provenance. High-confidence enrichments are auto-applied; lower-confidence ones queue for manual review. Full GDPR Article 14 transparency notices are generated, and right-to-erasure requests are supported.

**Why this priority**: Enrichment adds data quality value but is not required for core CRM operation. Its privacy-first design is a differentiator for European and regulated-industry buyers.

**Independent Test**: Can be fully tested by enabling an enrichment source, creating a company with a known domain, and verifying that enriched fields (industry, employee count) appear with source attribution.

**Acceptance Scenarios**:

1. **Given** enrichment is enabled with OpenCorporates, **When** a company is created with domain "acme.com," **Then** the enrichment worker populates industry and employee count with source URL attribution.
2. **Given** an enrichment with confidence below the auto-apply threshold, **When** the enrichment completes, **Then** the change is queued as "pending" for manual review in the enrichment log.
3. **Given** a contact subject to GDPR, **When** the admin requests an Article 14 transparency notice, **Then** the system generates a document listing all enrichment sources, dates, and legal basis.
4. **Given** an erasure request for a contact, **When** processed, **Then** all enriched data is reverted, AI summaries mentioning the contact are removed, and an audit log entry is created.

---

### User Story 7 - Webhooks and Workflow Automation (Priority: P3)

A workspace admin configures outbound webhooks to receive notifications for CRM events (contact created, deal stage changed, etc.) with HMAC-signed payloads and automatic retry. They also build trigger-condition-action workflows (e.g., "when deal moves to Negotiation, create a task for legal review") using a workflow builder in settings.

**Why this priority**: Webhooks and workflows enable integration with external systems and internal automation. They extend the CRM's value but are not required for core operation.

**Independent Test**: Can be fully tested by registering a webhook URL, triggering a CRM event, and verifying the signed payload is delivered. Workflows can be tested by creating a trigger-action rule and confirming the action executes.

**Acceptance Scenarios**:

1. **Given** a webhook registered for "deal.stage_changed," **When** a deal moves stages, **Then** the webhook endpoint receives an HMAC-signed POST with the deal data and stage change details.
2. **Given** a webhook endpoint returns HTTP 500, **When** delivery fails, **Then** the system retries 3 times with exponential backoff (30s, 120s, 600s).
3. **Given** a workflow "on deal stage_changed to Negotiation, create task for legal review," **When** a deal enters Negotiation, **Then** a task titled "Legal review" is created and assigned to the deal owner.
4. **Given** a workflow with a condition step, **When** the condition evaluates false, **Then** the "else" branch executes instead of the "then" branch.

---

### User Story 8 - MCP Server for AI Assistant Integration (Priority: P3)

The CRM ships a native Model Context Protocol server accessible via HTTP. AI assistants (Claude, ChatGPT, Cursor) can connect with an API key and browse CRM records as resources, execute write operations as tools (create contact, move deal stage, log activity, search), and invoke prompt templates (meeting prep briefing, deal summary, follow-up draft). The workspace admin generates and manages MCP API keys in settings.

**Why this priority**: MCP is the emerging standard for AI-CRM connectivity and a key differentiator. It makes the CRM natively accessible to the AI assistant ecosystem without custom integration code.

**Independent Test**: Can be fully tested by connecting an MCP client with a valid API key, listing available resources/tools/prompts, reading a contact resource, and calling the create_contact tool.

**Acceptance Scenarios**:

1. **Given** a valid MCP API key, **When** an MCP client connects, **Then** it receives the list of available resources (contacts, deals, companies, activities), tools, and prompts.
2. **Given** an MCP client reads `crm://contacts`, **Then** it receives a JSON array of contacts scoped to the authenticated workspace.
3. **Given** an MCP client calls `create_contact` with name and email, **Then** a contact is created in the workspace and a confirmation is returned.
4. **Given** an MCP client requests the `meeting_prep` prompt with a contactId, **Then** it receives a formatted prompt containing the contact's relationship history, open action items, and suggested talking points.

---

### User Story 9 - Custom Fields and Custom Objects (Priority: P3)

A workspace admin defines custom fields on contacts, companies, and deals (text, number, currency, date, select, multi-select, checkbox, entity reference, etc.) through a settings page. Custom fields appear on entity forms and detail pages alongside standard fields. Admins can also create entirely new custom object types (e.g., Invoices, Subscriptions) with their own field schemas, which appear in the sidebar navigation.

**Why this priority**: Custom fields and objects enable the CRM to adapt to each team's unique sales process, following Attio's flexible data model approach. Not required for core operation but essential for real-world adoption.

**Independent Test**: Can be fully tested by creating a custom field "Contract Value" (currency type) on deals, then creating a deal and verifying the field appears and validates correctly.

**Acceptance Scenarios**:

1. **Given** an admin creates a required "Contract Value" currency field on deals, **When** a rep creates a deal without filling it, **Then** a validation error is shown.
2. **Given** a select field with options A, B, C, **When** displayed on a deal form, **Then** a dropdown shows exactly those three options.
3. **Given** an admin creates a custom object "Invoices" with fields, **When** the sidebar reloads, **Then** "Invoices" appears in navigation and records can be created.
4. **Given** a custom field is deleted, **When** existing records are viewed, **Then** the field data is preserved (no data loss) but the field no longer appears on forms.

---

### User Story 10 - Reporting Dashboard and Data Import/Export (Priority: P3)

The CRM dashboard shows pipeline analytics: deal value by stage (funnel chart), win rate, average deal cycle time, health score distribution, activity volume trends, and a stale deals table. Users can import contacts from vCard (.vcf) and CSV files with field mapping, and export contacts/companies/deals as CSV. The public REST API publishes an OpenAPI 3.1 specification.

**Why this priority**: Reporting provides pipeline visibility for managers. Import/export enables data migration from existing CRMs. Both are essential for production use but not for core MVP functionality.

**Independent Test**: Can be fully tested by loading the dashboard with seed data and verifying charts render correctly, then importing a CSV of contacts and confirming they appear in the contact list.

**Acceptance Scenarios**:

1. **Given** a workspace with 30 deals across stages, **When** the dashboard loads, **Then** the funnel chart shows deal count and value per stage, and win rate is computed from closed deals.
2. **Given** a CSV file with 100 contacts, **When** uploaded with column mapping, **Then** 100 contacts are created with duplicates merged by email address.
3. **Given** a vCard (.vcf) file with contact entries, **When** imported, **Then** contacts are created with name, email, phone, title, and company matched/created from ORG field.
4. **Given** a GET request to `/api/v1/openapi.json`, **Then** a valid OpenAPI 3.1 document is returned describing all REST endpoints.

---

### Edge Cases

- What happens when an email sync encounters a rate limit from Gmail or Microsoft Graph? The system respects rate limits with backoff and resumes on the next polling interval without data loss.
- How does the system handle duplicate contacts created by simultaneous email and calendar sync? Contacts are deduplicated by email address within a workspace; the second sync merges into the existing record.
- What happens when an OAuth token refresh fails (e.g., user revoked access)? The connection is marked inactive, sync jobs stop, and the user is notified to re-authorize.
- How does the pipeline board handle concurrent drag operations from two users on the same deal? The last write wins with optimistic UI; if the server rejects the move, the card snaps back to its server-side position.
- What happens when the LLM service is unavailable during summary generation? The job is retried with exponential backoff; the meeting activity is still visible without a summary, with a "Summary pending" indicator.
- How does the system handle a workspace with thousands of deals on the pipeline board? The board paginates within each stage column, loading additional deal cards on scroll.
- What happens when a custom field definition is changed (e.g., type changed from text to number) while existing records have data? Type changes are restricted to compatible conversions; incompatible changes require creating a new field.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide contact, company, and deal record management with standard relational fields and workspace-scoped custom fields. Deletion is soft delete by default (records hidden but recoverable for 30 days); hard delete is reserved for GDPR erasure requests.
- **FR-002**: System MUST authenticate users via OAuth 2.0 (Google, Microsoft) with JWT session strategy and workspace-scoped access.
- **FR-003**: System MUST provide a visual Kanban pipeline board with configurable stages, drag-and-drop deal movement, and optimistic UI updates.
- **FR-004**: System MUST sync emails bidirectionally from Gmail (via Gmail API) and Outlook (via Microsoft Graph API) using OAuth 2.0, with incremental sync and push/change notifications. Email body is stored as plain text (HTML stripped); attachments are referenced by name and size but not stored.
- **FR-005**: System MUST sync calendar events from Google Calendar and Outlook Calendar, mapping attendees to CRM contacts.
- **FR-006**: System MUST auto-create contact records from email correspondents and meeting attendees not already in the workspace, deduplicating by email address. Users can configure excluded domain(s) (e.g., their own organization) to prevent internal emails from creating contacts or logging activities.
- **FR-007**: System MUST encrypt OAuth tokens at rest using AES-256-GCM and refresh tokens before expiry.
- **FR-008**: System MUST generate structured meeting summaries (key points, action items, sentiment, topics) from synced meeting context using an LLM.
- **FR-009**: System MUST generate follow-up email drafts based on meeting summaries and deal context, editable before sending.
- **FR-010**: System MUST auto-create tasks from meeting summary action items, marked as AI-generated.
- **FR-011**: System MUST compute deal health scores (0-100) from communication engagement signals with ML model inference or heuristic fallback.
- **FR-012**: System MUST compute lead scores for contacts based on engagement patterns.
- **FR-013**: System MUST recompute scores on new activity, stage change, and daily batch.
- **FR-014**: System MUST provide a unified activity timeline on contact, company, and deal detail pages showing all interaction types in chronological order.
- **FR-015**: System MUST provide full-text search across contacts, companies, and deals accessible via command palette.
- **FR-016**: System MUST enrich contacts and companies from permissioned public data sources (OpenCorporates, company registries) with confidence scoring and provenance tracking.
- **FR-017**: System MUST support GDPR Article 14 transparency notices, right-to-erasure with data reversion, and Legitimate Interest Assessment documentation for enrichment.
- **FR-018**: System MUST allow workspace admins to define custom fields (14 types including text, number, currency, date, select, multi-select, checkbox, entity reference, rich text) and custom object types.
- **FR-019**: System MUST validate custom field values against field definitions at the application layer.
- **FR-020**: System MUST deliver outbound webhooks for CRM events with HMAC-SHA256 signatures, retry on failure, and delivery logging.
- **FR-021**: System MUST support trigger-condition-action workflows with steps for creating tasks, updating fields, sending notifications, waiting, and calling webhooks.
- **FR-022**: System MUST expose a Model Context Protocol server with CRM records as resources, write operations as tools, and reusable prompt templates.
- **FR-023**: System MUST provide a public REST API at `/api/v1/*` with Bearer token authentication, cursor-based pagination, and standard HTTP verbs.
- **FR-024**: System MUST publish an auto-generated OpenAPI 3.1 specification.
- **FR-025**: System MUST support vCard (.vcf RFC 6350) and CSV import with field mapping and deduplication, plus CSV export.
- **FR-026**: System MUST provide pipeline analytics: deal value by stage, win rate, deal velocity, health score distribution, and activity volume trends.
- **FR-027**: System MUST write audit log entries for all record creation, update, deletion, and stage changes.
- **FR-028**: System MUST enforce workspace isolation on all queries — records from one workspace are never visible to another.
- **FR-029**: System MUST process background jobs (email sync, calendar sync, AI summarization, scoring, enrichment, webhook dispatch) via a task queue with rate limiting and retry.
- **FR-030**: System MUST support role-based access control with admin and member roles per workspace. Members can create, read, update, and delete CRM records (contacts, companies, deals, activities, tasks). Admin-only actions: workspace settings, integrations (OAuth connections, enrichment sources), custom field/object definitions, webhooks, workflows, user management, and MCP API key generation.

### Key Entities

- **Workspace**: A tenant boundary that isolates all CRM data. Has a plan tier, settings, and one or more users.
- **User**: A person with access to a workspace. Has a role (admin, member), email, and can own contacts, companies, and deals.
- **Contact**: A person in the CRM. Linked to a company, has standard fields (name, email, phone, title, lifecycle stage) plus custom fields. Carries a lead score.
- **Company**: An organization in the CRM. Has contacts, deals, standard fields (name, domain, industry, employee count, revenue) plus custom fields.
- **Pipeline**: A configurable sequence of stages (each with name, order, probability, and type: open/won/lost) through which deals progress.
- **Deal**: A sales opportunity. Belongs to a pipeline and stage, linked to a company and contacts. Carries a health score, amount, expected close date, and custom fields.
- **Activity**: A recorded interaction (email, meeting, call, note, stage change). Linked to a contact, company, and/or deal. Has a type-specific detail payload.
- **Task**: An action item assigned to a user, optionally linked to a contact and deal. Can be AI-generated from meeting summaries.
- **AI Summary**: A structured meeting summary (key points, action items, sentiment, topics) generated by an LLM, linked to a meeting activity.
- **AI Follow-Up**: A draft follow-up email generated by an LLM, linked to a contact, deal, and activity.
- **OAuth Connection**: An encrypted OAuth 2.0 token set connecting a user's email/calendar provider to the workspace for sync.
- **Field Definition**: A metadata record describing a custom field (type, validation, options) for an entity type within a workspace.
- **Custom Object Definition**: A workspace-defined entity type with its own field schema and records.
- **Enrichment Source**: A configured external data source for contact/company enrichment with GDPR basis documentation.
- **Enrichment Log**: An auditable record of each enrichment change with source URL, confidence, and review status.
- **Scoring Model**: An ML or heuristic model configuration for deal health or lead scoring, with version and training metadata.
- **Webhook**: A registered endpoint URL subscribed to specific CRM events within a workspace.
- **Workflow**: A trigger-condition-action automation definition stored as structured data.
- **Audit Log**: An immutable record of data changes with user, entity, action, and change details.
- **Tag**: A user-defined label that can be applied to any entity type (polymorphic tagging).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sales reps spend less than 5 minutes per day on manual CRM data entry after connecting email and calendar sync (down from industry average of 30-60 minutes).
- **SC-002**: 95% of email correspondents and meeting attendees are automatically matched to existing contacts or created as new contacts within 5 minutes of the interaction.
- **SC-003**: Deal health scores correctly predict won/lost outcomes with at least 70% accuracy after 50+ closed deals provide training data.
- **SC-004**: Meeting summaries are generated within 30 seconds of a meeting ending and contain actionable information (key points, action items) in at least 90% of cases.
- **SC-005**: Users can complete core CRM tasks (create contact, move deal, view timeline) within 3 clicks or less from the dashboard.
- **SC-006**: The system supports 50 concurrent users per workspace without noticeable performance degradation.
- **SC-007**: All enrichment data has auditable provenance — every enriched field can be traced to its source URL and timestamp.
- **SC-008**: MCP-connected AI assistants can read CRM data and perform write operations with the same access controls as the web UI.
- **SC-009**: Contact import from CSV/vCard processes 1,000 records in under 60 seconds with correct deduplication.
- **SC-010**: The pipeline dashboard loads in under 2 seconds with up to 500 active deals across all stages.

## Clarifications

### Session 2026-05-12

- Q: How are workspaces created — self-service signup, admin-provisioned, or invitation-only? → A: Admin-provisioned only — workspaces are created by a system operator or deployment admin.
- Q: What actions are restricted to admin role vs member role? → A: Members can manage records (CRUD contacts, companies, deals, activities) but admin-only for settings, integrations, custom fields, webhooks, workflows, and user management.
- Q: How much email content is stored — metadata only, plain text, or full HTML+attachments? → A: Full plain-text body stored; HTML stripped; attachments referenced but not stored.
- Q: Should record deletion be soft delete (recoverable) or hard delete (permanent)? → A: Soft delete by default (records hidden but recoverable for 30 days); hard delete available for GDPR erasure requests.
- Q: Can users control which emails are synced, or is everything captured? → A: Sync all emails but allow users to exclude their own organization's domain(s) from contact auto-creation and activity logging.

## Assumptions

- Target users are B2B SaaS sales teams (Series B-D, 50-500 employees) and SMB founders, with basic familiarity with CRM concepts.
- Users have stable internet connectivity; offline mode is out of scope for the initial release.
- Gmail and Outlook are the only email/calendar providers supported in the initial release; other providers (Yahoo, IMAP-only) are out of scope.
- The system operates as a multi-tenant application with workspace isolation; single-tenant self-hosted deployment is a future consideration.
- Workspaces are admin-provisioned only (created by a system operator or deployment admin); there is no self-service signup flow. Users are added to workspaces by an admin.
- OAuth 2.0 is the only supported authentication mechanism for third-party integrations; API key auth is supported for the public REST API and MCP.
- English is the only supported language for AI-generated summaries and follow-up drafts in the initial release.
- The ML scoring model requires at least 50 closed deals (won + lost) in a workspace before it can be trained; the heuristic fallback operates below this threshold.
- Data retention follows standard SaaS practices; configurable retention policies are a future enhancement.
- The development plan's 12-phase structure and technology stack (TypeScript, Next.js 15, PostgreSQL 16, Drizzle ORM, tRPC, BullMQ, Claude SDK, ONNX Runtime) are accepted as the implementation foundation.
- Phases 8 (Enrichment), 9 (Custom Fields), 10 (Webhooks/Workflows), and 11 (MCP) can be developed in parallel after Phase 2, as documented in the development plan's dependency graph.
