# NativeCRM API Reference

## Overview

NativeCRM exposes two API surfaces for programmatic access:

- **REST API** (`/api/v1/*`) -- Public API for third-party integrations, authenticated with Bearer tokens.
- **tRPC API** (`/api/trpc/*`) -- Internal API used by the NativeCRM web frontend, authenticated with Auth.js JWT sessions.

Additionally, the **MCP Server** (`/api/mcp`) provides AI assistant integration via the Model Context Protocol.

---

## REST API

### Base URL

```
https://your-instance.example.com/api/v1
```

### Versioning

The API is versioned via the URL path (`/api/v1/`). Breaking changes will be introduced under a new version prefix (`/api/v2/`). Non-breaking additions (new fields, new endpoints) may be added to the current version.

### Authentication

All REST API requests require a Bearer token in the `Authorization` header.

**Token format:** `workspace_id:secret`

- `workspace_id` -- UUID of the target workspace.
- `secret` -- Matches the `API_SECRET` environment variable.

```
Authorization: Bearer a1b2c3d4-e5f6-7890-abcd-ef1234567890:your-api-secret
```

**Obtaining a token:**
1. A workspace admin generates an MCP/API key from Settings > Integrations.
2. The key is displayed once and must be stored securely.
3. Include the key as a Bearer token in all API requests.

An invalid or missing token returns `401 Unauthorized`.

### Common Patterns

#### Response Envelope

**Success (list):**
```json
{
  "data": [ ... ],
  "nextCursor": "uuid-of-last-item"
}
```

**Success (single):**
```json
{
  "id": "uuid",
  "fullName": "Jane Smith",
  ...
}
```

**Error:**
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

#### Pagination

Cursor-based pagination using the `id` of the last item in the result set.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | UUID | -- | ID of the last item from the previous page |
| `limit` | integer | 50 | Page size (1-100) |

The response includes `nextCursor` which is `null` when there are no more results.

**Example:**
```bash
# First page
curl -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/contacts?limit=25"

# Next page
curl -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/contacts?limit=25&cursor=abc-123"
```

#### Filtering

List endpoints accept query parameters for filtering:

```
GET /api/v1/contacts?lifecycleStage=lead&ownerId=uuid
GET /api/v1/deals?pipelineId=uuid&stageId=uuid
GET /api/v1/activities?contactId=uuid&activityType=email
```

#### Sorting

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | `createdAt` | Field to sort by (varies per endpoint) |
| `sortOrder` | `asc` or `desc` | `desc` | Sort direction |

#### Soft Delete

DELETE requests perform a soft delete by default (sets `deletedAt` timestamp). Soft-deleted records:
- Are excluded from list queries.
- Return `404` on direct GET requests.
- Are recoverable for 30 days.
- Are permanently deleted (hard delete) only for GDPR erasure requests.

#### Timestamps

All timestamps are in ISO 8601 format with UTC timezone: `2026-05-12T14:30:00.000Z`

### Rate Limiting

Rate limits are applied per IP address: **100 requests per 60-second window**.

Rate limit status is returned in response headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds until the client may retry (only on 429) |

When the limit is exceeded, the API returns `429 Too Many Requests`.

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success (GET, PATCH) |
| `201` | Created (POST) |
| `204` | Deleted (DELETE) |
| `400` | Validation error (Zod schema failure) |
| `401` | Missing or invalid authentication |
| `403` | Insufficient permissions |
| `404` | Resource not found or soft-deleted |
| `409` | Conflict (duplicate unique field) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

### Contacts

#### List Contacts

