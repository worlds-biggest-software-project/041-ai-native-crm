# Webhook Contract: AI-Native CRM

## Delivery

- **Method**: POST
- **Content-Type**: `application/json`
- **Timeout**: 10 seconds
- **Retry**: 3 retries on 5xx or timeout, exponential backoff (30s, 120s, 600s)

## Headers

| Header | Description |
|--------|-------------|
| `X-Webhook-Id` | Unique delivery ID (UUID) |
| `X-Webhook-Signature` | `sha256=<HMAC-SHA256 of raw body using webhook secret>` |
| `X-Webhook-Timestamp` | Unix timestamp of delivery |
| `Content-Type` | `application/json` |

## Signature Verification

Recipients SHOULD verify the signature:
1. Compute `HMAC-SHA256(webhook_secret, raw_request_body)`
2. Compare with the value after `sha256=` in `X-Webhook-Signature`
3. Optionally check `X-Webhook-Timestamp` is within acceptable window (e.g., 5 minutes) to prevent replay attacks

## Payload Format

```json
{
  "id": "delivery-uuid",
  "event": "deal.stage_changed",
  "timestamp": "2026-05-12T14:30:00Z",
  "workspace_id": "workspace-uuid",
  "data": {
    "id": "entity-uuid",
    "type": "deal",
    "attributes": {
      "name": "Acme Enterprise License",
      "amount": 50000,
      "stage_id": "new-stage-uuid",
      "stage_name": "Negotiation"
    },
    "changes": {
      "stage_id": {
        "old": "previous-stage-uuid",
        "new": "new-stage-uuid"
      },
      "stage_name": {
        "old": "Proposal",
        "new": "Negotiation"
      }
    }
  }
}
```

## Events

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

## Expected Responses

- **2xx**: Delivery successful, no retry
- **4xx**: Delivery failed permanently, no retry (webhook may be auto-disabled after repeated 4xx)
- **5xx**: Delivery failed, will retry per backoff schedule
- **Timeout** (>10s): Treated as 5xx, will retry
