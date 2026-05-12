# NativeCRM Quick Start Guide

Get NativeCRM running locally in under 10 minutes. This guide covers both
Docker-based and bare-metal setups.

---

## Prerequisites

| Software | Version | Required for |
|----------|---------|--------------|
| Node.js | 22 LTS or later | Application runtime |
| pnpm | 9+ | Package management |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Job queues and caching |
| Docker & Docker Compose | Latest stable | Docker-based setup (alternative to manual Postgres/Redis) |
| Git | 2.x | Cloning the repository |

> **Tip:** If you choose the Docker path, you only need Docker, Git, Node.js,
> and pnpm installed on your machine. PostgreSQL and Redis run as containers.

---

## 1. Clone and Install

```bash
git clone https://github.com/your-org/ai-native-crm.git
cd ai-native-crm/target
pnpm install
```

All application code, configuration, and scripts live inside the `target/`
directory. Every `pnpm` command in this guide should be run from there.

---

## 2. Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor. The following variables must be configured:

### Database and Cache

```dotenv
# PostgreSQL connection string
# Docker path default: postgresql://crm:crm@localhost:5432/ai_native_crm
# Adjust host, port, user, password, and database name for your setup.
DATABASE_URL="postgresql://crm:crm@localhost:5432/ai_native_crm"

# Redis connection string
# Docker path default: redis://localhost:6379
REDIS_URL="redis://localhost:6379"
```

### Authentication

```dotenv
# A random secret used to sign session tokens. Generate one with:
#   openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret-here"

# The URL where NativeCRM is accessible.
# For local development this is almost always:
NEXTAUTH_URL="http://localhost:3000"
```

### OAuth Providers

You need at least one OAuth provider configured to log in. See
[configuration.md](configuration.md) for detailed setup instructions for each
provider.

```dotenv
# Google OAuth (optional if using Microsoft)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Microsoft / Azure AD OAuth (optional if using Google)
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""
```

### AI Features

```dotenv
# Anthropic API key for Claude-powered summaries, follow-ups, and extraction.
# Get one at https://console.anthropic.com/
ANTHROPIC_API_KEY=""
```

### API and Security

```dotenv
# Secret for authenticating REST API requests (Bearer token).
# Generate with: openssl rand -base64 32
API_SECRET=""

# 32-byte hex key for encrypting OAuth tokens at rest (AES-256-GCM).
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=""

# Allowed CORS origin for the REST API.
# For local development:
CORS_ORIGIN="http://localhost:3000"
```

> **Security note:** Never commit `.env.local` to version control. The
> `.gitignore` file already excludes it.

---

## 3. Start Infrastructure

Choose **one** of the two paths below.

### Path A: With Docker (recommended for quick start)

Start PostgreSQL and Redis as containers:

```bash
docker compose up -d postgres redis
```

Wait for both services to become healthy:

```bash
docker compose ps
```

You should see both `postgres` and `redis` with status `Up (healthy)`.

### Path B: Without Docker

Install and start PostgreSQL 16 and Redis 7 using your system package manager
or installer.

**macOS (Homebrew):**

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
```

**Ubuntu/Debian:**

```bash
sudo apt install postgresql-16 redis-server
sudo systemctl start postgresql redis-server
```

Create the database and user:

```bash
sudo -u postgres psql -c "CREATE USER crm WITH PASSWORD 'crm';"
sudo -u postgres psql -c "CREATE DATABASE ai_native_crm OWNER crm;"
```

Update `DATABASE_URL` and `REDIS_URL` in `.env.local` if your host, port, or
credentials differ from the defaults.

---

## 4. Database Setup

Push the Drizzle ORM schema to your database:

```bash
pnpm drizzle-kit push
```

This creates all tables, indexes, and constraints. For a fresh database this is
equivalent to running all migrations.

Optionally, seed the database with sample data for exploration:

```bash
pnpm tsx scripts/seed.ts
```

---

## 5. Start the Development Server

```bash
pnpm dev
```

NativeCRM starts on [http://localhost:3000](http://localhost:3000).

> **Workers:** Background job processing (email sync, AI summaries, scoring)
> requires a separate worker process. For quick start purposes the web
> application works without workers; synced data and AI features activate once
> workers are running. See [deployment-guide.md](deployment-guide.md) for worker
> setup.

---

## 6. Create Your First Workspace and Log In

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **Sign in with Google** or **Sign in with Microsoft** (depending on
   which OAuth provider you configured).
3. Complete the OAuth flow. On first login a workspace is provisioned by the
   system admin (see the project spec for workspace provisioning details).
4. You land on the **Dashboard** with an empty pipeline board.

---

## 7. Quick Smoke Test Checklist

Run through these steps to verify everything is working:

- [ ] **Login:** OAuth sign-in completes and the dashboard loads.
- [ ] **Create a contact:** Navigate to Contacts, click "New Contact," fill in
      a name and email, and save. The contact appears in the list.
- [ ] **Create a company:** Navigate to Companies, create a company with a name
      and domain.
- [ ] **Create a deal:** Navigate to Deals, create a deal with a name, amount,
      and company. The deal appears on the pipeline board.
- [ ] **Drag a deal:** Drag the deal card from one stage to another. The card
      moves immediately and the stage totals update.
- [ ] **View a contact detail page:** Click a contact name. The detail page
      loads with an empty activity timeline.
- [ ] **Global search:** Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux) to
      open the command palette. Search for the contact you created.
- [ ] **API health check:** Open
      [http://localhost:3000/api/v1/contacts](http://localhost:3000/api/v1/contacts)
      in your browser or with `curl`. You should get a JSON response (or a 401
      if no API token is set).

---

## 8. Next Steps

With the basics running, explore these features:

- **Connect email:** Go to Settings > Integrations and connect your Gmail or
  Outlook account. Emails from the past 30 days will sync automatically,
  creating contacts and logging activities.
- **Connect calendar:** In the same Integrations page, connect Google Calendar
  or Outlook Calendar. Meetings appear as activities linked to contacts.
- **Enable AI features:** With `ANTHROPIC_API_KEY` configured and workers
  running, meeting summaries and follow-up drafts generate automatically.
- **Explore the REST API:** Visit `/api/v1/openapi.json` for the full OpenAPI
  3.1 specification.
- **Set up MCP:** Connect Claude Desktop or another MCP client to
  `http://localhost:3000/api/mcp` with an MCP API key. See
  [integration-guide.md](integration-guide.md) for details.

For production deployment, see [deployment-guide.md](deployment-guide.md).
For full configuration options, see [configuration.md](configuration.md).

---

## Troubleshooting

### `pnpm install` fails with lockfile errors

Make sure you are using pnpm 9 or later:

```bash
pnpm --version
```

If using an older version, upgrade with `corepack enable && corepack prepare pnpm@latest --activate`.

### Database connection refused

- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- If using Docker: `docker compose ps` should show `postgres` as healthy.
- Check that `DATABASE_URL` in `.env.local` matches your actual connection
  details.

### Redis connection refused

- Verify Redis is running: `redis-cli ping` should return `PONG`.
- If using Docker: `docker compose ps` should show `redis` as healthy.

### OAuth redirect mismatch

- Ensure `NEXTAUTH_URL` matches the URL in your browser (including port).
- In Google Cloud Console / Azure AD, verify the redirect URI is set to
  `http://localhost:3000/api/auth/callback/google` (or `/azure-ad`).

### Port 3000 already in use

Another process is using port 3000. Either stop it or start NativeCRM on a
different port:

```bash
PORT=3001 pnpm dev
```

Update `NEXTAUTH_URL` and `CORS_ORIGIN` to match the new port.