```
GET /api/v1/contacts
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | UUID | -- | Pagination cursor |
| `limit` | integer | 50 | Page size (1-100) |
| `search` | string | -- | Full-text search on name (max 500 chars) |
| `lifecycleStage` | enum | -- | Filter: `lead`, `subscriber`, `opportunity`, `customer`, `evangelist`, `other` |
| `ownerId` | UUID | -- | Filter by owner user ID |
| `companyId` | UUID | -- | Filter by company ID |
| `sortBy` | enum | `createdAt` | `fullName`, `email`, `createdAt`, `updatedAt`, `lastActivityAt`, `leadScore` |
| `sortOrder` | enum | `desc` | `asc` or `desc` |

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/contacts?limit=25&lifecycleStage=lead&sortBy=lastActivityAt"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "workspaceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "firstName": "Jane",
      "lastName": "Smith",
      "fullName": "Jane Smith",
      "email": "jane@acme.com",
      "phone": "+1-555-0123",
      "jobTitle": "VP Engineering",
      "city": "San Francisco",
      "countryCode": "US",
      "lifecycleStage": "lead",
      "companyId": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
      "ownerId": "b2c3d4e5-f678-90ab-cdef-1234567890ab",
      "source": "email_sync",
      "customFields": {},
      "leadScore": "45.5000",
      "leadScoreLabel": "warm",
      "leadScoreUpdatedAt": "2026-05-12T10:00:00.000Z",
      "lastActivityAt": "2026-05-12T09:30:00.000Z",
      "emailCount": 12,
      "meetingCount": 3,
      "deletedAt": null,
      "createdAt": "2026-04-15T08:00:00.000Z",
      "updatedAt": "2026-05-12T09:30:00.000Z"
    }
  ],
  "nextCursor": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

#### Create Contact

```
POST /api/v1/contacts
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | Yes | Display name (1-500 chars) |
| `firstName` | string | No | First name (max 255) |
| `lastName` | string | No | Last name (max 255) |
| `email` | string | No | Email address (max 320, validated format) |
| `phone` | string | No | Phone number (max 50) |
| `jobTitle` | string | No | Job title (max 255) |
| `city` | string | No | City (max 255) |
| `countryCode` | string | No | ISO 3166-1 alpha-2 country code (exactly 2 chars) |
| `lifecycleStage` | enum | No | `lead` (default), `subscriber`, `opportunity`, `customer`, `evangelist`, `other` |
| `companyId` | UUID | No | Associated company |
| `ownerId` | UUID | No | Owner user |
| `source` | string | No | Record source (max 100) |
| `customFields` | object | No | Key-value pairs matching custom field definitions |

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@acme.com",
    "phone": "+1-555-0123",
    "jobTitle": "VP Engineering",
    "companyId": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
    "lifecycleStage": "lead",
    "source": "manual",
    "customFields": { "contract_value": 50000 }
  }' \
  "https://crm.example.com/api/v1/contacts"
```

**Example Response (201 Created):**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "workspaceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "firstName": "Jane",
  "lastName": "Smith",
  "fullName": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "+1-555-0123",
  "jobTitle": "VP Engineering",
  "city": null,
  "countryCode": null,
  "lifecycleStage": "lead",
  "companyId": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
  "ownerId": null,
  "source": "manual",
  "customFields": { "contract_value": 50000 },
  "leadScore": null,
  "leadScoreLabel": null,
  "leadScoreUpdatedAt": null,
  "lastActivityAt": null,
  "emailCount": 0,
  "meetingCount": 0,
  "deletedAt": null,
  "createdAt": "2026-05-12T14:30:00.000Z",
  "updatedAt": "2026-05-12T14:30:00.000Z"
}
```

#### Get Contact by ID

```
GET /api/v1/contacts/:id
```

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/contacts/f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**Response:** Full contact object (same schema as create response). Returns `404` if not found or soft-deleted.

#### Update Contact

```
PATCH /api/v1/contacts/:id
```

Partial update -- only include the fields you want to change.

**Request Body:** Same fields as create, all optional. To clear a nullable field, set it to `null`.

**Example Request:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "CTO",
    "lifecycleStage": "opportunity"
  }' \
  "https://crm.example.com/api/v1/contacts/f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**Response (200):** Updated contact object.

#### Delete Contact

```
DELETE /api/v1/contacts/:id
```

Performs a soft delete (sets `deletedAt`).

**Example Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/contacts/f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**Response:** `204 No Content`

---

### Companies

#### List Companies

```
GET /api/v1/companies
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | UUID | -- | Pagination cursor |
| `limit` | integer | 50 | Page size (1-100) |
| `search` | string | -- | Full-text search on name (max 500 chars) |
| `sortBy` | enum | `createdAt` | `name`, `createdAt`, `updatedAt`, `lastActivityAt` |
| `sortOrder` | enum | `desc` | `asc` or `desc` |

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/companies?search=acme&limit=10"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
      "workspaceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Acme Corp",
      "domain": "acme.com",
      "industry": "Technology",
      "employeeCount": 250,
      "annualRevenue": 50000000,
      "revenueCurrency": "USD",
      "countryCode": "US",
      "ownerId": "b2c3d4e5-f678-90ab-cdef-1234567890ab",
      "customFields": {},
      "contactCount": 5,
      "openDealCount": 2,
      "totalDealValue": 150000,
      "lastActivityAt": "2026-05-12T09:30:00.000Z",
      "deletedAt": null,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-05-12T09:30:00.000Z"
    }
  ],
  "nextCursor": null
}
```

