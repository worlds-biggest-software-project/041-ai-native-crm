# NativeCRM Integration Guide

How to integrate NativeCRM with other systems through the REST API, webhooks,
MCP, email/calendar connections, import/export, and workflow automation.

---

## Table of Contents

- [REST API Integration](#rest-api-integration)
- [Webhook Integration](#webhook-integration)
- [MCP Integration](#mcp-integration)
- [Email and Calendar Integration](#email-and-calendar-integration)
- [Import and Export](#import-and-export)
- [Workflow Integration](#workflow-integration)

---

## REST API Integration

The NativeCRM REST API is available at `/api/v1/*` and provides full CRUD access
to all CRM entities. The API follows REST conventions with JSON request/response
bodies, cursor-based pagination, and standard HTTP status codes.

### Authentication Setup

REST API requests are authenticated with a Bearer token derived from the
`API_SECRET` environment variable. Workspace admins generate API tokens in
**Settings > API Keys**.

Include the token in the `Authorization` header:

```
Authorization: Bearer <your-api-token>
```

### CRUD Operations

#### List contacts (with filtering and pagination)

```bash
curl -s -H "Authorization: Bearer $API_TOKEN" \
  "https://crm.yourdomain.com/api/v1/contacts?limit=10&sortBy=createdAt&sortOrder=desc"
```

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Jane Smith",
      "email": "jane@acme.com",
      "jobTitle": "VP Engineering",
      "companyId": "660e8400-e29b-41d4-a716-446655440001",
      "lifecycleStage": "lead",
      "leadScore": 72,
      "createdAt": "2026-05-12T10:00:00Z",
      "updatedAt": "2026-05-12T14:30:00Z"
    }
  ],
  "meta": {
    "cursor": "550e8400-e29b-41d4-a716-446655440000",
    "hasMore": true,
    "total": 142
  }
}
```

#### Create a contact

```bash
curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "jobTitle": "CTO",
    "lifecycleStage": "lead"
  }' \
  "https://crm.yourdomain.com/api/v1/contacts"
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "fullName": "John Doe",
    "email": "john@example.com",
    "jobTitle": "CTO",
    "lifecycleStage": "lead",
    "createdAt": "2026-05-12T15:00:00Z",
    "updatedAt": "2026-05-12T15:00:00Z"
  }
}
```

#### Update a contact (partial update)

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "CEO", "lifecycleStage": "opportunity"}' \
  "https://crm.yourdomain.com/api/v1/contacts/770e8400-e29b-41d4-a716-446655440002"
```

#### Delete a contact (soft delete)

```bash
curl -s -X DELETE \
  -H "Authorization: Bearer $API_TOKEN" \
  "https://crm.yourdomain.com/api/v1/contacts/770e8400-e29b-41d4-a716-446655440002"
```

Returns `204 No Content` on success.

#### Move a deal to a new stage

```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stageId": "880e8400-e29b-41d4-a716-446655440003"}' \
  "https://crm.yourdomain.com/api/v1/deals/990e8400-e29b-41d4-a716-446655440004"
```

#### Search across all entities

```bash
curl -s -H "Authorization: Bearer $API_TOKEN" \
  "https://crm.yourdomain.com/api/v1/search?q=acme&types=contact,company&limit=10"
```

### Pagination and Filtering

The API uses cursor-based pagination. To fetch subsequent pages, pass the
`cursor` value from the previous response's `meta.cursor`:

```bash
# Page 1
curl -s -H "Authorization: Bearer $API_TOKEN" \
  "https://crm.yourdomain.com/api/v1/contacts?limit=50"

# Page 2 (using cursor from page 1)
curl -s -H "Authorization: Bearer $API_TOKEN" \
  "https://crm.yourdomain.com/api/v1/contacts?limit=50&cursor=550e8400-e29b-41d4-a716-446655440000"
```

Continue until `meta.hasMore` is `false`.

