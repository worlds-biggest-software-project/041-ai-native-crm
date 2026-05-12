# Advanced Features Guide

This guide covers the power-user and administrator features of NativeCRM. It assumes you are comfortable with the basics covered in the Getting Started and Everyday Use guides.

---

## Table of Contents

1. [Custom Fields](#custom-fields)
2. [Custom Objects](#custom-objects)
3. [Enrichment Configuration](#enrichment-configuration)
4. [Webhook Setup](#webhook-setup)
5. [Workflow Automation](#workflow-automation)
6. [Reports and Analytics](#reports-and-analytics)
7. [API Integration](#api-integration)
8. [MCP Server](#mcp-server)
9. [Workspace Administration](#workspace-administration)
10. [Data Management](#data-management)

---

## Custom Fields

Custom fields let you add extra data points to contacts, companies, and deals beyond the built-in fields. Only workspace admins can create custom fields; all members can use them.

### Creating a Custom Field

1. Navigate to **Settings > Custom Fields**.
2. Select the entity type: **Contact**, **Company**, or **Deal**.
3. Click **+ Add Field**.
4. Configure the field:
   - **Label** -- The display name (e.g., "Contract Renewal Date").
   - **Field Key** -- Auto-generated from the label, used in the API (e.g., `contract_renewal_date`). You can customize this, but it cannot be changed after creation.
   - **Type** -- See the field types table below.
   - **Required** -- Whether the field must be filled in when creating or editing a record.
   - **Default Value** -- An optional default for new records.
   - **Description** -- A help text shown under the field in forms.
5. Click **Save**.

### Field Types

| Type | Description | Example |
|---|---|---|
| **Text** | Single-line free text, up to 500 characters. | "VP of Engineering" |
| **Number** | Integer or decimal value. Supports min/max constraints. | 42, 3.14 |
| **Date** | A calendar date (no time component). | 2026-03-15 |
| **Select** | Dropdown with predefined options. User picks one. | "Enterprise", "SMB", "Startup" |
| **Multi-Select** | Dropdown with predefined options. User picks one or more. | ["Feature A", "Feature B"] |
| **Boolean** | A toggle (yes/no, true/false). | true |

### Validation Rules

- **Text fields:** Optionally set a minimum and maximum character length, or a regex pattern (e.g., `^[A-Z]{2}-\d{4}$` for a code format like "AB-1234").
- **Number fields:** Optionally set minimum and maximum values.
- **Date fields:** Optionally restrict to past-only or future-only dates.
- **Select/Multi-Select:** Options are managed as an ordered list. You can add, remove, rename, and reorder options. Removing an option does not delete data from existing records -- it simply prevents new selections.

### Editing and Deleting Custom Fields

- To edit a field, go to **Settings > Custom Fields**, find the field, and click the edit icon. You can change the label, description, default value, required status, and validation rules. You cannot change the field key or type after creation.
- To delete a field, click the delete icon. You will be warned that all data stored in this field across all records will be permanently removed. This action cannot be undone.

### Using Custom Fields in the API

Custom fields are accessible through the API on the `custom_fields` property of any entity:

```json
{
  "id": "con_abc123",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "custom_fields": {
    "contract_renewal_date": "2026-03-15",
    "account_tier": "Enterprise"
  }
}
```

---

## Custom Objects

Custom objects let you create entirely new entity types beyond the built-in Contacts, Companies, and Deals. Use them when your business has concepts that don't fit neatly into the standard types.

### When to Use Custom Objects

Good candidates for custom objects:

- **Products** -- Track what you sell, link to deals.
- **Tickets** -- Support cases linked to contacts and companies.
- **Projects** -- Post-sale deliverables tied to deals.
- **Locations** -- Physical sites linked to companies.

### Creating a Custom Object

1. Navigate to **Settings > Custom Objects**.
2. Click **+ New Object**.
3. Configure the object:
   - **Name (singular)** -- e.g., "Product"
   - **Name (plural)** -- e.g., "Products"
   - **API Key** -- Auto-generated (e.g., `product`). Used in API paths: `/api/v1/products`.
   - **Primary Field** -- The main display field, usually a name or title. This is what appears in search results and relationship links.
   - **Icon** -- Choose an icon for the sidebar and UI.
4. Click **Create**.

### Adding Fields to Custom Objects

After creating the object, add fields using the same field editor as custom fields (see the Custom Fields section above). Every custom object automatically has:

- **ID** -- Auto-generated unique identifier.
- **Created At / Updated At** -- Timestamps.
- **Created By** -- The user who created the record.

### Defining Relationships

Custom objects can be related to built-in entities and to other custom objects.

1. In the custom object editor, go to the **Relationships** tab.
2. Click **+ Add Relationship**.
3. Configure:
   - **Related Entity** -- The entity type to link to (Contact, Company, Deal, or another custom object).
   - **Relationship Type:**
     - **Many-to-One** -- Each record of this object links to one record of the related entity (e.g., each Product belongs to one Company).
     - **Many-to-Many** -- Records can link to multiple records on both sides (e.g., Deals can have many Products, and Products can be on many Deals).
   - **Label** -- How the relationship is displayed (e.g., "Vendor" for a Company link).
4. Click **Save**.

Related records appear as a linked section on both sides of the relationship.

### Custom Objects in the API

Custom objects are available at `/api/v1/{object_plural_key}` and support the same CRUD operations, filtering, and pagination as built-in entities.

---

## Enrichment Configuration

NativeCRM can automatically enrich company and contact records with data from public sources -- company registries, domain information, and other business databases.

### Enabling Enrichment

1. Navigate to **Settings > Enrichment**.
2. You will see a list of available enrichment sources:
   - **OpenCorporates** -- Company registry data (legal name, jurisdiction, status, filing dates).
   - **Company Registries** -- Direct lookups from national registries.
   - **Domain Enrichment** -- Company data inferred from website domain.
3. Toggle on the sources you want to use.
4. Click **Save**.

Only workspace admins can enable or disable enrichment sources.

### Confidence Thresholds

Each enrichment result has a confidence score (0-100) indicating how certain the match is.

- **Auto-apply threshold** (default: 85) -- Results at or above this score are applied to the record automatically without human review.
- **Manual review threshold** (default: 50) -- Results between this score and the auto-apply threshold appear in a review queue for manual approval.
- Results below the manual review threshold are discarded.

You can adjust both thresholds at **Settings > Enrichment > Confidence Thresholds**.

### Auto-Apply Rules

Configure which fields are automatically updated when enrichment data is available:

1. Go to **Settings > Enrichment > Auto-Apply Rules**.
2. For each entity type, select which fields enrichment can overwrite:
   - **Never overwrite** -- Enrichment data is shown as a suggestion but never written automatically.
   - **Overwrite if empty** -- Only fill in blank fields.
   - **Always overwrite** -- Replace existing data with enrichment data (use with caution).
3. Click **Save**.

### Domain Exclusions

If you do not want enrichment to run on certain domains (e.g., personal email domains, competitor domains), add them to the exclusion list:

1. Go to **Settings > Enrichment > Exclusions**.
2. Add domains (e.g., `gmail.com`, `competitor.com`).
3. Click **Save**.

### GDPR Compliance

NativeCRM provides built-in tools for GDPR compliance related to enriched data:

- **Transparency Notices** -- When a record is enriched from public sources, a notice is attached to the record indicating the source, date, and data obtained. This can be included in data subject access requests.
- **Right to Erasure** -- When processing an erasure request, enriched data is included in the deletion. Go to the contact or company record and click **Process Erasure Request** to permanently delete all data, including enriched fields.
- **Audit Log** -- All enrichment actions are logged with timestamps, source, and the fields affected. Access the log at **Settings > Enrichment > Audit Log**.

---

## Webhook Setup

Webhooks allow NativeCRM to send real-time notifications to your systems when events occur. Use them to integrate with your own applications, trigger external workflows, or sync data with other platforms.

### Registering a Webhook Endpoint

1. Navigate to **Settings > Webhooks**.
2. Click **+ New Webhook**.
3. Configure:
   - **URL** -- The HTTPS endpoint that will receive the webhook payloads (e.g., `https://your-app.com/webhooks/nativecrm`).
   - **Events** -- Select which events trigger this webhook (see event types below).
   - **Secret** -- A shared secret for HMAC-SHA256 signature verification. NativeCRM generates one for you, or you can supply your own. Copy and store this securely -- it cannot be retrieved later.
   - **Active** -- Toggle to enable or disable the webhook.
4. Click **Save**.

### Event Types

| Event | Trigger |
|---|---|
| `contact.created` | A new contact is created (manual or auto-created). |
| `contact.updated` | A contact's fields are modified. |
| `contact.deleted` | A contact is soft-deleted. |
| `company.created` | A new company is created. |
| `company.updated` | A company's fields are modified. |
| `company.deleted` | A company is soft-deleted. |
| `deal.created` | A new deal is created. |
| `deal.updated` | A deal's fields are modified. |
| `deal.stage_changed` | A deal moves to a different pipeline stage. |
| `deal.deleted` | A deal is soft-deleted. |
| `activity.created` | A new activity (email, meeting, call, note) is logged. |
| `meeting.summary_generated` | An AI meeting summary is completed. |
| `enrichment.completed` | Enrichment data is applied to a record. |

### Payload Format

Webhook payloads are sent as HTTP POST requests with a JSON body:

```json
{
  "id": "evt_abc123",
  "event": "deal.stage_changed",
  "timestamp": "2026-05-12T14:30:00Z",
  "workspace_id": "ws_xyz789",
  "data": {
    "deal_id": "deal_def456",
    "deal_name": "Acme Corp -- Annual License",
    "previous_stage": "Proposal",
    "new_stage": "Negotiation",
    "changed_by": "user_ghi012"
  }
}
```

### HMAC-SHA256 Verification

Every webhook request includes an `X-NativeCRM-Signature` header containing an HMAC-SHA256 digest of the raw request body, signed with your webhook secret. Always verify this signature to ensure the request genuinely came from NativeCRM.

**Node.js verification example:**

```javascript
const crypto = require('crypto');

function verifyWebhook(rawBody, signatureHeader, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const trusted = Buffer.from(expectedSignature, 'hex');
  const provided = Buffer.from(signatureHeader, 'hex');

  return crypto.timingSafeEqual(trusted, provided);
}

// In your request handler:
app.post('/webhooks/nativecrm', (req, res) => {
  const isValid = verifyWebhook(
    req.rawBody,
    req.headers['x-nativecrm-signature'],
    process.env.NATIVECRM_WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process the event
  const event = JSON.parse(req.rawBody);
  console.log(`Received event: ${event.event}`);
  res.status(200).send('OK');
});
```

**Python verification example:**

```python
import hmac
import hashlib

def verify_webhook(raw_body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

### Retry Policy

If your endpoint returns a non-2xx status code or does not respond within 10 seconds, NativeCRM retries with exponential backoff:

| Attempt | Delay |
|---|---|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 30 minutes |
| 4th retry | 2 hours |
| 5th retry | 12 hours |

After 5 failed retries, the webhook is marked as **failing** and no further attempts are made for that event. The webhook remains active for new events. If 10 consecutive events fail, the webhook is automatically **disabled** and you receive an email notification.

### Debugging Webhooks

Go to **Settings > Webhooks**, click on a webhook, and open the **Delivery Log** tab. Here you can see:

- Every delivery attempt with timestamp, HTTP status, and response time.
- The full request payload and response body for each attempt.
- Retry history.
- A **Resend** button to manually re-deliver any failed event.

---

## Workflow Automation

Workflows let you automate actions based on events in NativeCRM. Each workflow is a rule made up of a trigger, optional conditions, and one or more actions.

### Creating a Workflow

1. Navigate to **Settings > Workflows**.
2. Click **+ New Workflow**.
3. Give the workflow a name (e.g., "Notify legal when deal reaches Negotiation").

### Triggers

A trigger is the event that starts the workflow. Available triggers:

| Trigger | Fires when... |
|---|---|
| **Deal Stage Changed** | A deal moves to a specified stage. |
| **Contact Created** | A new contact is created. |
| **Deal Created** | A new deal is created. |
| **Deal Value Changed** | A deal's value is modified. |
| **Activity Logged** | An activity (email, call, meeting, note) is recorded. |
| **Health Score Changed** | A deal's health score crosses a threshold. |
| **Field Updated** | A specific field on any entity changes. |
| **Enrichment Completed** | Enrichment data is applied to a record. |

### Conditions

Conditions narrow when the workflow fires. They are optional -- if no conditions are set, the workflow fires for every matching trigger.

Example conditions:

- Deal value is greater than $50,000.
- Contact company industry is "Technology."
- Deal stage changed to "Negotiation" (not just any stage change).
- Health score dropped below 25.

Conditions support standard operators: equals, not equals, greater than, less than, contains, does not contain, is empty, is not empty.

Multiple conditions can be combined with AND/OR logic.

### Actions

Actions are what happens when the trigger fires and conditions are met. Available actions:

| Action | What it does |
|---|---|
| **Create Task** | Creates a task assigned to a specified user or the deal owner. |
| **Send Email Notification** | Sends an email to a specified user or email address. |
| **Update Field** | Sets a field on the triggered record to a specified value. |
| **Move Deal to Stage** | Changes the deal's pipeline stage. |
| **Create Activity** | Logs a note or other activity on the triggered record. |
| **Trigger Webhook** | Sends a webhook to a specified URL (separate from the webhook system). |
| **Assign Owner** | Changes the owner of a contact, company, or deal. |

Multiple actions can be chained in sequence. They execute in the order listed.

### Execution Order and Error Handling

- Workflows are evaluated in the order they were created. If multiple workflows match the same trigger, they all fire.
- If an action fails (e.g., a webhook URL is unreachable), the workflow logs the error and continues to the next action. It does not retry failed actions automatically.
- Workflow execution logs are available at **Settings > Workflows > [Workflow Name] > Execution Log**.
- Workflows do not trigger other workflows (no cascading). This prevents infinite loops.

### Examples

**Example 1: Legal review for large deals**

- Trigger: Deal Stage Changed
- Condition: New stage is "Negotiation" AND deal value > $25,000
- Action: Create Task -- "Legal review required" assigned to legal@yourcompany.com

**Example 2: Alert on cold deals**

- Trigger: Health Score Changed
- Condition: Health score dropped below 25
- Action: Send Email Notification to deal owner -- "Deal {deal_name} has gone cold"

**Example 3: Auto-assign new contacts**

- Trigger: Contact Created
- Condition: Contact company industry is "Healthcare"
- Action: Assign Owner -- Set to "Sarah (Healthcare Sales Lead)"

---

## Reports and Analytics

NativeCRM includes built-in reports to help you understand your sales performance.

### Available Report Types

#### Pipeline Analytics
- **Pipeline Value by Stage** -- Total deal value in each pipeline stage.
- **Pipeline Velocity** -- Average time deals spend in each stage.
- **Stage Conversion Rates** -- Percentage of deals that advance from one stage to the next.
- **Pipeline Trends** -- How your total pipeline value has changed over time.

#### Conversion Funnels
- **Full Funnel** -- Visualize deals from Qualification through Closed Won, with drop-off percentages at each stage.
- **Time-to-Close** -- Distribution of how long deals take to close.
- **Win Rate** -- Percentage of deals that close as Won vs. Lost, with breakdowns by rep, company size, or deal value.

#### Activity Metrics
- **Activity Volume** -- Total emails, meetings, calls, and notes per day/week/month.
- **Activity by Type** -- Breakdown of activity types.
- **Response Time** -- Average time to respond to inbound emails.
- **Engagement Score** -- Average deal health scores across your pipeline.

#### Rep Performance
- **Deals by Rep** -- Number and value of deals per team member.
- **Activity by Rep** -- Activity counts per team member.
- **Win Rate by Rep** -- Close rates for each team member.
- **Quota Attainment** -- Progress toward targets (if quotas are configured).

### Filtering and Date Ranges

All reports support:

- **Date range** -- Predefined (this week, this month, this quarter, this year) or custom range.
- **Rep filter** -- View data for a specific team member or the whole team.
- **Stage filter** -- Include or exclude specific stages.
- **Value filter** -- Minimum and/or maximum deal value.

### Exporting Reports

Click the **Export** button on any report to download the data:

- **CSV** -- Raw data in comma-separated format. Good for further analysis in Excel or Google Sheets.
- **JSON** -- Structured data for programmatic use.
- **PDF** -- A formatted report suitable for sharing or printing.

---

## API Integration

NativeCRM provides a full REST API for programmatic access to all data and functionality.

### Authentication

All API requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer your_api_token_here
```

Generate API tokens at **Settings > API > API Tokens**. Tokens inherit the permissions of the user who created them. You can create multiple tokens with descriptive names and revoke them individually.

### Base URL

```
https://api.nativecrm.com/api/v1
```

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/contacts` | List contacts (paginated) |
| POST | `/contacts` | Create a contact |
| GET | `/contacts/:id` | Get a contact by ID |
| PUT | `/contacts/:id` | Update a contact |
| DELETE | `/contacts/:id` | Soft-delete a contact |
| GET | `/companies` | List companies (paginated) |
| POST | `/companies` | Create a company |
| GET | `/companies/:id` | Get a company by ID |
| PUT | `/companies/:id` | Update a company |
| DELETE | `/companies/:id` | Soft-delete a company |
| GET | `/deals` | List deals (paginated) |
| POST | `/deals` | Create a deal |
| GET | `/deals/:id` | Get a deal by ID |
| PUT | `/deals/:id` | Update a deal |
| DELETE | `/deals/:id` | Soft-delete a deal |
| GET | `/activities` | List activities (paginated) |
| POST | `/activities` | Create an activity (note, call) |
| GET | `/{custom_object_plural}` | List custom object records |
| POST | `/{custom_object_plural}` | Create a custom object record |

### Pagination

List endpoints return paginated results:

```
GET /api/v1/contacts?page=1&per_page=50
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 342,
    "total_pages": 7
  }
}
```

Default page size is 25. Maximum is 100.

### Filtering

List endpoints support query parameter filters:

```
GET /api/v1/contacts?email=jane@example.com
GET /api/v1/deals?stage=Negotiation&value_gte=10000
GET /api/v1/contacts?custom_fields.account_tier=Enterprise
```

Supported operators (appended to field name):

| Suffix | Operator | Example |
|---|---|---|
| (none) | Equals | `stage=Proposal` |
| `_gte` | Greater than or equal | `value_gte=10000` |
| `_lte` | Less than or equal | `value_lte=50000` |
| `_gt` | Greater than | `health_score_gt=75` |
| `_lt` | Less than | `health_score_lt=25` |
| `_contains` | Contains substring | `name_contains=Smith` |
| `_not` | Not equals | `stage_not=Closed Lost` |

### Rate Limits

- **Standard plan:** 100 requests per minute.
- **Professional plan:** 500 requests per minute.
- **Enterprise plan:** 2,000 requests per minute.

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1716048060
```

When rate limited, you receive a `429 Too Many Requests` response. Wait until the reset timestamp before retrying.

### Error Codes

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request -- invalid parameters or payload. |
| 401 | Unauthorized -- missing or invalid API token. |
| 403 | Forbidden -- token does not have permission for this action. |
| 404 | Not found -- the requested resource does not exist. |
| 409 | Conflict -- duplicate or conflicting data (e.g., duplicate email). |
| 422 | Unprocessable entity -- validation failed (check the `errors` array in the response). |
| 429 | Rate limited -- too many requests. |
| 500 | Internal server error -- contact support if this persists. |

Error responses include a structured body:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The request could not be processed.",
    "errors": [
      {
        "field": "email",
        "message": "Email address is already in use."
      }
    ]
  }
}
```

### OpenAPI Documentation

Full interactive API documentation is available at:

```
https://api.nativecrm.com/docs
```

This is an OpenAPI 3.0 spec with a built-in "Try it" interface for testing requests directly from your browser.

---

## MCP Server

NativeCRM includes a Model Context Protocol (MCP) server, allowing AI assistants (such as Claude, or any MCP-compatible client) to interact with your CRM data in a structured, controlled way.

### Connecting an AI Assistant

1. Navigate to **Settings > MCP**.
2. Copy the **MCP Server URL** (e.g., `https://mcp.nativecrm.com/ws/{workspace_id}`).
3. Generate an **MCP API Key** (separate from REST API tokens for security isolation).
4. In your AI assistant's configuration, add NativeCRM as an MCP server using the URL and API key.

### Available Resources

MCP resources provide read-only access to CRM data:

| Resource | URI Pattern | Description |
|---|---|---|
| Contact | `nativecrm://contacts/{id}` | Full contact record with custom fields. |
| Company | `nativecrm://companies/{id}` | Full company record with linked contacts. |
| Deal | `nativecrm://deals/{id}` | Deal record with stage, value, and health score. |
| Activity Timeline | `nativecrm://activities/{entity_type}/{id}` | Activity feed for a specific record. |
| Pipeline Summary | `nativecrm://pipeline/summary` | Aggregate pipeline metrics. |

### Available Tools

MCP tools allow AI assistants to take actions in your CRM:

| Tool | Description |
|---|---|
| `search_contacts` | Search contacts by name, email, or company. |
| `search_deals` | Search deals by name, stage, or value range. |
| `create_note` | Add a note to a contact, company, or deal. |
| `update_deal_stage` | Move a deal to a new pipeline stage. |
| `get_deal_health` | Retrieve the health score and contributing factors for a deal. |
| `list_upcoming_meetings` | Get scheduled meetings for a contact or date range. |

### Available Prompts

MCP prompts are pre-built templates for common AI workflows:

| Prompt | Description |
|---|---|
| `prepare_for_meeting` | Generates a meeting prep brief from contact history and deal status. |
| `draft_follow_up` | Creates a follow-up email draft based on the latest meeting summary. |
| `pipeline_review` | Produces a narrative summary of the current pipeline with recommendations. |
| `deal_risk_assessment` | Analyzes a specific deal's health indicators and suggests actions. |

### Security

- MCP API keys have read-only access by default. You can grant write access (for tools like `create_note` and `update_deal_stage`) in **Settings > MCP > Permissions**.
- All MCP interactions are logged in the audit trail.
- MCP keys can be revoked at any time without affecting REST API tokens.

---

## Workspace Administration

### User Management

1. Navigate to **Settings > Workspace > Members**.
2. To invite a new user, click **+ Invite Member**, enter their email address, and select their role.
3. The invited user receives an email with a link to join the workspace.

### Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access to all features, settings, integrations, and data. Can invite/remove users, manage billing, configure enrichment, webhooks, and workflows. |
| **Member** | Full access to contacts, companies, deals, activities, reports, and search. Cannot access workspace settings, integrations, or administrative features. |

### Workspace Settings

At **Settings > Workspace > General**, admins can configure:

- **Workspace Name** -- The display name for the workspace.
- **Default Currency** -- Used for deal values across the workspace.
- **Time Zone** -- The default time zone for reports and timestamps.
- **Fiscal Year Start** -- Aligns quarterly reports to your fiscal calendar.

### Integration Connections

Manage all external service connections at **Settings > Integrations**:

- **Email** -- Connect or disconnect Gmail and Outlook accounts.
- **Calendar** -- Connect or disconnect Google Calendar and Outlook Calendar.
- **Enrichment Sources** -- Enable or disable data enrichment providers.

Each integration shows its current status (connected, disconnected, error) and the last sync time.

---

## Data Management

### Import Formats

NativeCRM supports CSV import for contacts, companies, and deals.

**CSV requirements:**

- UTF-8 encoding.
- Header row required (column names in the first row).
- Maximum file size: 10 MB (approximately 50,000 rows).
- Supported delimiters: comma (`,`), semicolon (`;`), tab.

**Column mapping:**

During import, NativeCRM shows a mapping interface where you match your CSV columns to CRM fields (including custom fields). The system auto-detects common column names (e.g., "First Name," "Email," "Company Name") and suggests mappings.

**Duplicate handling:**

- For contacts, the email address is used as the unique identifier.
- For companies, the domain is used as the unique identifier.
- When a duplicate is detected, you can choose to: skip, overwrite, or merge (fill in empty fields only).

### Export Options

Export data from any list view or report:

- **CSV** -- Standard comma-separated values. Compatible with Excel, Google Sheets, and most tools.
- **JSON** -- Structured JSON array. Useful for developer integrations or scripts.

To export:

1. Navigate to the list or report you want to export.
2. Apply any filters you want (the export respects active filters).
3. Click the **Export** button.
4. Choose the format.
5. The file downloads to your browser. For large datasets, you may receive a download link by email.

### Bulk Operations

From any list view (Contacts, Companies, Deals), you can select multiple records and perform bulk actions:

- **Bulk Delete** -- Soft-delete all selected records.
- **Bulk Update** -- Change a field value across all selected records (e.g., set owner to "Sarah" for 50 contacts).
- **Bulk Export** -- Export only the selected records.
- **Bulk Tag** -- Add or remove tags (if your workspace uses tagging via custom fields).

Select records using checkboxes, or click **Select All** to select all records matching current filters (not just the visible page).

### Soft Delete and Recovery

When you delete a record in NativeCRM, it is **soft-deleted** -- it disappears from normal views but is not permanently destroyed.

- Soft-deleted records are retained for **90 days**.
- To view deleted records, go to the entity list (e.g., Contacts) and toggle the **Show Deleted** filter.
- To recover a deleted record, find it in the deleted view and click **Restore**.
- After 90 days, soft-deleted records are permanently purged and cannot be recovered.
- Admins can permanently delete records immediately at **Settings > Data Management > Purge Records**, bypassing the 90-day retention. Use with caution.

### Data Subject Erasure (GDPR)

For GDPR erasure requests:

1. Navigate to the contact's profile.
2. Click the **Privacy** tab.
3. Click **Process Erasure Request**.
4. NativeCRM will permanently delete:
   - The contact record and all custom field data.
   - All activities associated solely with that contact.
   - All enrichment data and audit entries.
   - References in deal associations (the deal itself is retained but the contact link is removed).
5. This action is irreversible and is logged in the compliance audit trail.