#### Create Company

```
POST /api/v1/companies
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Company name (1-500 chars) |
| `domain` | string | No | Company domain (max 255) |
| `industry` | string | No | Industry (max 255) |
| `employeeCount` | integer | No | Number of employees (non-negative) |
| `annualRevenue` | integer | No | Annual revenue in smallest currency unit (non-negative) |
| `revenueCurrency` | string | No | ISO 4217 currency code (3 chars, default "USD") |
| `countryCode` | string | No | ISO 3166-1 alpha-2 (2 chars) |
| `ownerId` | UUID | No | Owner user |
| `customFields` | object | No | Custom field key-value pairs |

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "domain": "acme.com",
    "industry": "Technology",
    "employeeCount": 250,
    "countryCode": "US"
  }' \
  "https://crm.example.com/api/v1/companies"
```

**Response (201 Created):** Full company object.

#### Get Company by ID

```
GET /api/v1/companies/:id
```

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/companies/c3d4e5f6-7890-abcd-ef12-34567890abcd"
```

**Response (200):** Full company object.

#### Update Company

```
PATCH /api/v1/companies/:id
```

Partial update. Same fields as create, all optional.

**Example Request:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCount": 300,
    "industry": "Enterprise Software"
  }' \
  "https://crm.example.com/api/v1/companies/c3d4e5f6-7890-abcd-ef12-34567890abcd"
```

**Response (200):** Updated company object.

#### Delete Company

```
DELETE /api/v1/companies/:id
```

**Response:** `204 No Content`

---

### Deals

#### List Deals

```
GET /api/v1/deals
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | UUID | -- | Pagination cursor |
| `limit` | integer | 50 | Page size (1-100) |
| `pipelineId` | UUID | -- | Filter by pipeline |
| `stageId` | UUID | -- | Filter by stage |
| `ownerId` | UUID | -- | Filter by owner |
| `sortBy` | enum | `createdAt` | `name`, `amount`, `createdAt`, `updatedAt`, `expectedCloseDate`, `healthScore` |
| `sortOrder` | enum | `desc` | `asc` or `desc` |

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/deals?pipelineId=uuid&sortBy=amount&sortOrder=desc"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "d4e5f678-90ab-cdef-1234-567890abcdef",
      "workspaceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "pipelineId": "p1p2p3p4-5678-90ab-cdef-1234567890ab",
      "stageId": "s1s2s3s4-5678-90ab-cdef-1234567890ab",
      "companyId": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
      "name": "Acme Enterprise License",
      "amount": 5000000,
      "currency": "USD",
      "expectedCloseDate": "2026-06-30",
      "actualCloseDate": null,
      "ownerId": "b2c3d4e5-f678-90ab-cdef-1234567890ab",
      "source": "inbound",
      "priority": "high",
      "customFields": {},
      "healthScore": "72.5000",
      "healthLabel": "warm",
      "healthScoreUpdatedAt": "2026-05-12T06:00:00.000Z",
      "contactIds": [
        "f47ac10b-58cc-4372-a567-0e02b2c3d479"
      ],
      "stageEnteredAt": "2026-05-10T14:00:00.000Z",
      "lastActivityAt": "2026-05-12T09:30:00.000Z",
      "emailCount": 8,
      "meetingCount": 2,
      "deletedAt": null,
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-05-12T09:30:00.000Z"
    }
  ],
  "nextCursor": "d4e5f678-90ab-cdef-1234-567890abcdef"
}
```

#### Create Deal