**Available query parameters for list endpoints:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cursor` | UUID | Cursor for pagination (from previous response) |
| `limit` | 1-100 | Page size (default: 50) |
| `search` | string | Full-text search (max 200 characters) |
| `sortBy` | string | Field to sort by (varies per entity) |
| `sortOrder` | `asc` / `desc` | Sort direction (default: `desc`) |
| `ownerId` | UUID | Filter by record owner |

### Rate Limit Handling

The API enforces rate limits per API key. When rate-limited, the API returns
HTTP 429 with a `Retry-After` header indicating seconds until the next window.

**Recommended handling:**

```python
import time
import requests

def api_request(method, url, **kwargs):
    response = requests.request(method, url, **kwargs)
    if response.status_code == 429:
        retry_after = int(response.headers.get("Retry-After", 60))
        time.sleep(retry_after)
        response = requests.request(method, url, **kwargs)
    return response
```

### Error Handling

All errors follow a consistent format:

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

| HTTP Status | Error Code | Meaning |
|-------------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Invalid request body or query parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid Bearer token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource does not exist or has been deleted |
| 409 | `CONFLICT` | Duplicate unique field (e.g., email already exists) |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### Code Examples

#### Python

```python
import requests

BASE_URL = "https://crm.yourdomain.com/api/v1"
HEADERS = {
    "Authorization": "Bearer your-api-token",
    "Content-Type": "application/json",
}

# List contacts
response = requests.get(f"{BASE_URL}/contacts", headers=HEADERS, params={"limit": 10})
contacts = response.json()["data"]

# Create a deal
deal = requests.post(f"{BASE_URL}/deals", headers=HEADERS, json={
    "name": "Enterprise License",
    "amount": 50000,
    "companyId": "company-uuid",
    "stageId": "stage-uuid",
}).json()["data"]

# Paginate through all companies
cursor = None
all_companies = []
while True:
    params = {"limit": 100}
    if cursor:
        params["cursor"] = cursor
    resp = requests.get(f"{BASE_URL}/companies", headers=HEADERS, params=params).json()
    all_companies.extend(resp["data"])
    if not resp["meta"]["hasMore"]:
        break
    cursor = resp["meta"]["cursor"]
```

#### JavaScript (Node.js)

```javascript
const BASE_URL = "https://crm.yourdomain.com/api/v1";
const HEADERS = {
  Authorization: "Bearer your-api-token",
  "Content-Type": "application/json",
};

// List contacts
const contactsRes = await fetch(`${BASE_URL}/contacts?limit=10`, { headers: HEADERS });
const { data: contacts } = await contactsRes.json();

// Create a contact
const newContact = await fetch(`${BASE_URL}/contacts`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({
    fullName: "Jane Smith",
    email: "jane@acme.com",
    jobTitle: "VP Engineering",
  }),
}).then((r) => r.json());

// Update a deal stage
await fetch(`${BASE_URL}/deals/${dealId}`, {
  method: "PATCH",
  headers: HEADERS,
  body: JSON.stringify({ stageId: "new-stage-uuid" }),
});
```

#### Ruby

```ruby
require "net/http"
require "json"

BASE_URL = "https://crm.yourdomain.com/api/v1"
TOKEN = "your-api-token"

def api_get(path, params = {})
  uri = URI("#{BASE_URL}#{path}")
  uri.query = URI.encode_www_form(params) unless params.empty?
  req = Net::HTTP::Get.new(uri)
  req["Authorization"] = "Bearer #{TOKEN}"
  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  JSON.parse(res.body)
end

def api_post(path, body)
  uri = URI("#{BASE_URL}#{path}")
  req = Net::HTTP::Post.new(uri)
  req["Authorization"] = "Bearer #{TOKEN}"
  req["Content-Type"] = "application/json"
  req.body = body.to_json
  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  JSON.parse(res.body)
end

# List contacts
contacts = api_get("/contacts", limit: 10)["data"]

