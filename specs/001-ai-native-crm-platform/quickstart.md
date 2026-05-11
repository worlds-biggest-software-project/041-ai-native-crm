# Quickstart: AI-Native CRM

## Prerequisites

- Node.js 22 LTS
- pnpm 9
- Docker and Docker Compose
- Google Cloud Console project (for Gmail/Calendar OAuth)
- Microsoft Azure AD app registration (for Outlook OAuth)
- Anthropic API key (for AI features)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> ai-native-crm
cd ai-native-crm
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d postgres redis
```

This starts PostgreSQL 16 on `localhost:5432` and Redis 7 on `localhost:6379`.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://crm:crm@localhost:5432/ai_native_crm
REDIS_URL=redis://localhost:6379
AUTH_SECRET=<generate: openssl rand -base64 32>
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>
AUTH_MICROSOFT_ENTRA_ID_ID=<from Azure AD>
AUTH_MICROSOFT_ENTRA_ID_SECRET=<from Azure AD>
ANTHROPIC_API_KEY=<from Anthropic Console>
ENCRYPTION_KEY=<generate: openssl rand -hex 32>
```

### 4. Run database migrations

```bash
pnpm drizzle-kit push
```

### 5. Seed development data

```bash
pnpm tsx scripts/seed.ts
```

Creates a workspace "Acme Sales Team" with 3 users, 50 companies, 200 contacts, 30 deals, and 500 activities.

### 6. Start the application

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

### 7. Start background workers (separate terminal)

```bash
pnpm tsx src/server/workers/index.ts
```

Workers handle email sync, calendar sync, AI summarization, scoring, enrichment, and webhook dispatch.

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest (unit + integration) |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm drizzle-kit generate` | Generate migration from schema changes |
| `pnpm drizzle-kit push` | Apply schema to database |
| `pnpm tsx scripts/seed.ts` | Seed development data |

## Docker (full stack)

```bash
docker compose up
```

Starts PostgreSQL, Redis, and the Next.js app in development mode with hot reload.

## Production Build

```bash
docker build -t ai-native-crm .
docker run -p 3000:3000 --env-file .env ai-native-crm
```

The multi-stage Dockerfile produces a standalone Node.js production image.

## Connecting Email/Calendar

1. Log in as an admin user
2. Navigate to Settings > Integrations
3. Click "Connect Gmail" or "Connect Outlook"
4. Complete the OAuth flow
5. Initial sync begins automatically (30-day lookback)

## Connecting AI Assistants (MCP)

1. Navigate to Settings > Integrations > AI Assistants (MCP)
2. Click "Generate API Key"
3. Copy the key (displayed once)
4. Configure your AI assistant (Claude Desktop, Cursor, etc.) with:
   - Server URL: `https://your-domain/api/mcp`
   - API Key: the generated key