```
POST /api/v1/deals
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Deal name (1-500 chars) |
| `pipelineId` | UUID | Yes | Pipeline to place the deal in |
| `stageId` | UUID | Yes | Initial stage (must exist in pipeline) |
| `companyId` | UUID | No | Associated company |
| `amount` | integer | No | Deal value in smallest currency unit (cents) |
| `currency` | string | No | ISO 4217 (3 chars, default "USD") |
| `expectedCloseDate` | string | No | ISO 8601 date (`YYYY-MM-DD`) |
| `ownerId` | UUID | No | Deal owner |
| `source` | string | No | Lead source (max 100) |
| `priority` | enum | No | `low`, `medium` (default), `high` |
| `contactIds` | UUID[] | No | Associated contact IDs |
| `customFields` | object | No | Custom field key-value pairs |

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Enterprise License",
    "pipelineId": "p1p2p3p4-5678-90ab-cdef-1234567890ab",
    "stageId": "s1s2s3s4-5678-90ab-cdef-1234567890ab",
    "companyId": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
    "amount": 5000000,
    "currency": "USD",
    "expectedCloseDate": "2026-06-30",
    "priority": "high",
    "contactIds": ["f47ac10b-58cc-4372-a567-0e02b2c3d479"]
  }' \
  "https://crm.example.com/api/v1/deals"
```

**Response (201 Created):** Full deal object.

#### Get Deal by ID

```
GET /api/v1/deals/:id
```

**Response (200):** Full deal object.

#### Update Deal

```
PATCH /api/v1/deals/:id
```

Partial update. Include only fields to change.

**Stage Move:** To move a deal to a different stage, include `stageId` in the request body. This triggers stage transition logic:
1. Validates the new stage exists in the deal's pipeline.
2. Updates `stageEnteredAt` to current timestamp.
3. Writes an audit log entry.
4. If the new stage type is `won` or `lost`, sets `actualCloseDate` to today.
5. Updates denormalized company counters (`openDealCount`, `totalDealValue`).

**Example Request (Stage Move):**
```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stageId": "new-stage-uuid"
  }' \
  "https://crm.example.com/api/v1/deals/d4e5f678-90ab-cdef-1234-567890abcdef"
```

**Response (200):** Updated deal object.

#### Delete Deal

```
DELETE /api/v1/deals/:id
```

**Response:** `204 No Content`

---

### Pipelines

#### List Pipelines

```
GET /api/v1/pipelines
```

Returns all pipelines in the workspace.

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/pipelines"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "p1p2p3p4-5678-90ab-cdef-1234567890ab",
      "workspaceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Sales Pipeline",
      "isDefault": true,
      "stages": [
        { "id": "s001", "name": "Qualification", "order": 0, "probability": 10, "type": "open" },
        { "id": "s002", "name": "Discovery", "order": 1, "probability": 25, "type": "open" },
        { "id": "s003", "name": "Proposal", "order": 2, "probability": 50, "type": "open" },
        { "id": "s004", "name": "Negotiation", "order": 3, "probability": 75, "type": "open" },
        { "id": "s005", "name": "Closed Won", "order": 4, "probability": 100, "type": "won" },
        { "id": "s006", "name": "Closed Lost", "order": 5, "probability": 0, "type": "lost" }
      ],
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

#### Create Pipeline (Admin Only)