# Create a company
company = api_post("/companies", {
  name: "Acme Corp",
  domain: "acme.com",
  industry: "Technology",
})["data"]
```

#### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const baseURL = "https://crm.yourdomain.com/api/v1"
const apiToken = "your-api-token"

func apiRequest(method, path string, body interface{}) (map[string]interface{}, error) {
    var bodyReader io.Reader
    if body != nil {
        jsonBody, _ := json.Marshal(body)
        bodyReader = bytes.NewReader(jsonBody)
    }
    req, _ := http.NewRequest(method, baseURL+path, bodyReader)
    req.Header.Set("Authorization", "Bearer "+apiToken)
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

func main() {
    // List contacts
    contacts, _ := apiRequest("GET", "/contacts?limit=10", nil)
    fmt.Println(contacts)

    // Create a contact
    newContact, _ := apiRequest("POST", "/contacts", map[string]interface{}{
        "fullName": "John Doe",
        "email":    "john@example.com",
        "jobTitle": "CTO",
    })
    fmt.Println(newContact)
}
```

### OpenAPI Specification

The full OpenAPI 3.1 specification is available at:

```
GET /api/v1/openapi.json
```

Use this to generate client libraries in any language with tools like
[openapi-generator](https://openapi-generator.tech/) or
[openapi-typescript](https://github.com/drwpow/openapi-typescript).

---

## Webhook Integration

Webhooks allow NativeCRM to notify your systems in real time when CRM events
occur.

### Registering Webhook Endpoints

Workspace admins register webhook endpoints in **Settings > Webhooks**.

Each webhook registration includes:
- **URL:** The HTTPS endpoint to receive events (must be publicly accessible).
- **Events:** One or more event types to subscribe to.
- **Secret:** An auto-generated HMAC secret for signature verification.

You can also manage webhooks programmatically via the REST API (admin role
required):

```bash
curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/nativecrm",
    "events": ["contact.created", "deal.stage_changed"],
    "active": true
  }' \
  "https://crm.yourdomain.com/api/v1/webhooks"
```

### Event Types and Payload Schemas

| Event | Trigger | Includes Changes |
|-------|---------|:----------------:|
| `contact.created` | New contact record created | No |
| `contact.updated` | Contact fields modified | Yes |
| `contact.deleted` | Contact soft-deleted | No |
| `company.created` | New company record created | No |
| `company.updated` | Company fields modified | Yes |
| `company.deleted` | Company soft-deleted | No |
| `deal.created` | New deal created | No |
| `deal.updated` | Deal fields modified (non-stage) | Yes |
| `deal.deleted` | Deal soft-deleted | No |
| `deal.stage_changed` | Deal moved to a different stage | Yes |
| `activity.created` | New activity logged (any type) | No |
| `task.created` | New task created | No |
| `task.completed` | Task marked as done | No |

**Payload format:**

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

### Delivery Headers

| Header | Description |
|--------|-------------|
| `X-Webhook-Id` | Unique delivery ID (UUID) for idempotency |
| `X-Webhook-Signature` | `sha256=<HMAC-SHA256 of raw body using webhook secret>` |
| `X-Webhook-Timestamp` | Unix timestamp of delivery |
| `Content-Type` | `application/json` |

### HMAC Signature Verification

Always verify the webhook signature to ensure the request is from NativeCRM
and has not been tampered with.

**Verification steps:**

1. Extract the raw request body (before JSON parsing).
2. Compute HMAC-SHA256 of the raw body using your webhook secret.
3. Compare with the value after `sha256=` in the `X-Webhook-Signature` header.
4. Optionally verify that `X-Webhook-Timestamp` is within an acceptable window
   (e.g., 5 minutes) to prevent replay attacks.

#### Node.js

```javascript
import crypto from "node:crypto";

function verifyWebhookSignature(rawBody, signature, secret, timestamp) {
  // Check timestamp freshness (5-minute window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    throw new Error("Webhook timestamp is too old");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const receivedSignature = signature.replace("sha256=", "");

  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(receivedSignature, "hex")
  )) {
    throw new Error("Invalid webhook signature");
  }
}

// Express.js example
app.post("/webhooks/nativecrm", express.raw({ type: "application/json" }), (req, res) => {
  try {
    verifyWebhookSignature(
      req.body,
      req.headers["x-webhook-signature"],
      process.env.WEBHOOK_SECRET,
      req.headers["x-webhook-timestamp"]
    );
    const event = JSON.parse(req.body);
    console.log(`Received ${event.event}:`, event.data);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    res.sendStatus(401);
  }
});
```

#### Python

```python
import hashlib
import hmac
import time
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = "your-webhook-secret"

def verify_signature(raw_body: bytes, signature: str, timestamp: str) -> bool:
    # Check timestamp freshness
    if abs(time.time() - int(timestamp)) > 300:
        return False

    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    received = signature.removeprefix("sha256=")
    return hmac.compare_digest(expected, received)

@app.route("/webhooks/nativecrm", methods=["POST"])
def webhook():
    if not verify_signature(
        request.get_data(),
        request.headers.get("X-Webhook-Signature", ""),
        request.headers.get("X-Webhook-Timestamp", "0"),
    ):
        abort(401)

    event = request.json
    print(f"Received {event['event']}: {event['data']}")
    return "", 200
```

#### Ruby

```ruby
require "openssl"
require "sinatra"
require "json"

WEBHOOK_SECRET = ENV["WEBHOOK_SECRET"]

post "/webhooks/nativecrm" do
  raw_body = request.body.read
  signature = request.env["HTTP_X_WEBHOOK_SIGNATURE"]&.delete_prefix("sha256=")
  timestamp = request.env["HTTP_X_WEBHOOK_TIMESTAMP"]

  # Check timestamp freshness
  halt 401 if (Time.now.to_i - timestamp.to_i).abs > 300

  expected = OpenSSL::HMAC.hexdigest("SHA256", WEBHOOK_SECRET, raw_body)
  halt 401 unless Rack::Utils.secure_compare(expected, signature)

  event = JSON.parse(raw_body)
  puts "Received #{event['event']}: #{event['data']}"
  status 200
end
```

#### Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "math"
    "net/http"
    "strconv"
    "strings"
    "time"
)

const webhookSecret = "your-webhook-secret"

func verifySignature(body []byte, signature, timestamp string) bool {
    // Check timestamp freshness
    ts, err := strconv.ParseInt(timestamp, 10, 64)
    if err != nil || math.Abs(float64(time.Now().Unix()-ts)) > 300 {
        return false
    }

    mac := hmac.New(sha256.New, []byte(webhookSecret))
    mac.Write(body)
    expected := hex.EncodeToString(mac.Sum(nil))
    received := strings.TrimPrefix(signature, "sha256=")

    return hmac.Equal([]byte(expected), []byte(received))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)
    if !verifySignature(
        body,
        r.Header.Get("X-Webhook-Signature"),
        r.Header.Get("X-Webhook-Timestamp"),
    ) {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    fmt.Printf("Received webhook: %s\n", string(body))
    w.WriteHeader(http.StatusOK)
}

func main() {
    http.HandleFunc("/webhooks/nativecrm", webhookHandler)
    http.ListenAndServe(":8080", nil)
}
```

### Retry Behavior and Idempotency

NativeCRM retries failed deliveries with exponential backoff:

| Attempt | Delay | Cumulative |
|---------|-------|------------|
| 1st retry | 30 seconds | 30s |
| 2nd retry | 120 seconds | 2.5 minutes |
| 3rd retry | 600 seconds | 12.5 minutes |

After 3 failed retries, the delivery is marked as failed in the delivery log.

**Idempotency:** Use the `X-Webhook-Id` header to detect duplicate deliveries.
Store processed delivery IDs and skip duplicates:

```python
processed_ids = set()

@app.route("/webhooks/nativecrm", methods=["POST"])
def webhook():
    delivery_id = request.headers.get("X-Webhook-Id")
    if delivery_id in processed_ids:
        return "", 200  # Already processed, acknowledge without re-processing
    processed_ids.add(delivery_id)
    # ... process the event
```

For production, store delivery IDs in a database or Redis with a TTL.

**Response expectations:**
- **2xx:** Delivery successful. No retry.
- **4xx:** Delivery failed permanently. No retry. After repeated 4xx responses,
  the webhook may be automatically disabled.
- **5xx:** Delivery failed temporarily. Will retry per the schedule above.
- **Timeout (>10 seconds):** Treated as 5xx. Will retry.

### Debugging Webhooks

1. **Delivery log:** View webhook delivery history in **Settings > Webhooks**.
   Each delivery shows the status, response code, and response time.
2. **Test delivery:** Click "Send Test" on any webhook to trigger a test
   delivery with sample data.
3. **Local development:** Use a tunneling service like
   [ngrok](https://ngrok.com/) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
   to expose your local server to the internet.

```bash
# Using ngrok
ngrok http 8080

# Register the ngrok URL as your webhook endpoint
# https://abc123.ngrok.io/webhooks/nativecrm
```

---

## MCP Integration

NativeCRM ships a native Model Context Protocol (MCP) server that allows AI
assistants to interact with CRM data directly.

### What Is MCP and Why Use It

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open
standard that enables AI assistants to access external data sources and tools.
Instead of copying CRM data into chat messages, an MCP-connected assistant can:

- Browse contacts, companies, and deals in real time.
- Create records, move deals, and log activities through natural conversation.
- Generate meeting prep briefings and deal summaries using live CRM data.
- Search across the entire CRM from within a chat interface.

### Connecting Claude Desktop to NativeCRM

1. **Generate an MCP API key.** In NativeCRM, go to **Settings > API Keys** and
   create a new key with MCP access. Copy the key.

2. **Configure Claude Desktop.** Open Claude Desktop settings and add a new
   MCP server:

   ```json
   {
     "mcpServers": {
       "nativecrm": {
         "url": "https://crm.yourdomain.com/api/mcp",
         "headers": {
           "Authorization": "Bearer your-mcp-api-key"
         }
       }
     }
   }
   ```

3. **Verify the connection.** In a new Claude Desktop conversation, you should
   see NativeCRM listed as a connected tool. Try asking:
   - "Show me my open deals"
   - "What contacts do I have at Acme Corp?"
   - "Create a note on the Acme deal about today's call"

### Available Resources

Resources provide read-only access to CRM data:

| Resource | URI Pattern | Description |
|----------|-------------|-------------|
| Contacts list | `crm://contacts` | All contacts (name, email, company, stage, score) |
| Contact detail | `crm://contacts/{id}` | Full contact with recent activities |
| Companies list | `crm://companies` | All companies (name, domain, industry, deal totals) |
| Company detail | `crm://companies/{id}` | Company with contacts and deals |
| Deals list | `crm://deals` | Pipeline overview (all open deals with stages and scores) |
| Deal detail | `crm://deals/{id}` | Deal with stakeholders, health score, stage history |
| Activities feed | `crm://activities` | Recent activity feed (last 50 entries) |

All resources are scoped to the authenticated workspace.

### Available Tools

Tools enable write operations:

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_contact` | Create a new contact | `fullName` (required), `email`, `companyName`, `jobTitle` |
| `update_contact` | Update an existing contact | `contactId` (required), `email?`, `jobTitle?`, `lifecycleStage?` |
| `create_deal` | Create a new deal | `name` (required), `pipelineId`, `stageId`, `amount?`, `companyId?` |
| `update_deal_stage` | Move a deal to a stage | `dealId` (required), `stageName` (required) |
| `log_activity` | Log a note or call | `type` (note/call), `contactId`, `dealId?`, `subject`, `body` |
| `create_task` | Create a task | `title` (required), `assigneeId?`, `contactId?`, `dealId?`, `dueAt?` |
| `search_crm` | Search all entities | `query` (required) |
| `get_deal_health` | Get health score breakdown | `dealId` (required) |

### Available Prompts

Prompts are reusable templates for common CRM tasks:

| Prompt | Description | Parameters |
|--------|-------------|------------|
| `meeting_prep` | Pre-meeting briefing with history, action items, and talking points | `contactId` (required), `dealId?` |
| `deal_summary` | Current deal state, health, risks, and recommendations | `dealId` (required) |
| `follow_up_draft` | Draft follow-up email after a meeting | `activityId` (required) |
| `pipeline_review` | Overall pipeline health and risk assessment | (none) |

### Example Conversations with MCP

**Meeting preparation:**

> **You:** Prepare me for my call with Jane Smith about the Acme Enterprise deal.
>
> **Claude:** *[Uses `meeting_prep` prompt with Jane's contact ID and the Acme deal ID]*
>
> Here is your briefing for the call with Jane Smith:
>
> **Relationship History:** You have exchanged 12 emails over the past 3 weeks.
> Jane responded to your last email within 2 hours, indicating strong engagement...
>
> **Open Action Items:** Jane requested a technical architecture document
> (due Friday). Your team committed to a pricing proposal by end of week...
>
> **Suggested Talking Points:**
> 1. Follow up on the architecture document status
> 2. Present the pricing proposal
> 3. Discuss timeline for security review

**Quick data entry:**

> **You:** I just had a call with John Doe from TechCorp. He is interested in
> our Pro plan at $30k annually. Create a deal and log the call.
>
> **Claude:** *[Uses `create_deal` and `log_activity` tools]*
>
> Done. I created the deal "TechCorp Pro Plan" for $30,000 in the Qualification
> stage and logged a call activity with your notes.

**Pipeline review:**

> **You:** How is my pipeline looking this quarter?
>
> **Claude:** *[Uses `pipeline_review` prompt]*
>
> Your pipeline has 23 active deals worth $1.2M total...

### Building Custom MCP Clients

If you are building your own MCP client (not using Claude Desktop), connect to
the NativeCRM MCP server using the `@modelcontextprotocol/sdk`:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("https://crm.yourdomain.com/api/mcp"),
  {
    requestInit: {
      headers: {
        Authorization: "Bearer your-mcp-api-key",
      },
    },
  }
);

const client = new Client({
  name: "my-crm-client",
  version: "1.0.0",
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(tools);

// Read a resource
const contacts = await client.readResource({ uri: "crm://contacts" });
console.log(contacts);

// Call a tool
const result = await client.callTool({
  name: "create_contact",
  arguments: {
    fullName: "Alice Johnson",
    email: "alice@example.com",
    jobTitle: "Product Manager",
  },
});
console.log(result);

// Use a prompt
const briefing = await client.getPrompt({
  name: "meeting_prep",
  arguments: { contactId: "contact-uuid" },
});
console.log(briefing);
```

---

## Email and Calendar Integration

NativeCRM syncs emails and calendar events from Gmail and Outlook to
automatically populate the CRM pipeline.

### Setting Up Google Workspace OAuth Consent Screen

Follow the steps in [configuration.md](configuration.md) under
**Auth Provider Setup > Google OAuth**. The key scopes required for email and
calendar sync are:

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/gmail.readonly` | Read emails for sync |
| `https://www.googleapis.com/auth/gmail.send` | Send follow-up emails |
| `https://www.googleapis.com/auth/calendar.readonly` | Read calendar events |

**Important for Google Workspace admins:**

- If your Google Workspace has "Only internal apps" enabled, add NativeCRM's
  OAuth client to the allowlist in **Admin Console > Security > API Controls**.
- For production use with external users, you must submit the app for Google
  OAuth verification. This process takes 2-6 weeks.

### Setting Up Microsoft Azure AD App Registration

Follow the steps in [configuration.md](configuration.md) under
**Auth Provider Setup > Microsoft Azure AD OAuth**. The key permissions
required are:

| Permission | Type | Purpose |
|------------|------|---------|
| `Mail.Read` | Delegated | Read emails for sync |
| `Mail.Send` | Delegated | Send follow-up emails |
| `Calendars.Read` | Delegated | Read calendar events |
| `User.Read` | Delegated | Read user profile for auth |

**Admin consent:** If your Azure AD tenant requires admin consent for these
permissions, a tenant admin must grant consent in the Azure Portal.

### Required Scopes and Permissions

Users connect their accounts individually in **Settings > Integrations**. Each
user authorizes NativeCRM to access their email and calendar data. The
application requests only the minimum scopes needed:

- **Read-only email access:** NativeCRM reads email metadata and plain-text
  bodies. HTML is stripped. Attachments are referenced by name and size but
  not stored.
- **Send access:** Only used when the user explicitly clicks "Send" on a
  follow-up draft. NativeCRM never sends emails without user action.
- **Read-only calendar access:** NativeCRM reads calendar events and attendee
  lists. It does not create or modify calendar events.

### Troubleshooting Sync Issues

**Email sync is not starting:**

1. Check that the OAuth connection is active in **Settings > Integrations**.
   If it shows "Inactive" or "Disconnected," the user needs to re-authorize.
2. Verify that background workers are running (`docker compose ps` should show
   the worker as healthy).
3. Check worker logs for errors: `docker compose logs -f worker | grep email-sync`

**Contacts are not being auto-created:**

1. Check if the email domain is in the excluded domains list. Internal emails
   (from your own organization) are excluded by default if the domain was added
   to the exclusion list.
2. The contact may already exist (matched by email address).

**Calendar events are missing:**

1. Verify that Google Calendar or Outlook Calendar sync is enabled (separate
   from email sync).
2. Only events with external attendees (outside excluded domains) generate
   activities. Internal-only meetings are skipped.

**OAuth token refresh fails:**

If a user revokes access or the refresh token expires, the connection is
automatically marked as inactive. The user sees a notification to re-authorize.
Check worker logs for `TOKEN_REFRESH_FAILED` errors.

**Sync latency is too high:**

- Default polling interval is 5 minutes. Reduce `EMAIL_SYNC_POLL_INTERVAL_MS`
  for faster sync (minimum recommended: 60000ms / 1 minute).
- For Gmail, configure push notifications via Google Pub/Sub for near-instant
  sync.
- For Outlook, configure Microsoft Graph change notifications.

---

## Import and Export

### CSV Import

Import contacts from CSV files through the web UI or REST API.

#### Via Web UI

1. Navigate to **Contacts** (or Companies, Deals).
2. Click **Import > CSV**.
3. Upload your CSV file.
4. Map CSV columns to NativeCRM fields in the column mapping interface.
5. Review the preview and click **Import**.

#### CSV Format

The CSV file must have a header row. Columns are matched by the mapping step,
so column names do not need to match NativeCRM field names exactly.

**Required fields:**

| Entity | Required Fields |
|--------|----------------|
| Contacts | `fullName` or (`firstName` + `lastName`), `email` |
| Companies | `name` |
| Deals | `name` |

**Example CSV (contacts):**

```csv
First Name,Last Name,Email,Phone,Job Title,Company
Jane,Smith,jane@acme.com,+1-555-0123,VP Engineering,Acme Corp
John,Doe,john@example.com,+1-555-0456,CTO,Example Inc
```

**Deduplication:** Contacts are deduplicated by email address within the
workspace. If a contact with the same email already exists, it is updated
(not duplicated).

**Performance:** 1,000 records process in under 60 seconds.

#### Via REST API

```bash
curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@contacts.csv" \
  -F 'mapping={"First Name":"firstName","Last Name":"lastName","Email":"email","Company":"companyName"}' \
  "https://crm.yourdomain.com/api/v1/contacts/import"
```

### vCard Import

Import contacts from vCard (.vcf) files (RFC 6350):

1. Navigate to **Contacts > Import > vCard**.
2. Upload one or more `.vcf` files.
3. NativeCRM extracts: name, email, phone, title, and organization.
4. The ORG field is matched to existing companies or a new company is created.

### CSV and JSON Export

Export data through the web UI or REST API.

**Via Web UI:**

1. Navigate to the entity list (Contacts, Companies, or Deals).
2. Click **Export**.
3. Choose format: CSV or JSON.
4. The file downloads with all records matching the current filter.

**Via REST API:**

```bash
# Export contacts as CSV
curl -s -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: text/csv" \
  "https://crm.yourdomain.com/api/v1/contacts/export" > contacts.csv

# Export deals as JSON
curl -s -H "Authorization: Bearer $API_TOKEN" \
  -H "Accept: application/json" \
  "https://crm.yourdomain.com/api/v1/deals/export" > deals.json
```

### Bulk Operations via API

For large-scale data operations, use the batch endpoints:

```bash
# Bulk create contacts
curl -s -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"fullName": "Jane Smith", "email": "jane@acme.com"},
      {"fullName": "John Doe", "email": "john@example.com"}
    ]
  }' \
  "https://crm.yourdomain.com/api/v1/contacts/batch"
```

Batch endpoints accept up to 100 records per request. For larger imports, use
the CSV import endpoint.

---

## Workflow Integration

NativeCRM supports trigger-condition-action workflows and outbound integrations
with external systems.

### Triggering External Actions via Webhooks

The most common integration pattern is using webhooks to trigger actions in
external systems when CRM events occur. See [Webhook Integration](#webhook-integration)
for setup details.

**Common patterns:**

| Trigger Event | External Action |
|---------------|----------------|
| `deal.stage_changed` to "Closed Won" | Create invoice in billing system |
| `contact.created` with source "email_sync" | Add to email marketing list |
| `deal.stage_changed` to "Negotiation" | Create legal review task in project tool |
| `task.completed` | Update status in project management system |
| `deal.created` | Post notification to team Slack channel |

### Building Custom Workflow Actions

Workspace admins build workflows in **Settings > Workflows** using a visual
trigger-condition-action builder.

**Available trigger types:**
- Record created (contact, company, deal, activity, task)
- Record updated (any field change)
- Deal stage changed (specific stage transitions)
- Score threshold crossed (deal health or lead score)

**Available condition types:**
- Field value comparison (equals, contains, greater than, less than)
- Record type filter
- Time-based conditions (e.g., "only during business hours")

**Available action types:**
- Create a task (with assignee, due date, linked records)
- Update a field on the triggering record or a related record
- Send a notification (in-app)
- Call a webhook (POST to an external URL)
- Wait (pause execution for a duration before continuing)

### Common Integration Patterns

#### Slack Notifications

Send deal stage changes to a Slack channel using webhooks:

1. Create a Slack Incoming Webhook URL in your Slack workspace.
2. Register a NativeCRM webhook for `deal.stage_changed`.
3. Build a small middleware that transforms the NativeCRM payload into a Slack
   message:

```javascript
// Middleware: NativeCRM webhook -> Slack
app.post("/webhooks/nativecrm-to-slack", express.json(), async (req, res) => {
  const { event, data } = req.body;

  if (event === "deal.stage_changed") {
    const slackMessage = {
      text: `Deal "${data.attributes.name}" moved to *${data.attributes.stage_name}*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `*Deal:* ${data.attributes.name}`,
              `*Amount:* $${data.attributes.amount?.toLocaleString()}`,
              `*Stage:* ${data.changes.stage_name.old} -> ${data.changes.stage_name.new}`,
            ].join("\n"),
          },
        },
      ],
    };

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });
  }

  res.sendStatus(200);
});
```

Alternatively, use the built-in workflow builder to call the Slack webhook
directly (no middleware needed for simple messages).

#### Email Alerts

Use workflows to send email notifications when specific events occur:

1. In **Settings > Workflows**, create a new workflow.
2. **Trigger:** Deal stage changed to "Closed Won."
3. **Action:** Call webhook with your email service API (SendGrid, Postmark,
   etc.).

#### Task Creation in Project Tools

When a deal enters a specific stage, create a task in your project management
tool (Jira, Linear, Asana):

1. Register a NativeCRM webhook for `deal.stage_changed`.
2. In your webhook handler, check if the new stage matches your trigger
   condition.
3. Call the project tool's API to create a task:

```python
@app.route("/webhooks/nativecrm-to-jira", methods=["POST"])
def create_jira_task():
    event = request.json
    if (event["event"] == "deal.stage_changed" and
        event["data"]["attributes"]["stage_name"] == "Negotiation"):

        jira_payload = {
            "fields": {
                "project": {"key": "LEGAL"},
                "summary": f"Contract review: {event['data']['attributes']['name']}",
                "issuetype": {"name": "Task"},
                "description": f"Deal amount: ${event['data']['attributes']['amount']}",
            }
        }
        requests.post(
            "https://your-org.atlassian.net/rest/api/3/issue",
            json=jira_payload,
            auth=("email@example.com", JIRA_API_TOKEN),
        )

    return "", 200
```

#### Bidirectional Sync

For bidirectional sync with an external system, combine webhooks (NativeCRM to
external) with REST API calls (external to NativeCRM):

1. NativeCRM webhooks notify your system of CRM changes.
2. Your system processes the webhook and updates its own records.
3. When your system has changes to push back, it calls the NativeCRM REST API.
4. Use the `X-Webhook-Id` header and your system's own idempotency keys to
   prevent infinite sync loops.
