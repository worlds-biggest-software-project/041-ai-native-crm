# REST API Contract: AI-Native CRM

**Base URL**: `/api/v1`
**Authentication**: Bearer token (API key) or OAuth 2.0 session cookie
**Content-Type**: `application/json`
**Timestamps**: ISO 8601 (`2026-05-12T14:30:00Z`)

## Response Envelope

### Success

```json
{
  "data": { ... },
  "meta": {
    "cursor": "uuid-of-last-item",
    "hasMore": true,
    "total": 142
  }
}
```

### Error

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

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | Deleted (DELETE) |
| 400 | Validation error |
| 401 | Missing or invalid authentication |
| 403 | Insufficient permissions (member accessing admin-only resource) |
| 404 | Resource not found or soft-deleted |
| 409 | Conflict (duplicate unique field) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Endpoints

### Contacts

```
GET    /api/v1/contacts              List contacts (paginated)
POST   /api/v1/contacts              Create contact
GET    /api/v1/contacts/:id          Get contact by ID
PATCH  /api/v1/contacts/:id          Update contact (partial)
DELETE /api/v1/contacts/:id          Soft delete contact
```

**Query Parameters (GET /contacts)**:
- `cursor` (UUID) — cursor for pagination
- `limit` (1-100, default 50) — page size
- `search` (string, max 200) — full-text search
- `lifecycleStage` (string) — filter by stage
- `ownerId` (UUID) — filter by owner
- `sortBy` (fullName | createdAt | lastActivityAt | leadScore, default createdAt)
- `sortOrder` (asc | desc, default desc)

**Create Contact Body**:
```json
{
  "fullName": "Jane Smith",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@acme.com",
  "phone": "+1-555-0123",
  "jobTitle": "VP Engineering",
  "companyId": "uuid",
  "lifecycleStage": "lead",
  "ownerId": "uuid",
  "source": "manual",
  "customFields": { "contract_value": 50000 }
}
```

### Companies

```
GET    /api/v1/companies             List companies (paginated)
POST   /api/v1/companies             Create company
GET    /api/v1/companies/:id         Get company by ID
PATCH  /api/v1/companies/:id         Update company
DELETE /api/v1/companies/:id         Soft delete company
```

### Deals

```
GET    /api/v1/deals                 List deals (paginated)
POST   /api/v1/deals                 Create deal
GET    /api/v1/deals/:id             Get deal by ID
PATCH  /api/v1/deals/:id             Update deal (including stage moves)
DELETE /api/v1/deals/:id             Soft delete deal
```

**Stage Move**: PATCH with `{ "stageId": "new-stage-uuid" }` triggers stage transition logic (validation, audit, close date).

### Pipelines

```
GET    /api/v1/pipelines             List pipelines
POST   /api/v1/pipelines             Create pipeline (admin only)
PATCH  /api/v1/pipelines/:id         Update pipeline stages (admin only)
```

### Activities

```
GET    /api/v1/activities            List activities (paginated, filterable by contact/deal/company/type)
POST   /api/v1/activities            Create activity (note, call)
GET    /api/v1/activities/:id        Get activity by ID
```

### Search

```
GET    /api/v1/search?q=acme&types=contact,company&limit=10
```

Returns: `{ data: [{ type, id, title, subtitle }] }`

### OpenAPI Spec

```
GET    /api/v1/openapi.json          Auto-generated OpenAPI 3.1 document
```

## Pagination

Cursor-based pagination using the `id` of the last item. The `meta.cursor` value is passed as the `cursor` query parameter for the next page. `meta.hasMore` indicates if more results exist.

## Rate Limiting

Rate limits are applied per API key. Limits returned in response headers:
- `X-RateLimit-Limit`: requests allowed per window
- `X-RateLimit-Remaining`: requests remaining
- `X-RateLimit-Reset`: Unix timestamp when window resets