```
POST /api/v1/pipelines
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Pipeline name |
| `stages` | array | Yes | Array of stage objects |

Each stage object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Stage identifier |
| `name` | string | Yes | Stage name (1-255 chars) |
| `order` | integer | Yes | Display order (0-based) |
| `probability` | integer | Yes | Win probability (0-100) |
| `type` | enum | Yes | `open`, `won`, or `lost` |

**Response (201 Created):** Full pipeline object.

#### Update Pipeline (Admin Only)

```
PATCH /api/v1/pipelines/:id
```

**Request Body:** `name` and/or `stages` (same schema as create).

**Response (200):** Updated pipeline object.

---

### Activities

#### List Activities

```
GET /api/v1/activities
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | UUID | -- | Pagination cursor |
| `limit` | integer | 25 | Page size (1-100) |
| `contactId` | UUID | -- | Filter by contact |
| `companyId` | UUID | -- | Filter by company |
| `dealId` | UUID | -- | Filter by deal |
| `activityType` | string | -- | Filter: `email`, `meeting`, `call`, `note`, `stage_change` |

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/activities?contactId=uuid&activityType=email&limit=10"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "a1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e6",
      "workspaceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "activityType": "email",
      "subject": "Re: Proposal for Enterprise License",
      "occurredAt": "2026-05-12T09:30:00.000Z",
      "ownerId": null,
      "contactId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "companyId": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
      "dealId": "d4e5f678-90ab-cdef-1234-567890abcdef",
      "detail": {
        "message_id": "<abc123@mail.gmail.com>",
        "thread_id": "thread-xyz",
        "direction": "inbound",
        "from": { "email": "jane@acme.com", "name": "Jane Smith" },
        "to": [{ "email": "sales@ourcompany.com", "name": "Sales Team" }],
        "cc": [],
        "body_text": "Thanks for the proposal. We'd like to discuss the pricing...",
        "has_attachments": false,
        "attachment_names": [],
        "provider": "gmail"
      },
      "isAiGenerated": false,
      "createdAt": "2026-05-12T09:31:00.000Z",
      "updatedAt": "2026-05-12T09:31:00.000Z"
    }
  ],
  "nextCursor": "a1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e6"
}
```

#### Create Activity

```
POST /api/v1/activities
```

Create a manual activity (note, call). Email and meeting activities are created automatically by sync workers.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activityType` | string | Yes | `note`, `call` (1-50 chars) |
| `subject` | string | No | Subject line (max 1000) |
| `occurredAt` | string | No | ISO 8601 datetime (defaults to now) |
| `contactId` | UUID | No | Associated contact |
| `companyId` | UUID | No | Associated company |
| `dealId` | UUID | No | Associated deal |
| `detail` | object | No | Type-specific detail payload |

**Detail payload by activity type:**

**call:**
```json
{
  "duration_seconds": 1200,
  "outcome": "connected",
  "direction": "outbound",
  "notes": "Discussed pricing tiers."
}
```

**note:**
```json
{
  "body_text": "Met at the conference. Very interested in our enterprise plan.",
  "is_pinned": false
}
```

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "note",
    "subject": "Conference follow-up",
    "contactId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "dealId": "d4e5f678-90ab-cdef-1234-567890abcdef",
    "detail": {
      "body_text": "Met at SaaStr. Very interested in enterprise plan.",
      "is_pinned": true
    }
  }' \
  "https://crm.example.com/api/v1/activities"
```

**Response (201 Created):** Full activity object.

#### Get Activity by ID

```
GET /api/v1/activities/:id
```

**Response (200):** Full activity object.

---

### Search

```
GET /api/v1/search
```

Searches across contacts, companies, and deals.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | -- | Search query (1-200 chars, required) |
| `types` | string | -- | Comma-separated: `contact`, `company`, `deal` |
| `limit` | integer | 10 | Max results (1-50) |

**Example Request:**
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://crm.example.com/api/v1/search?q=acme&types=contact,company&limit=10"
```

**Example Response:**
```json
{
  "data": [
    { "type": "company", "id": "c3d4e5f6-...", "title": "Acme Corp", "subtitle": "acme.com" },
    { "type": "contact", "id": "f47ac10b-...", "title": "Jane Smith", "subtitle": "jane@acme.com" }
  ]
}
```

---

### OpenAPI Specification

```
GET /api/v1/openapi.json
```

Returns a machine-readable OpenAPI 3.1 specification document describing all REST API endpoints, request/response schemas, and authentication requirements. Auto-generated from the Zod validation schemas.

---

## tRPC API Reference

The tRPC API is the internal API used by the NativeCRM web frontend. It is served at `/api/trpc/[trpc]` with SuperJSON serialization.

Authentication is via Auth.js JWT session cookies (not Bearer tokens). Access is restricted to authenticated users with a valid workspace membership.

### Middleware Levels

| Level | Description |
|-------|-------------|
| `publicProcedure` | No authentication (health check only) |
| `protectedProcedure` | Requires valid session; injects `ctx.workspaceId` and `ctx.userRole` |
| `adminProcedure` | Extends protected; requires `role === "admin"` |

### Router Index

The application composes 17 domain routers plus a health check endpoint:

| Router | Auth Level | Procedures |
|--------|------------|------------|
| `health` | public | `health` (query) |
| `contacts` | protected | `list`, `getById`, `create`, `update`, `delete` |
| `companies` | protected | `list`, `getById`, `create`, `update`, `delete` |
| `deals` | protected | `list`, `getById`, `create`, `update`, `delete`, `moveStage` |
| `pipelines` | protected / admin | `list` (protected), `create`, `update` (admin) |
| `activities` | protected | `timeline`, `create` |
| `search` | protected | `global` |
| `ai` | protected | `getSummary`, `generateSummary`, `reviewSummary`, `getFollowUp`, `generateFollowUp`, `sendFollowUp` |
| `scoring` | protected | `getDealHealth`, `getLeadScore`, `rescore` |
| `enrichment` | protected | `enrich`, `getLog`, `reviewEnrichment` |
| `sync` | protected | `getConnections`, `initiateOAuth`, `revokeConnection` |
| `webhooks` | admin | `list`, `create`, `update`, `delete` |
| `workflows` | admin | `list`, `create`, `update`, `delete`, `getExecutions` |
| `customFields` | protected / admin | `list` (protected), `create`, `update`, `delete`, `reorder` (admin) |
| `customObjects` | admin | (object definition CRUD) |
| `reports` | protected | `pipelineSummary`, `activityVolume`, `staleDeals` |
| `export` | protected | `contactsCsv`, `contactsVcard`, `companiesCsv`, `dealsCsv` |
| `settings` | admin | `getWorkspace`, `updateWorkspace`, `listUsers`, `inviteUser`, `updateUserRole`, `deactivateUser`, `generateMcpKey` |

### Procedure Details

#### contacts

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `list` | query | `{ cursor?, limit?, search?, lifecycleStage?, ownerId?, sortBy?, sortOrder? }` | `{ items: Contact[], nextCursor: string \| null }` |
| `getById` | query | `{ id: UUID }` | `Contact` (with company relation) |
| `create` | mutation | `CreateContactInput` | `Contact` |
| `update` | mutation | `{ id: UUID, ...PartialContactInput }` | `Contact` |
| `delete` | mutation | `{ id: UUID }` | `{ success: true }` |

#### companies

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `list` | query | `{ cursor?, limit?, search?, sortBy?, sortOrder? }` | `{ items: Company[], nextCursor }` |
| `getById` | query | `{ id: UUID }` | `Company` (with contact count, deal summary) |
| `create` | mutation | `CreateCompanyInput` | `Company` |
| `update` | mutation | `{ id: UUID, ...PartialCompanyInput }` | `Company` |
| `delete` | mutation | `{ id: UUID }` | `{ success: true }` |

#### deals

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `list` | query | `{ pipelineId?, stageId?, cursor?, limit?, sortBy?, sortOrder? }` | `{ items: Deal[], nextCursor }` |
| `getById` | query | `{ id: UUID }` | `Deal` (with company, contacts, stage history) |
| `create` | mutation | `CreateDealInput` | `Deal` |
| `update` | mutation | `{ id: UUID, ...PartialDealInput }` | `Deal` |
| `delete` | mutation | `{ id: UUID }` | `{ success: true }` |
| `moveStage` | mutation | `{ id: UUID, stageId: UUID }` | `Deal` |

#### pipelines

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `list` | query | -- | `Pipeline[]` |
| `create` | mutation | `{ name, stages }` | `Pipeline` (admin only) |
| `update` | mutation | `{ id: UUID, name?, stages? }` | `Pipeline` (admin only) |

#### activities

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `timeline` | query | `{ contactId?, dealId?, companyId?, cursor?, limit?, activityType? }` | `{ items: Activity[], nextCursor }` |
| `create` | mutation | `{ activityType, subject, contactId?, dealId?, detail }` | `Activity` |

#### ai

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `getSummary` | query | `{ activityId: UUID }` | `AiSummary \| null` |
| `generateSummary` | mutation | `{ activityId: UUID }` | `{ jobId: string }` |
| `reviewSummary` | mutation | `{ summaryId: UUID, approved: boolean }` | `AiSummary` |
| `getFollowUp` | query | `{ activityId: UUID }` | `AiFollowUp \| null` |
| `generateFollowUp` | mutation | `{ activityId: UUID, contactId: UUID }` | `{ jobId: string }` |
| `sendFollowUp` | mutation | `{ followUpId: UUID }` | `AiFollowUp` |

#### scoring

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `getDealHealth` | query | `{ dealId: UUID }` | `{ score, label, updatedAt, trend, history[] }` |
| `getLeadScore` | query | `{ contactId: UUID }` | `{ score, label, updatedAt }` |
| `rescore` | mutation | `{ entityType, entityId }` | `{ jobId: string }` |

