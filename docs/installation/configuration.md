# NativeCRM Configuration Reference

Complete reference for all NativeCRM configuration options. Variables are set
via environment (`.env.local` for development, `.env.production` or platform
environment variables for production).

---

## Table of Contents

- [Environment Variable Reference](#environment-variable-reference)
- [Auth Provider Setup](#auth-provider-setup)
- [Database Configuration](#database-configuration)
- [Redis Configuration](#redis-configuration)
- [BullMQ Worker Configuration](#bullmq-worker-configuration)
- [AI Configuration](#ai-configuration)
- [Email Sync Settings](#email-sync-settings)
- [Enrichment Source Configuration](#enrichment-source-configuration)
- [Rate Limiting](#rate-limiting)
- [Security Headers](#security-headers)
- [CORS Configuration](#cors-configuration)
- [Logging](#logging)

---

## Environment Variable Reference

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `DATABASE_URL` | string | (none) | Yes | PostgreSQL connection string. Format: `postgresql://user:password@host:port/database` |
| `REDIS_URL` | string | (none) | Yes | Redis connection string. Format: `redis://:password@host:port` |
| `NEXTAUTH_SECRET` | string | (none) | Yes | Secret for signing Auth.js session tokens. Minimum 32 characters. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | string | (none) | Yes | Canonical URL of the application (e.g., `https://crm.yourdomain.com`). Used for OAuth redirect URIs |
| `GOOGLE_CLIENT_ID` | string | (none) | No* | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | string | (none) | No* | Google OAuth 2.0 client secret |
| `AZURE_AD_CLIENT_ID` | string | (none) | No* | Microsoft Azure AD application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | string | (none) | No* | Microsoft Azure AD client secret |
| `AZURE_AD_TENANT_ID` | string | (none) | No* | Microsoft Azure AD tenant ID (use `common` for multi-tenant) |
| `ANTHROPIC_API_KEY` | string | (none) | No | Anthropic API key for Claude-powered features. Required for AI summaries, follow-ups, and extraction |
| `API_SECRET` | string | (none) | Yes | Secret for authenticating REST API Bearer tokens. Generate with `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | string | (none) | Yes | 32-byte hex key for AES-256-GCM encryption of OAuth tokens at rest. Generate with `openssl rand -hex 32` |
| `CORS_ORIGIN` | string | `""` | Yes | Allowed CORS origin for the REST API. Set to the application URL in production |
| `NODE_ENV` | string | `development` | No | Set to `production` for production deployments |
| `PORT` | number | `3000` | No | Port for the Next.js server to listen on |
| `LOG_LEVEL` | string | `info` | No | Logging verbosity: `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | string | `json` | No | Log output format: `json` (structured) or `pretty` (human-readable, dev only) |
| `AI_MODEL` | string | `claude-sonnet-4-20250514` | No | Anthropic model ID for AI features |
| `AI_MAX_TOKENS` | number | `4096` | No | Maximum output tokens for AI responses |
| `AI_TEMPERATURE` | number | `0.3` | No | Temperature for AI generation (0.0-1.0). Lower values produce more deterministic output |
| `EMAIL_SYNC_WINDOW_DAYS` | number | `30` | No | Number of days of email history to sync on initial connection |
| `EMAIL_SYNC_BATCH_SIZE` | number | `100` | No | Number of emails to process per sync batch |
| `EMAIL_SYNC_POLL_INTERVAL_MS` | number | `300000` | No | Polling interval for incremental email sync (milliseconds). Default: 5 minutes |
| `CALENDAR_SYNC_POLL_INTERVAL_MS` | number | `300000` | No | Polling interval for calendar sync (milliseconds). Default: 5 minutes |
| `SCORING_BATCH_INTERVAL_MS` | number | `86400000` | No | Interval for batch score recalculation (milliseconds). Default: 24 hours |
| `ENRICHMENT_AUTO_APPLY_THRESHOLD` | number | `0.8` | No | Minimum confidence score (0.0-1.0) for auto-applying enrichment data |
| `WORKER_CONCURRENCY_EMAIL_SYNC` | number | `5` | No | Concurrent jobs for the email-sync queue |
| `WORKER_CONCURRENCY_CALENDAR_SYNC` | number | `5` | No | Concurrent jobs for the calendar-sync queue |
| `WORKER_CONCURRENCY_AI_JOBS` | number | `3` | No | Concurrent jobs for the ai-jobs queue |
| `WORKER_CONCURRENCY_AI_SUMMARY` | number | `3` | No | Concurrent jobs for the ai-summary queue |
| `WORKER_CONCURRENCY_SCORING` | number | `10` | No | Concurrent jobs for the scoring queue |
| `WORKER_CONCURRENCY_ENRICHMENT` | number | `5` | No | Concurrent jobs for the enrichment queue |
| `WORKER_CONCURRENCY_WEBHOOK_DISPATCH` | number | `10` | No | Concurrent jobs for the webhook-dispatch queue |
| `WORKER_CONCURRENCY_WEBHOOK` | number | `10` | No | Concurrent jobs for the webhook queue |
| `RATE_LIMIT_API_WINDOW_MS` | number | `60000` | No | Rate limit window for REST API (milliseconds) |
| `RATE_LIMIT_API_MAX_REQUESTS` | number | `100` | No | Maximum REST API requests per window per API key |
| `RATE_LIMIT_AUTH_WINDOW_MS` | number | `900000` | No | Rate limit window for auth endpoints (milliseconds). Default: 15 minutes |
| `RATE_LIMIT_AUTH_MAX_REQUESTS` | number | `10` | No | Maximum auth requests per window per IP |

> \* At least one OAuth provider (Google or Microsoft) must be configured for
> users to sign in. Both can be configured simultaneously.

---

## Auth Provider Setup

### Google OAuth

**Step 1: Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. [Screenshot: Google Cloud Console project selector showing "Create Project" button]

**Step 2: Configure the OAuth Consent Screen**

1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** user type (or **Internal** if using Google Workspace and
   only your organization needs access).
3. Fill in the required fields:
   - **App name:** NativeCRM (or your organization's name)
   - **User support email:** Your support email
   - **Authorized domains:** `yourdomain.com`
   - **Developer contact email:** Your email
4. [Screenshot: OAuth consent screen configuration form with app name and email fields]

**Step 3: Add Scopes**

Add the following scopes:
- `openid` (always required)
- `email` (always required)
- `profile` (always required)
- `https://www.googleapis.com/auth/gmail.readonly` (for email sync)
- `https://www.googleapis.com/auth/gmail.send` (for sending follow-up emails)
- `https://www.googleapis.com/auth/calendar.readonly` (for calendar sync)

[Screenshot: Scopes selection screen with the above scopes checked]

**Step 4: Create OAuth Client Credentials**

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Application type: **Web application**.
4. Name: NativeCRM.
5. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://crm.yourdomain.com/api/auth/callback/google`
6. [Screenshot: OAuth client creation form showing the redirect URI field]
7. Copy the **Client ID** and **Client Secret**.

**Step 5: Set Environment Variables**

```dotenv
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Microsoft Azure AD OAuth

**Step 1: Register an Application**

1. Go to [Azure Portal](https://portal.azure.com/) > **Azure Active Directory** > **App registrations**.
2. Click **New registration**.
3. Name: NativeCRM.
4. Supported account types:
   - **Single tenant** if only your organization needs access.
   - **Multi-tenant** (Accounts in any organizational directory) for broader
     access. Use tenant ID `common`.
5. Redirect URI: **Web** platform, URI:
   - Development: `http://localhost:3000/api/auth/callback/azure-ad`
   - Production: `https://crm.yourdomain.com/api/auth/callback/azure-ad`
6. [Screenshot: Azure AD app registration form with name and redirect URI]

**Step 2: Note Application IDs**

From the app's **Overview** page, copy:
- **Application (client) ID** -- this is `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** -- this is `AZURE_AD_TENANT_ID`

[Screenshot: Azure AD app overview showing Application ID and Directory ID]

**Step 3: Create a Client Secret**

1. Navigate to **Certificates & secrets > Client secrets**.
2. Click **New client secret**.
3. Description: NativeCRM Production.
4. Expiry: 24 months (set a reminder to rotate before expiry).
5. Copy the secret **Value** (not the ID). This is `AZURE_AD_CLIENT_SECRET`.

[Screenshot: Client secret creation dialog with description and expiry fields]

**Step 4: Configure API Permissions**

Add the following Microsoft Graph delegated permissions:
- `openid`
- `email`
- `profile`
- `User.Read`
- `Mail.Read` (for email sync)
- `Mail.Send` (for sending follow-up emails)
- `Calendars.Read` (for calendar sync)

If your Azure AD requires admin consent for these permissions, click
**Grant admin consent**.

[Screenshot: API permissions page with the above permissions listed and grant button]

**Step 5: Set Environment Variables**

```dotenv
AZURE_AD_CLIENT_ID=12345678-abcd-efgh-ijkl-1234567890ab
AZURE_AD_CLIENT_SECRET=abc~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_AD_TENANT_ID=12345678-abcd-efgh-ijkl-1234567890ab
```

For multi-tenant access, use `AZURE_AD_TENANT_ID=common`.

---

## Database Configuration

### Connection String Format

```
postgresql://user:password@host:port/database?sslmode=require&connection_limit=20
```

| Parameter | Description |
|-----------|-------------|
| `sslmode=require` | Enforce SSL connections (recommended for production). Omit for local development. |
| `connection_limit=20` | Maximum connections from the application pool. Default varies by driver. |
| `connect_timeout=10` | Connection timeout in seconds. |
| `idle_timeout=30` | Idle connection timeout in seconds. |

### SSL Configuration

For production PostgreSQL with SSL, append to the connection string:

```
?sslmode=require
```

If your PostgreSQL server uses a self-signed certificate, set:

```
?sslmode=require&sslrootcert=/path/to/ca.pem
```

### Connection Pooling

The Drizzle ORM `postgres` driver maintains a connection pool internally. For
high-traffic deployments, use PgBouncer as an external connection pooler:

```
# Application connects to PgBouncer
DATABASE_URL="postgresql://crm:password@localhost:6432/ai_native_crm"

# PgBouncer connects to PostgreSQL
# Configure pgbouncer.ini with pool_mode=transaction
```

### Database Timeouts

Default query timeout is handled at the application level. For PostgreSQL
server-side timeouts:

```sql
ALTER DATABASE ai_native_crm SET statement_timeout = '30s';
ALTER DATABASE ai_native_crm SET idle_in_transaction_session_timeout = '60s';
```

---

## Redis Configuration

### Connection String Format

```
redis://:password@host:port/database_number
```

| Parameter | Description |
|-----------|-------------|
| Password | Required in production. Omit for local development without auth. |
| Database number | Default `0`. Use a unique number if sharing a Redis instance. |

### Key Prefix

NativeCRM prefixes all Redis keys with `ncrm:` to avoid collisions when sharing
a Redis instance with other applications. This is not configurable.

### Connection Options

The ioredis client uses the following defaults:

| Option | Default | Description |
|--------|---------|-------------|
| `maxRetriesPerRequest` | `3` | Retries before failing a command |
| `retryStrategy` | Exponential backoff | Reconnection strategy on disconnect |
| `enableReadyCheck` | `true` | Verify Redis is ready before sending commands |
| `lazyConnect` | `false` | Connect immediately on client creation |

### TLS / SSL

For managed Redis with TLS (e.g., Upstash, ElastiCache with encryption in
transit):

```
REDIS_URL="rediss://:password@host:port"
```

Note the `rediss://` scheme (with double s) for TLS connections.

---

## BullMQ Worker Configuration

NativeCRM uses 8 BullMQ queues for background processing:

| Queue | Default Concurrency | Retry Policy | Rate Limit |
|-------|--------------------:|--------------|------------|
| `email-sync` | 5 | 3 retries, exponential backoff (30s, 120s, 600s) | 10 jobs/min per OAuth connection |
| `calendar-sync` | 5 | 3 retries, exponential backoff | 10 jobs/min per OAuth connection |
| `ai-jobs` | 3 | 2 retries, exponential backoff (60s, 300s) | Anthropic API rate limits |
| `ai-summary` | 3 | 2 retries, exponential backoff (60s, 300s) | Anthropic API rate limits |
| `scoring` | 10 | 1 retry, 30s delay | None |
| `enrichment` | 5 | 3 retries, exponential backoff | Per-source rate limits |
| `webhook-dispatch` | 10 | 3 retries, exponential backoff (30s, 120s, 600s) | None |
| `webhook` | 10 | 3 retries, exponential backoff (30s, 120s, 600s) | None |

**Override concurrency** via environment variables:

```dotenv
WORKER_CONCURRENCY_EMAIL_SYNC=10
WORKER_CONCURRENCY_AI_JOBS=5
WORKER_CONCURRENCY_SCORING=20
```

**Retry policy** is not configurable via environment variables. Modify
`src/server/workers/` to change retry behavior.

**Stalled job detection:** Jobs that do not complete within 30 minutes are
marked as stalled and retried. This protects against worker crashes mid-job.

---

## AI Configuration

NativeCRM uses the Anthropic Claude API for:
- Meeting summary generation
- Follow-up email drafting
- Contact/company extraction from email content
- Meeting prep briefings (via MCP)

### Model Selection

```dotenv
# Default model for all AI features
AI_MODEL=claude-sonnet-4-20250514

# Recommended models by use case:
# - claude-sonnet-4-20250514: Good balance of speed and quality (default)
# - claude-opus-4-20250514: Highest quality, slower, higher cost
# - claude-haiku-3-5-20241022: Fastest, lowest cost, suitable for extraction tasks
```

### Token Limits

```dotenv
# Maximum output tokens for AI responses
AI_MAX_TOKENS=4096

# For meeting summaries, the system uses up to 8000 input tokens of context
# (email threads + calendar details). Longer threads are truncated with a
# priority on recent messages.
```

### Temperature

```dotenv
# Controls randomness in AI output.
# 0.0 = deterministic (same input always produces same output)
# 1.0 = maximum creativity
# Recommended: 0.3 for summaries, 0.5 for follow-up drafts
AI_TEMPERATURE=0.3
```

### Cost Considerations

AI features consume Anthropic API credits. Approximate per-operation costs
(as of 2026):

| Operation | Typical Input Tokens | Typical Output Tokens | Approximate Cost |
|-----------|---------------------:|----------------------:|-----------------:|
| Meeting summary | 4,000-8,000 | 500-1,500 | $0.01-0.03 |
| Follow-up draft | 2,000-4,000 | 300-800 | $0.005-0.015 |
| Contact extraction | 1,000-2,000 | 200-400 | $0.002-0.005 |

For workspaces with heavy meeting activity, expect approximately $5-15/user/month
in API costs.

---

## Email Sync Settings

```dotenv
# Number of days of email history to fetch on initial sync
# Range: 1-90. Higher values increase initial sync time.
EMAIL_SYNC_WINDOW_DAYS=30

# Number of emails to process per batch
# Higher values increase throughput but consume more memory.
EMAIL_SYNC_BATCH_SIZE=100

# Polling interval for incremental sync (milliseconds)
# 300000 = 5 minutes. Minimum recommended: 60000 (1 minute).
EMAIL_SYNC_POLL_INTERVAL_MS=300000

# Calendar sync polling interval (milliseconds)
CALENDAR_SYNC_POLL_INTERVAL_MS=300000
```

### Excluded Domains

Users configure excluded domains (e.g., their own organization's domain) in the
web UI at **Settings > Integrations**. Emails from excluded domains do not
trigger contact auto-creation or activity logging.

### Push Notifications vs. Polling

When available (Gmail push notifications via Pub/Sub, Microsoft Graph change
notifications), the system prefers push notifications over polling. Polling
serves as a fallback when push setup is not configured or when push delivery
fails.

---

## Enrichment Source Configuration

Enrichment sources are configured by workspace admins in **Settings > Integrations > Enrichment**.

### Available Sources

| Source | Data Type | API Key Required | Rate Limit |
|--------|-----------|:----------------:|------------|
| OpenCorporates | Company registration, industry, directors | Yes (free tier available) | 50 req/day (free), 1000 req/day (paid) |
| Companies House (UK) | UK company filings, directors, SIC codes | Yes (free) | 600 req/5min |
| SEC EDGAR (US) | US public company filings | No | 10 req/sec |

### Confidence Thresholds

```dotenv
# Enrichment data with confidence >= this threshold is auto-applied.
# Data below this threshold is queued for manual review.
# Range: 0.0-1.0. Default: 0.8
ENRICHMENT_AUTO_APPLY_THRESHOLD=0.8
```

### GDPR Compliance

Enrichment is disabled by default. When enabled:
- Every enriched field includes a source URL and timestamp for auditability.
- GDPR Article 14 transparency notices are generated on request.
- Right-to-erasure reverts all enriched data and removes AI summaries
  mentioning the contact.
- A Legitimate Interest Assessment document template is available in the admin
  settings.

---

## Rate Limiting

Rate limiting is applied at two levels:

### REST API Rate Limits

```dotenv
# Window duration in milliseconds
RATE_LIMIT_API_WINDOW_MS=60000

# Maximum requests per window per API key
RATE_LIMIT_API_MAX_REQUESTS=100
```

Rate limit status is returned in response headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

When the limit is exceeded, the API returns HTTP 429 with a `Retry-After`
header.

### Authentication Rate Limits

```dotenv
# Window duration for auth endpoints (milliseconds). Default: 15 minutes.
RATE_LIMIT_AUTH_WINDOW_MS=900000

# Maximum auth attempts per window per IP address
RATE_LIMIT_AUTH_MAX_REQUESTS=10
```

This protects against brute-force attacks on the OAuth flow and API token
validation.

### Rate Limit Storage

Rate limit counters are stored in Redis with automatic expiry. If Redis is
unavailable, rate limiting degrades gracefully (requests are allowed through).

---

## Security Headers

NativeCRM sets the following security headers on all responses via
`next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer information |
| `Content-Security-Policy` | (see below) | Restrict resource loading |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforce HTTPS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused browser APIs |

### Content Security Policy

The default CSP allows:
- Scripts from `'self'`, `'unsafe-inline'`, `'unsafe-eval'` (required by Next.js)
- Styles from `'self'`, `'unsafe-inline'`
- Images from `'self'`, `data:`, `blob:`
- Fonts from `'self'`
- Connections to `'self'`, `accounts.google.com`, `login.microsoftonline.com`
- No frame ancestors (prevents embedding)

To customize, edit the `headers()` function in `target/next.config.ts`.

---

## CORS Configuration

CORS is applied to all `/api/*` routes:

```dotenv
# Allowed origin for cross-origin API requests.
# Set to the application URL for same-origin requests.
# Set to a specific external domain for cross-origin access.
# Leave empty to disable CORS (no cross-origin requests allowed).
CORS_ORIGIN=https://crm.yourdomain.com
```

The following methods and headers are allowed:
- **Methods:** GET, POST, PATCH, DELETE, OPTIONS
- **Headers:** Content-Type, Authorization

To allow multiple origins or use wildcards, modify the `headers()` function in
`target/next.config.ts`. Using `*` as the CORS origin is not recommended for
production.

---

## Logging

### Log Level

```dotenv
# Available levels: debug, info, warn, error
# debug: Verbose output including query details and job processing steps.
# info: Standard operational messages (default).
# warn: Potential issues that do not prevent operation.
# error: Errors that require attention.
LOG_LEVEL=info
```

### Log Format

```dotenv
# json: Structured JSON, one object per line. Recommended for production.
# pretty: Human-readable with colors. Recommended for local development.
LOG_FORMAT=json
```

### Log Output

All logs are written to stdout. Use your infrastructure's log collection
mechanism to aggregate:

- **Docker:** `docker compose logs -f app worker`
- **PM2:** `pm2 logs`
- **systemd:** `journalctl -u nativecrm -f`
- **Cloud:** CloudWatch Logs, Datadog, Loki, etc.

### Structured Log Fields

JSON log entries include:

```json
{
  "level": "info",
  "timestamp": "2026-05-12T14:30:00.000Z",
  "message": "Email sync completed",
  "service": "email-sync",
  "workspaceId": "uuid",
  "userId": "uuid",
  "duration": 1234,
  "emailsProcessed": 47
}
```

### Query Logging

In development, set `LOG_LEVEL=debug` to see all database queries. In
production, PostgreSQL server-side logging (`log_min_duration_statement`) is
recommended instead.