#### enrichment

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `enrich` | mutation | `{ entityType, entityId }` | `{ jobId: string }` |
| `getLog` | query | `{ entityType, entityId }` | `EnrichmentLogEntry[]` |
| `reviewEnrichment` | mutation | `{ logId: UUID, status: "accepted" \| "rejected" }` | `EnrichmentLogEntry` |

#### sync

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `getConnections` | query | -- | `OAuthConnection[]` |
| `initiateOAuth` | mutation | `{ provider }` | `{ authUrl: string }` |
| `revokeConnection` | mutation | `{ connectionId: UUID }` | `{ success: true }` |

#### webhooks (admin only)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `list` | query | -- | `Webhook[]` |
| `create` | mutation | `{ url, events[] }` | `Webhook` (with generated secret) |
| `update` | mutation | `{ id, url?, events?, isActive? }` | `Webhook` |
| `delete` | mutation | `{ id: UUID }` | `{ success: true }` |

#### workflows (admin only)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `list` | query | -- | `Workflow[]` |
| `create` | mutation | `{ name, definition }` | `Workflow` |
| `update` | mutation | `{ id, name?, definition?, isActive? }` | `Workflow` |
| `delete` | mutation | `{ id: UUID }` | `{ success: true }` |
| `getExecutions` | query | `{ workflowId: UUID }` | `WorkflowExecution[]` |

#### customFields (admin only for mutations)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `list` | query | `{ entityType }` | `FieldDefinition[]` |
| `create` | mutation | `CreateFieldDefinitionInput` | `FieldDefinition` |
| `update` | mutation | `{ id, ...PartialFieldDefinitionInput }` | `FieldDefinition` |
| `delete` | mutation | `{ id: UUID }` | `{ success: true }` |
| `reorder` | mutation | `{ entityType, fieldIds[] }` | `{ success: true }` |

#### search

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `global` | query | `{ query, types?, limit? }` | `{ type, id, title, subtitle }[]` |

#### reports

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `pipelineSummary` | query | `{ pipelineId?, dateRange? }` | `{ stages[], winRate, avgCycleTime, healthDistribution }` |
| `activityVolume` | query | `{ days? }` | `{ date, emails, meetings, calls, notes }[]` |
| `staleDeals` | query | -- | `Deal[]` (no activity >7 days, sorted by amount) |

#### export

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `contactsCsv` | query | `{ search?, lifecycleStage?, ownerId? }` | `{ csv: string, count: number }` |
| `contactsVcard` | query | `{ search?, lifecycleStage?, ownerId? }` | `{ vcard: string, count: number }` |
| `companiesCsv` | query | `{ search? }` | `{ csv: string, count: number }` |
| `dealsCsv` | query | `{ pipelineId?, stageId? }` | `{ csv: string, count: number }` |

#### settings (admin only)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `getWorkspace` | query | -- | `Workspace` |
| `updateWorkspace` | mutation | `{ name?, settings? }` | `Workspace` |
| `listUsers` | query | -- | `User[]` |
| `inviteUser` | mutation | `{ email, role }` | `User` |
| `updateUserRole` | mutation | `{ userId, role }` | `User` |
| `deactivateUser` | mutation | `{ userId }` | `User` |
| `generateMcpKey` | mutation | -- | `{ key: string }` (shown once) |

---

## Webhook Payloads

### Delivery

- **Method:** POST
- **Content-Type:** `application/json`
- **Timeout:** 10 seconds
- **Retry:** 5 attempts with exponential backoff (5s base delay)

### Headers

| Header | Description |
|--------|-------------|
| `X-Webhook-Id` | Unique delivery ID (UUID) |
| `X-Webhook-Signature` | `sha256=<HMAC-SHA256 of raw body using webhook secret>` |
| `X-Webhook-Timestamp` | Unix timestamp of delivery |
| `Content-Type` | `application/json` |

### Signature Verification

To verify a webhook payload:

```python
import hmac
import hashlib

def verify_webhook(payload_body, secret, signature_header):
    expected = hmac.new(
        secret.encode('utf-8'),
        payload_body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)
```

```typescript
import crypto from "crypto";

function verifyWebhook(payloadBody: string, secret: string, signatureHeader: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(payloadBody).digest("hex");
  return signatureHeader === `sha256=${expected}`;
}
```

Optionally check `X-Webhook-Timestamp` is within 5 minutes to prevent replay attacks.

### Payload Format

```json
{
  "event": "deal.stage_changed",
  "timestamp": "2026-05-12T14:30:00.000Z",
  "data": {
    "id": "d4e5f678-90ab-cdef-1234-567890abcdef",
    "type": "deal",
    "attributes": {
      "name": "Acme Enterprise License",
      "amount": 5000000,
      "stage_id": "s004",
      "stage_name": "Negotiation"
    },
    "changes": {
      "stage_id": { "old": "s003", "new": "s004" },
      "stage_name": { "old": "Proposal", "new": "Negotiation" }
    }
  }
}
```

### Event Types

| Event | Trigger | Includes `changes`? |
|-------|---------|---------------------|
| `contact.created` | New contact record created | No |
| `contact.updated` | Contact fields modified | Yes |
| `contact.deleted` | Contact soft-deleted | No |
| `company.created` | New company record created | No |
| `company.updated` | Company fields modified | Yes |
| `company.deleted` | Company soft-deleted | No |
| `deal.created` | New deal created | No |
| `deal.updated` | Deal fields modified (non-stage) | Yes |
| `deal.deleted` | Deal soft-deleted | No |
| `deal.stage_changed` | Deal moved to a different stage | Yes (old/new stage) |
| `activity.created` | New activity logged (any type) | No |
| `task.created` | New task created | No |
| `task.completed` | Task marked as done | No |

### Expected Responses

| Response | Behavior |
|----------|----------|
| **2xx** | Delivery successful, no retry |
| **4xx** | Delivery failed permanently, no retry (auto-disable after repeated 4xx) |
| **5xx** | Delivery failed, will retry per backoff schedule |
| **Timeout (>10s)** | Treated as 5xx, will retry |

---

## MCP Server Reference

The MCP server is accessible at `/api/mcp` via HTTP SSE transport. It follows the Model Context Protocol Specification (2025-11-25).

### Authentication

Bearer token authentication using an MCP API key generated via Settings > Integrations. The key provides workspace-scoped access.

### Resources (Read-Only)

| URI | Description |
|-----|-------------|
| `crm://contacts` | List of contacts (name, email, company, stage, score) |
| `crm://contacts/{id}` | Full contact record with recent activities |
| `crm://companies` | List of companies (name, domain, industry, deal totals) |
| `crm://companies/{id}` | Company with contacts and deals |
| `crm://deals` | Pipeline overview (all open deals with stages and scores) |
| `crm://deals/{id}` | Deal detail with stakeholders, health score, stage history |
| `crm://activities` | Recent activity feed (last 50) |

### Tools (Write Operations)

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_contact` | `fullName` (required), `email?`, `companyName?`, `jobTitle?` | Create a new contact |
| `update_contact` | `contactId` (required), `email?`, `jobTitle?`, `lifecycleStage?` | Update a contact |
| `create_deal` | `name` (required), `pipelineId?`, `stageId?`, `amount?`, `companyId?` | Create a new deal |
| `update_deal_stage` | `dealId` (required), `stageName` (required) | Move deal to a stage |
| `log_activity` | `type` (note\|call), `contactId`, `dealId?`, `subject`, `body` | Log an activity |
| `create_task` | `title` (required), `assigneeId?`, `contactId?`, `dealId?`, `dueAt?` | Create a task |
| `search_crm` | `query` (required) | Search across all entities |
| `get_deal_health` | `dealId` (required) | Get deal health score breakdown |

### Prompts (Templates)

| Prompt | Parameters | Description |
|--------|------------|-------------|
| `meeting_prep` | `contactId` (required), `dealId?` | Briefing for an upcoming meeting |
| `deal_summary` | `dealId` (required) | Current state summary of a deal |
| `follow_up_draft` | `activityId` (required) | Draft follow-up email after a meeting |
| `pipeline_review` | -- | Overall pipeline health and risk review |

---

## OpenAPI Specification

The auto-generated OpenAPI 3.1 specification is available at:

```
GET /api/v1/openapi.json
```

This document is generated from the Zod validation schemas and describes all REST API endpoints, request/response bodies, authentication requirements, and error formats. It can be imported into tools like Postman, Swagger UI, or Insomnia for interactive API exploration.
