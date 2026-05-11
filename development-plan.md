# AI-Native CRM — Phased Development Plan

> Project: 041-ai-native-crm · Created: 2026-05-12
> Purpose: Provide sufficient detail for Claude Code (Opus) to implement each phase end-to-end.

---

## Technology Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | TypeScript 5.x (strict mode) | Full-stack type safety; largest CRM ecosystem (Twenty, Attio SDKs) is TypeScript; end-to-end type sharing between API and frontend eliminates interface drift |
| Runtime | Node.js 22 LTS | Native ESM, built-in test runner fallback, stable LTS for production CRM workloads |
| API framework | Next.js 15 App Router + tRPC v11 | App Router provides SSR/RSC for dashboard pages; tRPC gives end-to-end type-safe RPC eliminating OpenAPI code-gen overhead; REST routes co-exist for external integrations |
| Database | PostgreSQL 16 | JSONB + GIN indexes power the hybrid relational/custom-fields model (data-model-suggestion-3); RLS for workspace isolation; partitioning for audit logs; broadest extension ecosystem (pgvector, pg_cron) |
| ORM | Drizzle ORM | Type-safe schema-as-code with zero-overhead SQL generation; native JSONB column support; migration generation from schema diffs; lighter than Prisma for JSONB-heavy models |
| Task queue | BullMQ 5.x on Redis 7 | Handles email/calendar sync polling, AI summarization jobs, scoring pipeline, enrichment batches, webhook delivery; repeatable jobs for sync scheduling; rate limiting for API quotas |
| Frontend | React 19 + Next.js 15 App Router | Server Components reduce client JS bundle; Suspense boundaries for progressive loading of pipeline boards and activity timelines |
| UI components | shadcn/ui + Tailwind CSS 4 | Accessible, composable component library; Kanban board via @dnd-kit; data tables via TanStack Table v8 |
| Authentication | Auth.js v5 (NextAuth) | Built-in OAuth 2.0 providers (Google, Microsoft); OIDC support for enterprise SSO; JWT session strategy for API routes |
| AI / LLM | Anthropic Claude SDK + Vercel AI SDK 4 | Claude for meeting summaries, follow-up drafts, entity extraction; Vercel AI SDK for streaming responses and structured output; provider-swappable architecture |
| ML scoring | ONNX Runtime for Node.js + Python training scripts | Feature engineering in TypeScript; model training in Python (scikit-learn / XGBoost); ONNX export for Node.js inference; avoids Python runtime in production |
| Email sync | Google Gmail API + Microsoft Graph API | OAuth 2.0 mandatory for both providers since 2024; push notifications (Gmail) / change notifications (Graph) for real-time sync; replaces deprecated IMAP plain-auth |
| MCP server | @modelcontextprotocol/sdk | Official MCP TypeScript SDK; exposes CRM resources, tools, and prompts per MCP spec 2025-11-25 |
| Testing | Vitest + Playwright | Vitest for unit/integration (fast, ESM-native); Playwright for E2E browser tests of pipeline board and dashboard |
| Containerisation | Docker + docker-compose | Single `docker compose up` for PostgreSQL, Redis, and app; multi-stage Dockerfile for production image |
| Code quality | ESLint 9 (flat config) + Prettier | TypeScript strict mode enforced; no-explicit-any rule; consistent formatting |
| Package manager | pnpm 9 | Strict dependency resolution; workspace support if monorepo needed later; faster installs than npm |

### Project Structure

```
ai-native-crm/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── drizzle.config.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing / dashboard redirect
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Sidebar + header shell
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx          # Contact list
│   │   │   │   └── [id]/page.tsx     # Contact detail
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── deals/
│   │   │   │   ├── page.tsx          # Pipeline board (Kanban)
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── activities/page.tsx   # Unified activity timeline
│   │   │   ├── settings/
│   │   │   │   ├── workspace/page.tsx
│   │   │   │   ├── integrations/page.tsx
│   │   │   │   ├── custom-fields/page.tsx
│   │   │   │   └── webhooks/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── api/
│   │       ├── trpc/[trpc]/route.ts  # tRPC handler
│   │       ├── webhooks/
│   │       │   ├── gmail/route.ts    # Gmail push notification receiver
│   │       │   └── outlook/route.ts  # Microsoft Graph change notification
│   │       ├── mcp/route.ts          # MCP server HTTP transport
│   │       └── v1/                   # Public REST API
│   │           ├── contacts/route.ts
│   │           ├── companies/route.ts
│   │           ├── deals/route.ts
│   │           └── activities/route.ts
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle client
│   │   │   ├── schema/
│   │   │   │   ├── workspaces.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   ├── companies.ts
│   │   │   │   ├── pipelines.ts
│   │   │   │   ├── deals.ts
│   │   │   │   ├── activities.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── ai-summaries.ts
│   │   │   │   ├── ai-follow-ups.ts
│   │   │   │   ├── scoring.ts
│   │   │   │   ├── enrichment.ts
│   │   │   │   ├── oauth-connections.ts
│   │   │   │   ├── webhooks.ts
│   │   │   │   ├── workflows.ts
│   │   │   │   ├── field-definitions.ts
│   │   │   │   ├── custom-objects.ts
│   │   │   │   ├── mcp-tools.ts
│   │   │   │   ├── tags.ts
│   │   │   │   └── audit-log.ts
│   │   │   └── migrations/
│   │   ├── trpc/
│   │   │   ├── router.ts             # Root tRPC router
│   │   │   ├── context.ts
│   │   │   └── routers/
│   │   │       ├── contacts.ts
│   │   │       ├── companies.ts
│   │   │       ├── deals.ts
│   │   │       ├── activities.ts
│   │   │       ├── pipelines.ts
│   │   │       ├── ai.ts
│   │   │       ├── scoring.ts
│   │   │       ├── enrichment.ts
│   │   │       ├── sync.ts
│   │   │       ├── webhooks.ts
│   │   │       ├── workflows.ts
│   │   │       ├── custom-fields.ts
│   │   │       └── settings.ts
│   │   ├── services/
│   │   │   ├── email-sync/
│   │   │   │   ├── gmail.ts
│   │   │   │   ├── outlook.ts
│   │   │   │   └── parser.ts         # Email → Activity + Contact extraction
│   │   │   ├── calendar-sync/
│   │   │   │   ├── google-calendar.ts
│   │   │   │   └── outlook-calendar.ts
│   │   │   ├── ai/
│   │   │   │   ├── meeting-summary.ts
│   │   │   │   ├── follow-up-draft.ts
│   │   │   │   ├── entity-extraction.ts
│   │   │   │   └── prompts.ts
│   │   │   ├── scoring/
│   │   │   │   ├── feature-engineering.ts
│   │   │   │   ├── inference.ts       # ONNX Runtime inference
│   │   │   │   └── pipeline.ts
│   │   │   ├── enrichment/
│   │   │   │   ├── sources/
│   │   │   │   │   ├── opencorporates.ts
│   │   │   │   │   └── company-registries.ts
│   │   │   │   ├── enrichment-engine.ts
│   │   │   │   └── gdpr-compliance.ts
│   │   │   ├── mcp/
│   │   │   │   ├── server.ts
│   │   │   │   ├── resources.ts
│   │   │   │   ├── tools.ts
│   │   │   │   └── prompts.ts
│   │   │   ├── webhook-dispatch.ts
│   │   │   └── workflow-engine.ts
│   │   ├── workers/
│   │   │   ├── index.ts               # BullMQ worker bootstrap
│   │   │   ├── email-sync.worker.ts
│   │   │   ├── calendar-sync.worker.ts
│   │   │   ├── ai-summary.worker.ts
│   │   │   ├── scoring.worker.ts
│   │   │   ├── enrichment.worker.ts
│   │   │   └── webhook.worker.ts
│   │   └── lib/
│   │       ├── auth.ts                # Auth.js configuration
│   │       ├── queue.ts               # BullMQ queue definitions
│   │       ├── redis.ts
│   │       ├── encryption.ts          # Token encryption at rest
│   │       └── validators.ts          # Zod schemas shared with tRPC
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── command-palette.tsx
│   │   ├── contacts/
│   │   │   ├── contact-table.tsx
│   │   │   ├── contact-detail.tsx
│   │   │   └── contact-form.tsx
│   │   ├── companies/
│   │   │   ├── company-table.tsx
│   │   │   ├── company-detail.tsx
│   │   │   └── company-form.tsx
│   │   ├── deals/
│   │   │   ├── pipeline-board.tsx     # Kanban DnD board
│   │   │   ├── deal-card.tsx
│   │   │   ├── deal-detail.tsx
│   │   │   └── deal-form.tsx
│   │   ├── activities/
│   │   │   ├── activity-timeline.tsx
│   │   │   ├── activity-item.tsx
│   │   │   └── email-thread.tsx
│   │   ├── ai/
│   │   │   ├── meeting-summary-card.tsx
│   │   │   ├── follow-up-draft.tsx
│   │   │   └── score-badge.tsx
│   │   └── shared/
│   │       ├── entity-tags.tsx
│   │       ├── custom-field-renderer.tsx
│   │       └── empty-state.tsx
│   └── lib/
│       ├── trpc-client.ts
│       └── utils.ts
├── scripts/
│   ├── seed.ts                        # Development seed data
│   └── train-scoring-model.py         # Python ML training script
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
└── public/
```

---

## Phase 1: Foundation & Project Scaffold

### Purpose
Establish the project skeleton, database connection, authentication, and development environment. After this phase, a developer can run the app locally with Docker, authenticate via email/password, and hit an empty authenticated API.

### Tasks

#### 1.1 — Project Initialisation

**What**: Scaffold the Next.js 15 project with TypeScript, Tailwind CSS, ESLint, and pnpm.

**Design**:

```bash
pnpm create next-app@latest ai-native-crm --typescript --tailwind --eslint --app --src-dir
cd ai-native-crm
pnpm add drizzle-orm postgres @auth/core @auth/drizzle-adapter
pnpm add -D drizzle-kit @types/node vitest
```

`tsconfig.json` strict mode settings:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`.env.example`:
```env
DATABASE_URL=postgresql://crm:crm@localhost:5432/ai_native_crm
REDIS_URL=redis://localhost:6379
AUTH_SECRET=<random-32-bytes>
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_MICROSOFT_ENTRA_ID_ID=
AUTH_MICROSOFT_ENTRA_ID_SECRET=
ANTHROPIC_API_KEY=
ENCRYPTION_KEY=<random-32-bytes-hex>
```

**Testing**:
- Unit: `pnpm build` succeeds with zero errors
- Unit: `pnpm lint` passes with no warnings
- Unit: TypeScript strict mode catches missing null checks

#### 1.2 — Docker Compose Environment

**What**: Docker Compose configuration for PostgreSQL 16, Redis 7, and the app in development mode.

**Design**:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ai_native_crm
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: crm
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://crm:crm@postgres:5432/ai_native_crm
      REDIS_URL: redis://redis:6379
    depends_on: [postgres, redis]
    volumes: ["./src:/app/src"]

volumes:
  pgdata:
```

Multi-stage `Dockerfile`:
```dockerfile
FROM node:22-alpine AS base
RUN corepack enable pnpm

FROM base AS development
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
CMD ["pnpm", "dev"]

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS production
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

**Testing**:
- Integration: `docker compose up -d postgres redis` starts services; `psql` connects successfully
- Integration: `docker compose up app` starts Next.js dev server at localhost:3000

#### 1.3 — Database Schema & Migrations (Core Tables)

**What**: Drizzle ORM schema definitions for workspaces, users, and core infrastructure tables. Based on data-model-suggestion-3 (Hybrid Relational+JSONB).

**Design**:

```typescript
// src/server/db/schema/workspaces.ts
import { pgTable, uuid, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: varchar("plan", { length: 50 }).notNull().default("free"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// src/server/db/schema/users.ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_users_workspace_email").on(table.workspaceId, table.email),
  index("idx_users_workspace").on(table.workspaceId),
]);
```

```typescript
// src/server/db/schema/field-definitions.ts
export const fieldDefinitions = pgTable("field_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  fieldKey: varchar("field_key", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").notNull().default(false),
  isUnique: boolean("is_unique").notNull().default(false),
  defaultValue: jsonb("default_value"),
  validation: jsonb("validation"),
  options: jsonb("options"),
  displayOrder: integer("display_order").notNull().default(0),
  groupName: varchar("group_name", { length: 100 }),
  isSystem: boolean("is_system").notNull().default(false),
  gdprCategory: varchar("gdpr_category", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_field_def_workspace_entity_key").on(table.workspaceId, table.entityType, table.fieldKey),
  index("idx_field_definitions_workspace").on(table.workspaceId, table.entityType),
]);
```

Drizzle config:
```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/server/db/schema/*",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Testing**:
- Unit: Drizzle schema compiles with zero type errors
- Integration: `pnpm drizzle-kit push` applies schema to local PostgreSQL; `\dt` lists workspaces, users, field_definitions tables
- Integration: Insert a workspace and user; verify foreign key constraint holds
- Integration: Unique constraint on (workspace_id, email) rejects duplicate

#### 1.4 — Authentication with Auth.js

**What**: Auth.js v5 configuration with Google OAuth provider, email/password fallback for development, and workspace-scoped sessions.

**Design**:

```typescript
// src/server/lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.workspaceId = user.workspaceId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.workspaceId = token.workspaceId as string;
      session.user.role = token.role as string;
      return session;
    },
  },
});
```

Session type augmentation:
```typescript
// src/types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      workspaceId: string;
      role: string;
    };
  }
}
```

tRPC context with auth:
```typescript
// src/server/trpc/context.ts
import { auth } from "@/server/lib/auth";
import { db } from "@/server/db";

export async function createContext() {
  const session = await auth();
  return { db, session };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
```

**Testing**:
- Integration: GET `/api/auth/providers` returns Google provider
- Integration: Unauthenticated request to protected tRPC route returns 401
- Unit: JWT callback enriches token with workspaceId and role
- Unit: Session callback exposes workspaceId on session.user

#### 1.5 — tRPC Router Scaffold

**What**: Root tRPC router with health check procedure and middleware for workspace isolation.

**Design**:

```typescript
// src/server/trpc/router.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      workspaceId: ctx.session.user.workspaceId,
    },
  });
});

export const appRouter = t.router({
  health: publicProcedure.query(() => ({ status: "ok", timestamp: new Date() })),
});

export type AppRouter = typeof appRouter;
```

**Testing**:
- Unit: `health` procedure returns `{ status: "ok" }` without auth
- Unit: `protectedProcedure` throws UNAUTHORIZED when session is null
- Integration: `GET /api/trpc/health` returns 200 with JSON body

---

## Phase 2: Core CRM Entities & REST API

### Purpose
Implement the CRUD operations for contacts, companies, pipelines, and deals — the foundational entities that all other features build upon. After this phase, an authenticated user can create, read, update, delete, and list all core CRM records via tRPC and the public REST API.

### Tasks

#### 2.1 — Contacts Schema & CRUD

**What**: Drizzle schema for contacts with hybrid relational + JSONB custom fields, plus full tRPC CRUD router.

**Design**:

```typescript
// src/server/db/schema/contacts.ts
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: uuid("company_id"),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  fullName: varchar("full_name", { length: 500 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 255 }),
  city: varchar("city", { length: 255 }),
  countryCode: char("country_code", { length: 2 }),
  lifecycleStage: varchar("lifecycle_stage", { length: 50 }).default("lead"),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  source: varchar("source", { length: 100 }),
  customFields: jsonb("custom_fields").notNull().default({}),
  leadScore: numeric("lead_score", { precision: 7, scale: 4 }),
  leadScoreLabel: varchar("lead_score_label", { length: 20 }),
  leadScoreUpdatedAt: timestamp("lead_score_updated_at", { withTimezone: true }),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  emailCount: integer("email_count").default(0),
  meetingCount: integer("meeting_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_contacts_workspace").on(table.workspaceId),
  index("idx_contacts_email").on(table.workspaceId, table.email),
  index("idx_contacts_company").on(table.companyId),
  index("idx_contacts_owner").on(table.ownerId),
  index("idx_contacts_lifecycle").on(table.workspaceId, table.lifecycleStage),
  index("idx_contacts_name").on(table.workspaceId, table.lastName, table.firstName),
  index("idx_contacts_score").on(table.workspaceId, table.leadScore),
]);
```

Zod validation schema shared between client and server:
```typescript
// src/server/lib/validators.ts
import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  fullName: z.string().min(1).max(500),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  countryCode: z.string().length(2).optional(),
  lifecycleStage: z.enum(["lead", "subscriber", "opportunity", "customer", "evangelist", "other"]).optional(),
  ownerId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const listContactsSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().max(200).optional(),
  lifecycleStage: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(["fullName", "createdAt", "lastActivityAt", "leadScore"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

tRPC router:
```typescript
// src/server/trpc/routers/contacts.ts
export const contactsRouter = t.router({
  list: protectedProcedure.input(listContactsSchema).query(async ({ ctx, input }) => {
    // Cursor-based pagination with workspace isolation
    // Returns { items: Contact[], nextCursor: string | null }
  }),
  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    // Returns single contact with company relation loaded
  }),
  create: protectedProcedure.input(createContactSchema).mutation(async ({ ctx, input }) => {
    // Validate custom fields against field_definitions
    // Insert contact, return created record
  }),
  update: protectedProcedure.input(updateContactSchema).mutation(async ({ ctx, input }) => {
    // Partial update; validate changed custom fields
    // Write audit log entry
  }),
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    // Soft delete or hard delete based on workspace setting
    // Write audit log entry
  }),
});
```

**Testing**:
- Unit: createContactSchema rejects email without @ symbol
- Unit: createContactSchema rejects fullName longer than 500 characters
- Unit: listContactsSchema defaults limit to 50 and sortOrder to "desc"
- Integration: Create contact → list contacts → contact appears in list
- Integration: Create contact → update contact email → getById returns new email
- Integration: Create contact → delete → getById returns 404
- Integration: Contact in workspace A is not visible from workspace B session
- Integration: Custom fields stored and retrieved correctly as JSONB

#### 2.2 — Companies Schema & CRUD

**What**: Drizzle schema for companies with CRUD operations mirroring contacts pattern.

**Design**:

```typescript
// src/server/db/schema/companies.ts
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 500 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  employeeCount: integer("employee_count"),
  annualRevenue: bigint("annual_revenue", { mode: "number" }),
  revenueCurrency: varchar("revenue_currency", { length: 3 }).default("USD"),
  countryCode: char("country_code", { length: 2 }),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  customFields: jsonb("custom_fields").notNull().default({}),
  contactCount: integer("contact_count").default(0),
  openDealCount: integer("open_deal_count").default(0),
  totalDealValue: bigint("total_deal_value", { mode: "number" }).default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_companies_workspace").on(table.workspaceId),
  index("idx_companies_domain").on(table.workspaceId, table.domain),
  index("idx_companies_name").on(table.workspaceId, table.name),
]);
```

Foreign key from contacts to companies added via ALTER:
```typescript
// After both tables defined, add the FK constraint
// contacts.companyId references companies.id ON DELETE SET NULL
```

tRPC router follows identical pattern to contacts: `list`, `getById`, `create`, `update`, `delete`.

**Testing**:
- Integration: Create company → create contact with companyId → getContact includes company
- Integration: Delete company → contact.companyId becomes null (ON DELETE SET NULL)
- Integration: List companies with search by domain returns correct matches
- Integration: Company contactCount updates when contacts are added/removed

#### 2.3 — Pipelines & Deals Schema & CRUD

**What**: Pipelines with JSONB stages, and deals with stage references, health scores, and contact associations.

**Design**:

```typescript
// src/server/db/schema/pipelines.ts
export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  stages: jsonb("stages").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Stage shape (validated at application layer):
interface PipelineStage {
  id: string;          // UUID
  name: string;
  order: number;
  probability: number; // 0-100
  type: "open" | "won" | "lost";
}
```

```typescript
// src/server/db/schema/deals.ts
export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  pipelineId: uuid("pipeline_id").notNull().references(() => pipelines.id, { onDelete: "restrict" }),
  stageId: uuid("stage_id").notNull(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  name: varchar("name", { length: 500 }).notNull(),
  amount: bigint("amount", { mode: "number" }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  expectedCloseDate: date("expected_close_date"),
  actualCloseDate: date("actual_close_date"),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  source: varchar("source", { length: 100 }),
  priority: varchar("priority", { length: 20 }).default("medium"),
  customFields: jsonb("custom_fields").notNull().default({}),
  healthScore: numeric("health_score", { precision: 7, scale: 4 }),
  healthLabel: varchar("health_label", { length: 20 }),
  healthScoreUpdatedAt: timestamp("health_score_updated_at", { withTimezone: true }),
  contactIds: uuid("contact_ids").array().default([]),
  stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true }),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  emailCount: integer("email_count").default(0),
  meetingCount: integer("meeting_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_deals_workspace").on(table.workspaceId),
  index("idx_deals_pipeline").on(table.pipelineId),
  index("idx_deals_stage").on(table.stageId),
  index("idx_deals_company").on(table.companyId),
  index("idx_deals_owner").on(table.ownerId),
  index("idx_deals_close_date").on(table.workspaceId, table.expectedCloseDate),
  index("idx_deals_health").on(table.workspaceId, table.healthScore),
]);
```

Deal stage change logic:
```typescript
// When deal.stageId changes:
// 1. Validate stageId exists in pipeline.stages JSONB
// 2. Set deal.stageEnteredAt = now()
// 3. Write audit_log entry recording old stage → new stage
// 4. If new stage type === "won", set deal.actualCloseDate = today
// 5. If new stage type === "lost", set deal.actualCloseDate = today
// 6. Update company.openDealCount and company.totalDealValue
```

Default pipeline seeded on workspace creation:
```typescript
const defaultStages: PipelineStage[] = [
  { id: uuid(), name: "Qualification", order: 0, probability: 10, type: "open" },
  { id: uuid(), name: "Discovery", order: 1, probability: 25, type: "open" },
  { id: uuid(), name: "Proposal", order: 2, probability: 50, type: "open" },
  { id: uuid(), name: "Negotiation", order: 3, probability: 75, type: "open" },
  { id: uuid(), name: "Closed Won", order: 4, probability: 100, type: "won" },
  { id: uuid(), name: "Closed Lost", order: 5, probability: 0, type: "lost" },
];
```

**Testing**:
- Unit: Deal creation rejects stageId not present in pipeline.stages
- Unit: Moving deal to "won" stage sets actualCloseDate
- Integration: Create pipeline → create deal → move deal to next stage → stageEnteredAt updates
- Integration: Create two deals → move one to "Closed Won" → company.totalDealValue increases
- Integration: Pipeline delete blocked (RESTRICT) when deals exist in that pipeline
- Integration: List deals sorted by healthScore returns correct order
- Integration: Deal contactIds array stores and retrieves associated contact UUIDs

#### 2.4 — Public REST API Layer

**What**: REST endpoints at `/api/v1/*` for external integrations, implementing the same operations as tRPC but with standard HTTP verbs and JSON request/response bodies.

**Design**:

API routes in Next.js App Router:
```
GET    /api/v1/contacts          → List contacts (paginated)
POST   /api/v1/contacts          → Create contact
GET    /api/v1/contacts/:id      → Get contact by ID
PATCH  /api/v1/contacts/:id      → Update contact
DELETE /api/v1/contacts/:id      → Delete contact

GET    /api/v1/companies         → List companies
POST   /api/v1/companies         → Create company
GET    /api/v1/companies/:id     → Get company
PATCH  /api/v1/companies/:id     → Update company
DELETE /api/v1/companies/:id     → Delete company

GET    /api/v1/deals             → List deals
POST   /api/v1/deals             → Create deal
GET    /api/v1/deals/:id         → Get deal
PATCH  /api/v1/deals/:id         → Update deal (including stage moves)
DELETE /api/v1/deals/:id         → Delete deal

GET    /api/v1/pipelines         → List pipelines
POST   /api/v1/pipelines         → Create pipeline
PATCH  /api/v1/pipelines/:id     → Update pipeline stages
```

Authentication via Bearer token (API key stored in users table) or OAuth 2.0 session cookie.

Response format:
```typescript
interface ApiResponse<T> {
  data: T;
  meta?: { cursor?: string; hasMore: boolean; total?: number };
}

interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
```

**Testing**:
- Integration: POST `/api/v1/contacts` with valid Bearer token creates contact, returns 201
- Integration: POST `/api/v1/contacts` without token returns 401
- Integration: GET `/api/v1/contacts?limit=10&cursor=<id>` returns paginated results
- Integration: PATCH `/api/v1/deals/:id` with `{ stageId: <new> }` moves deal to new stage
- Integration: GET `/api/v1/contacts/:invalid-uuid` returns 404

#### 2.5 — Audit Log & Tags

**What**: Partitioned audit log table and polymorphic tagging system for all entities.

**Design**:

```typescript
// src/server/db/schema/audit-log.ts
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  changes: jsonb("changes"),
  ipAddress: inet("ip_address"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});
// Partition by quarter via raw SQL migration
```

```typescript
// src/server/db/schema/tags.ts
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }),
}, (table) => [
  uniqueIndex("uq_tags_workspace_name").on(table.workspaceId, table.name),
]);

export const entityTags = pgTable("entity_tags", {
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
}, (table) => [
  primaryKey({ columns: [table.tagId, table.entityType, table.entityId] }),
  index("idx_entity_tags_entity").on(table.entityType, table.entityId),
]);
```

Audit log helper function:
```typescript
async function writeAuditLog(ctx: Context, params: {
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}) {
  await ctx.db.insert(auditLog).values({
    workspaceId: ctx.workspaceId,
    userId: ctx.session.user.id,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changes: params.changes,
  });
}
```

**Testing**:
- Integration: Create contact → audit log has entry with action "contact.created"
- Integration: Update contact → audit log records old and new values for changed fields
- Integration: Add tag to contact → entityTags row created; query contact tags returns tag
- Integration: Delete tag → entityTags cascade-deleted

---

## Phase 3: Frontend Shell & Pipeline Board

### Purpose
Build the user-facing web application with a dashboard shell, navigation, and the pipeline Kanban board — the primary UX surface for sales reps. After this phase, users can log in, browse contacts/companies in tables, and drag deals across pipeline stages.

### Tasks

#### 3.1 — Dashboard Layout Shell

**What**: App shell with sidebar navigation, header with user menu, and command palette for keyboard navigation.

**Design**:

Layout component hierarchy:
```
(dashboard)/layout.tsx
├── Sidebar (collapsible)
│   ├── Workspace switcher
│   ├── Nav items: Contacts, Companies, Deals, Activities, Reports, Settings
│   └── Collapse toggle
├── Header
│   ├── Breadcrumb
│   ├── Search (triggers command palette)
│   └── User avatar + dropdown (settings, sign out)
└── Main content area (children)
```

Command palette (⌘K): Full-text search across contacts, companies, deals. Uses TanStack Query with debounced server-side search via tRPC `search.global` procedure.

Responsive behaviour: Sidebar collapses to icon-only on screens < 1024px; hamburger menu on mobile.

**Testing**:
- E2E (Playwright): Login → sidebar displays all nav items → click "Contacts" → URL changes to /contacts
- E2E: Press ⌘K → command palette opens → type contact name → result appears → click navigates to contact
- E2E: Resize viewport to 768px → sidebar collapses → hamburger icon visible

#### 3.2 — Contact & Company List Views

**What**: Data table views for contacts and companies using TanStack Table with server-side pagination, sorting, filtering, and inline editing.

**Design**:

```typescript
// src/components/contacts/contact-table.tsx
// Uses TanStack Table v8 with:
// - Server-side pagination via tRPC contacts.list with cursor
// - Column sorting (name, email, lifecycleStage, lastActivityAt, leadScore)
// - Filter sidebar: lifecycle stage, owner, tags
// - Bulk actions toolbar: assign owner, add tag, delete
// - Inline editing for lifecycle_stage and owner_id columns
// - Click row → navigate to /contacts/[id]
```

Columns for contacts table:
| Column | Width | Sortable | Filterable |
|--------|-------|----------|------------|
| Name (avatar + full_name) | flex | yes | search |
| Email | 200px | yes | no |
| Company | 180px | no | select |
| Title | 150px | no | no |
| Stage | 120px | yes | multi-select |
| Lead Score | 100px | yes | range |
| Last Activity | 140px | yes | date-range |
| Owner | 120px | no | select |

**Testing**:
- E2E: Load contacts page → 50 contacts displayed → scroll to bottom → next page loads
- E2E: Click "Name" column header → contacts re-sorted alphabetically
- E2E: Filter by lifecycle_stage "lead" → only leads shown
- E2E: Select 3 contacts → bulk "Assign Owner" → all 3 updated

#### 3.3 — Pipeline Kanban Board

**What**: Drag-and-drop pipeline board showing deals as cards across configurable stages, using @dnd-kit.

**Design**:

```typescript
// src/components/deals/pipeline-board.tsx
// Uses @dnd-kit/core + @dnd-kit/sortable
// Structure:
// - Pipeline selector (dropdown) at top
// - Horizontal scrollable container of stage columns
// - Each column: stage name, deal count, total value, deal cards
// - Deal card: name, company, amount, health score badge, owner avatar, days-in-stage
// - Drag deal between columns → calls deals.update mutation with new stageId
// - Optimistic UI: card moves immediately, rolls back on error
```

Deal card component:
```typescript
interface DealCardProps {
  deal: {
    id: string;
    name: string;
    amount: number | null;
    currency: string;
    companyName: string | null;
    ownerAvatar: string | null;
    healthScore: number | null;
    healthLabel: string | null;
    daysInStage: number;
  };
}
// Health score badge colors: ≥75 green, ≥50 yellow, ≥25 orange, <25 red
```

Stage column header shows:
- Stage name
- Number of deals
- Weighted pipeline value (deals × probability)

**Testing**:
- E2E: Open deals page → pipeline board renders with correct stages
- E2E: Drag deal from "Qualification" to "Discovery" → deal card moves → stageEnteredAt updates
- E2E: Drag deal to "Closed Won" → actualCloseDate set → deal card shows ✓
- E2E: Pipeline selector → switch pipeline → board reloads with different stages
- E2E: Stage header shows correct deal count and weighted value after drag

#### 3.4 — Contact & Deal Detail Pages

**What**: Detail views for individual contacts and deals with activity timeline, related records, and editing.

**Design**:

Contact detail layout:
```
/contacts/[id]
├── Header: avatar, name, title, company link, lifecycle badge
├── Action bar: Edit, Add Note, Send Email, Create Task, Delete
├── Tab bar: Overview | Activity | Deals | Tasks
├── Overview tab:
│   ├── Left column: contact fields (relational + custom)
│   └── Right column: AI score card, recent activity summary
├── Activity tab: <ActivityTimeline contactId={id} />
├── Deals tab: linked deals as mini pipeline cards
└── Tasks tab: task list filtered to this contact
```

Deal detail layout:
```
/deals/[id]
├── Header: deal name, stage badge, amount, company, close date
├── Action bar: Edit, Move Stage, Add Note, Create Task
├── Tab bar: Overview | Activity | Contacts | AI Insights
├── Overview tab:
│   ├── Left column: deal fields + custom fields
│   └── Right column: health score card, stage history
├── Activity tab: <ActivityTimeline dealId={id} />
├── Contacts tab: associated contacts with role labels
└── AI Insights tab: meeting summaries, follow-up drafts (Phase 6)
```

**Testing**:
- E2E: Navigate to contact detail → all fields displayed correctly
- E2E: Click "Edit" → inline form appears → save → field updated
- E2E: Contact with 3 deals → Deals tab shows 3 deal cards
- E2E: Deal detail → stage history timeline shows all stage transitions with timestamps

---

## Phase 4: Email & Calendar Sync

### Purpose
Implement the core zero-entry data capture feature: two-way email and calendar sync from Gmail and Outlook. This is the primary differentiator — after connecting an inbox, the CRM auto-populates contacts, logs activities, and captures meeting data without manual entry. Requires OAuth 2.0 for both Google and Microsoft.

### Tasks

#### 4.1 — OAuth Connection Management

**What**: OAuth 2.0 flow for Gmail and Outlook, storing encrypted tokens in the database with automatic refresh.

**Design**:

```typescript
// src/server/db/schema/oauth-connections.ts
export const oauthConnections = pgTable("oauth_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerUserId: varchar("provider_user_id", { length: 500 }),
  accessToken: text("access_token").notNull(),    // AES-256-GCM encrypted
  refreshToken: text("refresh_token"),             // AES-256-GCM encrypted
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  scopes: text("scopes").array(),
  syncConfig: jsonb("sync_config").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_oauth_conn_workspace_user_provider").on(table.workspaceId, table.userId, table.provider),
]);
```

Token encryption helper:
```typescript
// src/server/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
```

OAuth scopes:
- Gmail: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.send`
- Google Calendar: `https://www.googleapis.com/auth/calendar.readonly`
- Microsoft Graph: `Mail.Read`, `Mail.Send`, `Calendars.Read`, `User.Read`

Token refresh flow: BullMQ repeatable job checks `tokenExpiresAt < now() + 5min` every minute, refreshes via provider's token endpoint, updates encrypted token in database.

**Testing**:
- Unit: encrypt → decrypt round-trips for arbitrary strings
- Unit: decrypt with wrong key throws error
- Integration: Complete Google OAuth flow (mocked) → oauth_connections row created with encrypted tokens
- Integration: Token refresh job detects expiring token → refreshes → new token stored
- Integration: Revoke connection → is_active set to false, sync jobs stop

#### 4.2 — Gmail Email Sync

**What**: Bidirectional email sync using Gmail API with incremental history-based polling and push notifications.

**Design**:

Sync strategy:
1. Initial sync: List threads in INBOX and SENT from last 30 days via `users.threads.list`
2. Incremental sync: Use `users.history.list` with `startHistoryId` for delta updates
3. Push: Register Gmail push notification webhook via `users.watch` → POST to `/api/webhooks/gmail`

```typescript
// src/server/services/email-sync/gmail.ts
export class GmailSyncService {
  async initialSync(connection: OAuthConnection): Promise<SyncResult> {
    // 1. Fetch threads from last 30 days
    // 2. For each thread, extract messages
    // 3. For each message, call parseEmailToActivity()
    // 4. Upsert contacts found in from/to/cc
    // 5. Create activity records with detail JSONB
    // 6. Update syncConfig.lastHistoryId
  }

  async incrementalSync(connection: OAuthConnection): Promise<SyncResult> {
    // 1. Call history.list with startHistoryId
    // 2. Process added/deleted messages
    // 3. Update syncConfig.lastHistoryId
  }

  async registerPushNotifications(connection: OAuthConnection): Promise<void> {
    // POST to users.watch with topicName and webhook URL
    // Renew every 7 days (Gmail push expires after 7 days)
  }
}
```

Email → Activity mapping:
```typescript
// src/server/services/email-sync/parser.ts
export function parseEmailToActivity(message: GmailMessage, workspaceId: string): {
  activity: NewActivity;
  contacts: NewContact[];
} {
  return {
    activity: {
      workspaceId,
      activityType: "email",
      subject: message.headers.subject,
      occurredAt: new Date(message.internalDate),
      detail: {
        message_id: message.headers.messageId,
        thread_id: message.threadId,
        direction: isFromUs(message) ? "outbound" : "inbound",
        from: parseEmailAddress(message.headers.from),
        to: message.headers.to.map(parseEmailAddress),
        cc: message.headers.cc?.map(parseEmailAddress) ?? [],
        body_text: extractPlainText(message),
        has_attachments: message.payload.parts?.some(p => p.filename) ?? false,
        provider: "gmail",
      },
    },
    contacts: extractUniqueContacts(message),
  };
}
```

Contact auto-creation: When an email is from/to an address not in the workspace, create a new contact with `source: "email_sync"` and `lifecycleStage: "lead"`. Merge by email address.

**Testing**:
- Unit: parseEmailToActivity extracts correct subject, direction, from, to for inbound email
- Unit: parseEmailToActivity identifies outbound email when sender matches workspace user
- Unit: extractUniqueContacts deduplicates by email across from/to/cc
- Integration (mocked Gmail API): Initial sync of 100 threads → 100 activity records created
- Integration (mocked): Incremental sync with 5 new messages → 5 activities added, lastHistoryId updated
- Integration (mocked): Email from unknown address → new contact created with source "email_sync"
- Integration (mocked): Email from existing contact → no duplicate contact, activity linked to existing

#### 4.3 — Outlook Email Sync via Microsoft Graph

**What**: Email sync using Microsoft Graph API with delta query for incremental sync and change notifications for real-time updates.

**Design**:

Sync strategy:
1. Initial sync: `GET /me/mailFolders/inbox/messages?$top=100&$orderby=receivedDateTime desc` with pagination
2. Incremental sync: Delta query `GET /me/mailFolders/inbox/messages/delta` with `@odata.deltaLink`
3. Push: Register change notification subscription via `POST /subscriptions` → POST to `/api/webhooks/outlook`

```typescript
// src/server/services/email-sync/outlook.ts
export class OutlookSyncService {
  async initialSync(connection: OAuthConnection): Promise<SyncResult> {
    // Paginate through inbox and sent items from last 30 days
    // Use $select to minimize payload: subject, from, toRecipients, receivedDateTime, body
  }

  async incrementalSync(connection: OAuthConnection): Promise<SyncResult> {
    // Use deltaLink from previous sync
    // Process added/updated/deleted messages
  }

  async registerChangeNotifications(connection: OAuthConnection): Promise<void> {
    // POST /subscriptions with changeType: "created"
    // Renew every 3 days (Graph change notifications max 3 days)
  }
}
```

Microsoft Graph message → same parseEmailToActivity format as Gmail, with provider: "outlook".

**Testing**:
- Unit: Microsoft Graph message structure parsed to same Activity shape as Gmail
- Integration (mocked Graph API): Initial sync → activities created with provider "outlook"
- Integration (mocked): Delta sync with deltaLink → only new messages processed
- Integration (mocked): Change notification webhook → triggers incremental sync

#### 4.4 — Calendar Sync (Google Calendar + Outlook Calendar)

**What**: Calendar event sync to automatically log meetings as activities with attendee mapping to contacts.

**Design**:

```typescript
// src/server/services/calendar-sync/google-calendar.ts
export class GoogleCalendarSyncService {
  async syncEvents(connection: OAuthConnection): Promise<SyncResult> {
    // 1. List events from primary calendar: GET /calendars/primary/events
    //    Filter: timeMin = 30 days ago, timeMax = 7 days ahead
    // 2. For each event with attendees, create/update activity
    // 3. Match attendee emails to existing contacts
    // 4. If attendee not found, create contact with source "calendar_sync"
  }
}
```

Meeting → Activity mapping:
```typescript
function calendarEventToActivity(event: CalendarEvent, workspaceId: string): NewActivity {
  return {
    workspaceId,
    activityType: "meeting",
    subject: event.summary,
    occurredAt: new Date(event.start.dateTime),
    detail: {
      start_at: event.start.dateTime,
      end_at: event.end.dateTime,
      location: event.location,
      conference_url: event.conferenceData?.entryPoints?.[0]?.uri,
      attendees: event.attendees.map(a => ({
        email: a.email,
        name: a.displayName,
        status: a.responseStatus,
        contact_id: null, // resolved during processing
      })),
      provider: "google_calendar",
      provider_event_id: event.id,
    },
  };
}
```

**Testing**:
- Unit: Calendar event with Zoom link → conference_url extracted
- Unit: Attendee response statuses correctly mapped (accepted, declined, tentative)
- Integration (mocked): Sync 10 events → 10 meeting activities created
- Integration (mocked): Attendee email matches existing contact → contact_id populated in detail
- Integration (mocked): Attendee email not found → new contact created, linked

#### 4.5 — BullMQ Sync Workers

**What**: Background job infrastructure for email/calendar sync polling, with rate limiting and retry logic.

**Design**:

```typescript
// src/server/lib/queue.ts
import { Queue } from "bullmq";
import { redis } from "./redis";

export const emailSyncQueue = new Queue("email-sync", { connection: redis });
export const calendarSyncQueue = new Queue("calendar-sync", { connection: redis });
export const aiQueue = new Queue("ai-jobs", { connection: redis });
export const scoringQueue = new Queue("scoring", { connection: redis });
export const enrichmentQueue = new Queue("enrichment", { connection: redis });
export const webhookQueue = new Queue("webhook-dispatch", { connection: redis });
```

```typescript
// src/server/workers/email-sync.worker.ts
import { Worker } from "bullmq";

const worker = new Worker("email-sync", async (job) => {
  const { connectionId, syncType } = job.data;
  const connection = await getOAuthConnection(connectionId);
  if (!connection.isActive) return;

  await refreshTokenIfNeeded(connection);

  if (connection.provider === "gmail") {
    const service = new GmailSyncService();
    return syncType === "initial"
      ? service.initialSync(connection)
      : service.incrementalSync(connection);
  } else {
    const service = new OutlookSyncService();
    return syncType === "initial"
      ? service.initialSync(connection)
      : service.incrementalSync(connection);
  }
}, {
  connection: redis,
  concurrency: 5,
  limiter: { max: 10, duration: 1000 },
});
```

Repeatable jobs:
- Email incremental sync: every 5 minutes per active connection
- Calendar sync: every 15 minutes per active connection
- Token refresh check: every 1 minute globally
- Gmail push notification renewal: every 6 days

**Testing**:
- Integration: Enqueue email-sync job → worker processes it → activities created
- Integration: Worker respects rate limiter (max 10 jobs/second)
- Integration: Failed job retries 3 times with exponential backoff
- Integration: Inactive connection → job completes immediately without API call

---

## Phase 5: Activity Timeline & Search

### Purpose
Build the unified activity timeline that displays all interactions (emails, meetings, calls, notes) across contacts, companies, and deals. Add full-text search across all CRM entities. After this phase, users see a complete interaction history on every record.

### Tasks

#### 5.1 — Activities Schema & CRUD

**What**: Unified activities table with JSONB detail column and tRPC router for creating notes/calls and querying timelines.

**Design**:

```typescript
// src/server/db/schema/activities.ts
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 1000 }),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  detail: jsonb("detail").notNull().default({}),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_activities_workspace").on(table.workspaceId, table.occurredAt),
  index("idx_activities_type").on(table.workspaceId, table.activityType),
  index("idx_activities_contact").on(table.contactId, table.occurredAt),
  index("idx_activities_deal").on(table.dealId, table.occurredAt),
  index("idx_activities_company").on(table.companyId, table.occurredAt),
]);
```

Tasks table:
```typescript
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 1000 }).notNull(),
  description: text("description"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("todo"),
  assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Timeline query returns activities sorted by occurredAt DESC with cursor pagination.

**Testing**:
- Integration: Create note activity → appears in contact timeline
- Integration: Create meeting activity → appears in both contact and deal timelines
- Integration: Timeline query with cursor returns correct page boundaries
- Integration: Filter timeline by activityType "email" returns only emails

#### 5.2 — Activity Timeline UI Component

**What**: Reusable timeline component that renders different activity types with appropriate icons and detail extraction.

**Design**:

```typescript
// src/components/activities/activity-timeline.tsx
interface ActivityTimelineProps {
  contactId?: string;
  dealId?: string;
  companyId?: string;
  limit?: number;
}
// Renders a vertical timeline with:
// - Icon per activity type (mail icon, calendar icon, phone icon, pencil icon, stage-change icon)
// - Timestamp (relative: "2 hours ago", absolute on hover)
// - Subject line
// - Activity-specific rendering:
//   email: direction badge (in/out), opened indicator, truncated body preview
//   meeting: time range, attendee avatars, conference link
//   call: duration, outcome badge
//   note: full text (collapsible if >3 lines)
//   stage_change: "Moved from X → Y" with stage badges
// - AI-generated badge for activities created by sync/AI
// - "Load more" button at bottom for cursor pagination
```

**Testing**:
- E2E: Contact detail → Activity tab → timeline shows emails and meetings in chronological order
- E2E: Email activity shows direction badge (inbound/outbound) and open indicator
- E2E: Meeting activity shows attendee count and conference link
- E2E: "Load more" button loads next page of activities

#### 5.3 — Global Search

**What**: Full-text search across contacts, companies, and deals using PostgreSQL `tsvector` with a unified search tRPC endpoint.

**Design**:

Add `search_vector tsvector` columns to contacts, companies, and deals tables. Update via trigger on INSERT/UPDATE:

```sql
-- contacts search vector
ALTER TABLE contacts ADD COLUMN search_vector tsvector;
CREATE INDEX idx_contacts_search ON contacts USING GIN (search_vector);

CREATE FUNCTION contacts_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.full_name, '')), 'A') ||
                       setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
                       setweight(to_tsvector('english', coalesce(NEW.job_title, '')), 'C') ||
                       setweight(to_tsvector('english', coalesce(NEW.city, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Unified search endpoint:
```typescript
// src/server/trpc/routers/search.ts
search: protectedProcedure.input(z.object({
  query: z.string().min(1).max(200),
  types: z.array(z.enum(["contact", "company", "deal"])).optional(),
  limit: z.number().int().min(1).max(20).default(10),
})).query(async ({ ctx, input }) => {
  // Run parallel queries against contacts, companies, deals search_vector
  // Merge, rank by ts_rank_cd, return top N results with type discriminator
  // Return: { type: "contact" | "company" | "deal", id: string, title: string, subtitle: string }[]
});
```

**Testing**:
- Integration: Search "acme" → returns company "Acme Corp" and contacts at Acme
- Integration: Search by email → returns matching contact
- Integration: Search with types filter ["deal"] → returns only deals
- E2E: Command palette search → results grouped by type → click result navigates to detail page

---

## Phase 6: LLM Meeting Summaries & Follow-Up Drafts

### Purpose
Add the first AI-native features: automatic meeting summarization and follow-up email draft generation using LLM. After synced meetings occur, the system generates structured summaries with key points, action items, and sentiment. Users can generate and edit follow-up email drafts.

### Tasks

#### 6.1 — AI Summary Generation Service

**What**: Service that generates structured meeting summaries from meeting context (attendees, associated emails, deal history) using Claude.

**Design**:

```typescript
// src/server/services/ai/meeting-summary.ts
import Anthropic from "@anthropic-ai/sdk";

interface MeetingSummaryInput {
  activity: Activity;               // The meeting activity
  recentEmails: Activity[];         // Last 10 emails with same contacts
  deal: Deal | null;                // Associated deal if any
  attendeeContacts: Contact[];      // Contact records for attendees
}

interface MeetingSummaryOutput {
  summary: string;
  keyPoints: string[];
  actionItems: Array<{
    text: string;
    assignee: string | null;
    dueDate: string | null;
  }>;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  topics: string[];
}

export async function generateMeetingSummary(
  input: MeetingSummaryInput
): Promise<MeetingSummaryOutput> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: MEETING_SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildMeetingContext(input) }],
  });
  return parseMeetingSummaryResponse(response);
}
```

System prompt structure:
```typescript
// src/server/services/ai/prompts.ts
export const MEETING_SUMMARY_SYSTEM_PROMPT = `You are an AI assistant that summarizes sales meetings for a CRM.
Given context about a meeting (attendees, recent email thread, deal information), produce a structured summary.

Output format (JSON):
{
  "summary": "2-3 sentence summary of the meeting",
  "key_points": ["point 1", "point 2", ...],
  "action_items": [{"text": "action", "assignee": "name or null", "due_date": "YYYY-MM-DD or null"}],
  "sentiment": "positive|neutral|negative|mixed",
  "topics": ["topic1", "topic2"]
}

Guidelines:
- Focus on business outcomes, decisions made, and next steps
- Identify commitments and who owns them
- Note any concerns, objections, or blockers mentioned
- Detect sentiment from the communication tone and deal progress
- Keep summaries concise but comprehensive`;
```

**Testing**:
- Unit: buildMeetingContext produces well-formatted prompt with all context sections
- Unit: parseMeetingSummaryResponse correctly parses Claude response into typed output
- Integration (mocked LLM): Meeting with email context → summary generated with key_points and action_items
- Integration (mocked LLM): Summary with action items → tasks auto-created with is_ai_generated = true

#### 6.2 — AI Summary Database & API

**What**: Storage for AI-generated summaries and tRPC endpoints for viewing, regenerating, and reviewing summaries.

**Design**:

```typescript
// src/server/db/schema/ai-summaries.ts
export const aiSummaries = pgTable("ai_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  summaryType: varchar("summary_type", { length: 50 }).notNull(),
  content: jsonb("content").notNull(),
  modelId: varchar("model_id", { length: 100 }).notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

tRPC endpoints:
```typescript
// src/server/trpc/routers/ai.ts
ai: t.router({
  getSummary: protectedProcedure
    .input(z.object({ activityId: z.string().uuid() }))
    .query(/* fetch latest summary for activity */),

  generateSummary: protectedProcedure
    .input(z.object({ activityId: z.string().uuid() }))
    .mutation(/* trigger summary generation, return job ID */),

  reviewSummary: protectedProcedure
    .input(z.object({ summaryId: z.string().uuid(), approved: z.boolean() }))
    .mutation(/* mark summary as reviewed */),
});
```

BullMQ worker processes AI summary jobs asynchronously:
```typescript
// src/server/workers/ai-summary.worker.ts
// 1. Load meeting activity + context (emails, deal, contacts)
// 2. Call generateMeetingSummary()
// 3. Store result in ai_summaries
// 4. If action items found, create tasks with is_ai_generated = true
// 5. Update activity's last_activity_at on associated contact/deal
```

Auto-trigger: When a meeting activity is created by calendar sync and the meeting's end_at has passed, enqueue an AI summary job.

**Testing**:
- Integration: Calendar sync creates past meeting → AI summary job auto-enqueued
- Integration: generateSummary mutation → BullMQ job created → summary stored in ai_summaries
- Integration: getSummary returns latest summary for activity
- Integration: Action items in summary → tasks created with correct assignee and due date

#### 6.3 — Follow-Up Draft Generation

**What**: LLM-generated follow-up email drafts based on meeting context, summary, and deal history.

**Design**:

```typescript
// src/server/db/schema/ai-follow-ups.ts
export const aiFollowUps = pgTable("ai_follow_ups", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id").references(() => activities.id, { onDelete: "set null" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 1000 }),
  bodyText: text("body_text").notNull(),
  bodyHtml: text("body_html"),
  status: varchar("status", { length: 20 }).default("draft"),
  modelId: varchar("model_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  sentBy: uuid("sent_by").references(() => users.id, { onDelete: "set null" }),
});
```

```typescript
// src/server/services/ai/follow-up-draft.ts
export async function generateFollowUpDraft(input: {
  summary: AiSummary;
  contact: Contact;
  deal: Deal | null;
  senderName: string;
}): Promise<{ subject: string; bodyText: string; bodyHtml: string }> {
  // Uses Claude to generate a professional follow-up email
  // Incorporates action items from the summary
  // Matches the sender's communication style from recent emails
}
```

**Testing**:
- Integration (mocked LLM): Generate follow-up after meeting summary → draft stored with subject and body
- Integration: Follow-up draft references action items from the meeting summary
- E2E: Meeting detail → "Generate Follow-Up" button → draft appears in AI Insights tab → user edits and sends

#### 6.4 — AI Insights UI Components

**What**: Frontend components for displaying meeting summaries, action items, and follow-up drafts on deal and contact detail pages.

**Design**:

```typescript
// src/components/ai/meeting-summary-card.tsx
// Displays: summary text, key points as bullet list, action items as checkable list,
// sentiment badge, topics as tags, model info, "Regenerate" button, "Reviewed ✓" toggle

// src/components/ai/follow-up-draft.tsx
// Displays: subject line (editable), body (rich text editor), "Send" button, "Discard" button
// Send action: creates an outbound email activity and marks follow-up as sent
```

AI Insights tab on deal detail:
```
/deals/[id] → AI Insights tab
├── Meeting Summaries (chronological, most recent first)
│   ├── MeetingSummaryCard for each summarized meeting
│   └── "No summaries yet" empty state
├── Follow-Up Drafts (pending drafts)
│   ├── FollowUpDraft for each unsent draft
│   └── "Generate Follow-Up" button
└── Health Score Breakdown (Phase 7)
```

**Testing**:
- E2E: Deal with summarized meeting → AI Insights tab shows summary card with key points
- E2E: Click "Regenerate" → loading state → new summary replaces old
- E2E: Click "Generate Follow-Up" → draft appears → edit subject → click "Send" → activity created

---

## Phase 7: ML Deal Health & Lead Scoring

### Purpose
Implement ML-based deal health scoring and lead scoring using communication engagement signals. The scoring model is trained on historical deal outcomes and deployed as ONNX for real-time inference. After this phase, every deal shows a health score and every contact shows a lead score, both derived from actual interaction patterns.

### Tasks

#### 7.1 — Feature Engineering Pipeline

**What**: Extract scoring features from activities, email engagement, and deal progression data.

**Design**:

Deal health features:
```typescript
// src/server/services/scoring/feature-engineering.ts
interface DealHealthFeatures {
  // Communication velocity
  emailsLast7Days: number;
  emailsLast30Days: number;
  meetingsLast14Days: number;
  avgEmailResponseTimeHours: number;
  // Engagement signals
  emailOpenRate: number;
  meetingAcceptanceRate: number;
  multithreadedConversation: boolean;  // >1 contact in email threads
  // Deal progression
  daysInCurrentStage: number;
  avgDaysPerStage: number;
  stagesCompleted: number;
  totalStages: number;
  stageVelocityVsAvg: number;         // ratio vs workspace average
  // Deal metadata
  dealAmountNormalized: number;        // percentile within workspace
  hasPriority: boolean;
  daysUntilExpectedClose: number;
  // Activity recency
  daysSinceLastActivity: number;
  daysSinceLastInboundEmail: number;
  daysSinceLastMeeting: number;
}

export async function computeDealHealthFeatures(dealId: string): Promise<DealHealthFeatures> {
  // Queries activities, deals, contacts for the given deal
  // Returns feature vector
}
```

Lead scoring features:
```typescript
interface LeadScoreFeatures {
  emailResponseRate: number;
  avgResponseTimeHours: number;
  meetingAttendanceRate: number;
  emailOpenRate: number;
  inboundEmailCount: number;
  websiteVisitCount: number;
  daysSinceFirstContact: number;
  daysSinceLastActivity: number;
  numberOfDeals: number;
  companyEmployeeCount: number | null;
  companyRevenue: number | null;
}
```

**Testing**:
- Unit: computeDealHealthFeatures returns correct emailsLast7Days given known activity data
- Unit: Feature extraction handles deals with zero activities (returns default/zero values)
- Unit: stageVelocityVsAvg correctly computes ratio against workspace average
- Integration: Compute features for deal with 10 activities → all feature values within expected ranges

#### 7.2 — Scoring Models & ONNX Inference

**What**: Scoring model management, Python training script for XGBoost, and ONNX Runtime inference in Node.js.

**Design**:

```typescript
// src/server/db/schema/scoring.ts
export const scoringModels = pgTable("scoring_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  modelType: varchar("model_type", { length: 50 }).notNull(), // deal_health, lead_score
  config: jsonb("config").notNull().default({}),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),
  trainedAt: timestamp("trained_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoreHistory = pgTable("score_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  modelId: uuid("model_id").notNull().references(() => scoringModels.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 7, scale: 4 }).notNull(),
  label: varchar("label", { length: 20 }),
  features: jsonb("features"),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_score_history_entity").on(table.entityType, table.entityId, table.computedAt),
]);
```

Python training script:
```python
# scripts/train-scoring-model.py
# 1. Connect to PostgreSQL, export training data:
#    - Deals with actual_close_date (closed won/lost) as labels
#    - Features computed at the time the deal was in its final open stage
# 2. Train XGBoost classifier (binary: won vs lost)
# 3. Export to ONNX format: model.onnx
# 4. Upload model config (feature names, thresholds) to scoring_models table
```

Node.js inference:
```typescript
// src/server/services/scoring/inference.ts
import * as ort from "onnxruntime-node";

let session: ort.InferenceSession | null = null;

export async function scoreDeal(features: DealHealthFeatures): Promise<{
  score: number;     // 0-100
  label: string;     // "hot" | "warm" | "cool" | "cold"
}> {
  if (!session) {
    session = await ort.InferenceSession.create("./models/deal_health.onnx");
  }
  const tensor = new ort.Tensor("float32", featuresToArray(features), [1, FEATURE_COUNT]);
  const results = await session.run({ input: tensor });
  const probability = results.output.data[0] as number;
  const score = Math.round(probability * 100);
  return {
    score,
    label: score >= 75 ? "hot" : score >= 50 ? "warm" : score >= 25 ? "cool" : "cold",
  };
}
```

Fallback heuristic scorer for workspaces without enough training data:
```typescript
export function heuristicDealHealth(features: DealHealthFeatures): { score: number; label: string } {
  let score = 50;
  score += features.emailsLast7Days > 0 ? 10 : -10;
  score += features.meetingsLast14Days > 0 ? 15 : -5;
  score += features.avgEmailResponseTimeHours < 24 ? 10 : -10;
  score += features.daysInCurrentStage > 14 ? -15 : 5;
  score += features.daysSinceLastActivity > 7 ? -10 : 5;
  score = Math.max(0, Math.min(100, score));
  return { score, label: score >= 75 ? "hot" : score >= 50 ? "warm" : score >= 25 ? "cool" : "cold" };
}
```

**Testing**:
- Unit: heuristicDealHealth returns "hot" for deal with recent activity and fast responses
- Unit: heuristicDealHealth returns "cold" for deal with no activity in 14 days
- Unit: featuresToArray produces array matching ONNX model input shape
- Integration: Score deal via ONNX → score between 0-100, label in expected set
- Integration: Score stored in score_history with feature snapshot
- Integration: Deal healthScore and healthLabel updated on deals table

#### 7.3 — Scoring Pipeline & Background Workers

**What**: BullMQ scoring worker that recomputes scores on triggers (new activity, stage change, daily batch).

**Design**:

Score update triggers:
1. New activity created for a deal → recompute deal health
2. Deal stage changes → recompute deal health
3. New activity for a contact → recompute lead score
4. Daily batch job → recompute all active deal/lead scores

```typescript
// src/server/workers/scoring.worker.ts
const worker = new Worker("scoring", async (job) => {
  switch (job.name) {
    case "score-deal": {
      const features = await computeDealHealthFeatures(job.data.dealId);
      const result = activeModel
        ? await scoreDeal(features)
        : heuristicDealHealth(features);
      await db.update(deals)
        .set({ healthScore: result.score, healthLabel: result.label, healthScoreUpdatedAt: new Date() })
        .where(eq(deals.id, job.data.dealId));
      await db.insert(scoreHistory).values({ ... });
      break;
    }
    case "score-lead": {
      const features = await computeLeadScoreFeatures(job.data.contactId);
      // Similar to deal scoring
      break;
    }
    case "batch-rescore": {
      const activeDeals = await db.select().from(deals)
        .where(and(eq(deals.workspaceId, job.data.workspaceId), isNull(deals.actualCloseDate)));
      for (const deal of activeDeals) {
        await scoringQueue.add("score-deal", { dealId: deal.id });
      }
      break;
    }
  }
}, { connection: redis, concurrency: 10 });
```

**Testing**:
- Integration: Create activity for deal → deal healthScore updated within 5 seconds
- Integration: Batch rescore → all open deals rescored
- Integration: Score history accumulates entries over time (not overwritten)

#### 7.4 — Score Display UI

**What**: Score badges and trend charts on deal and contact detail pages.

**Design**:

Score badge component:
```typescript
// src/components/ai/score-badge.tsx
interface ScoreBadgeProps {
  score: number;      // 0-100
  label: string;      // "hot" | "warm" | "cool" | "cold"
  updatedAt: Date;
  trend?: "up" | "down" | "stable";
}
// Renders: colored badge with score number, label text, trend arrow, relative timestamp
// Colors: hot=#22c55e, warm=#eab308, cool=#f97316, cold=#ef4444
```

Score history sparkline on deal detail using a lightweight chart library (recharts or @visx/sparkline).

Pipeline board deal cards show health score badge alongside amount and company.

**Testing**:
- E2E: Deal card on pipeline board shows score badge with correct color
- E2E: Deal detail → score card shows current score, trend, and history sparkline
- E2E: Contact detail → lead score badge visible in header

---

## Phase 8: GDPR-Safe Contact Enrichment

### Purpose
Implement privacy-compliant contact and company enrichment from permissioned public data sources with full provenance tracking. This differentiates from commercial enrichment tools (ZoomInfo, Clearbit) by providing auditable data lineage and GDPR Article 14 transparency.

### Tasks

#### 8.1 — Enrichment Sources & Engine

**What**: Pluggable enrichment source system with rate limiting, provenance tracking, and confidence scoring.

**Design**:

```typescript
// src/server/db/schema/enrichment.ts
export const enrichmentSources = pgTable("enrichment_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  config: jsonb("config").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enrichmentLog = pgTable("enrichment_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").notNull().references(() => enrichmentSources.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  changes: jsonb("changes").notNull(),
  sourceUrl: text("source_url"),
  status: varchar("status", { length: 20 }).default("pending"),
  enrichedAt: timestamp("enriched_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
}, (table) => [
  index("idx_enrichment_log_entity").on(table.entityType, table.entityId),
]);
```

Enrichment engine interface:
```typescript
// src/server/services/enrichment/enrichment-engine.ts
interface EnrichmentSource {
  name: string;
  sourceType: string;
  gdprBasis: string;
  enrichCompany(domain: string): Promise<EnrichmentResult>;
  enrichContact(email: string): Promise<EnrichmentResult>;
}

interface EnrichmentResult {
  fields: Record<string, { value: unknown; confidence: number }>;
  sourceUrl: string | null;
}
```

Initial enrichment sources:
```typescript
// src/server/services/enrichment/sources/opencorporates.ts
// Company data from OpenCorporates API (public company registries)
// Fields: industry, incorporation_date, jurisdiction, officer_names, registered_address
// GDPR basis: legitimate_interest (publicly available government data)

// src/server/services/enrichment/sources/company-registries.ts
// UK Companies House, US SEC EDGAR (free, public, no consent required)
// Fields: employee_count_range, sic_codes, annual_accounts
```

**Testing**:
- Unit: Enrichment result with confidence < 0.5 is not auto-applied
- Integration (mocked API): Enrich company by domain → enrichmentLog entry created with changes JSONB
- Integration: Enrich contact → new fields added to company record, old values preserved in log
- Integration: GDPR provenance: enrichmentLog.sourceUrl points to public registry URL

#### 8.2 — GDPR Compliance Layer

**What**: GDPR Article 14 transparency notices, Legitimate Interest Assessment metadata, and right-to-erasure support.

**Design**:

```typescript
// src/server/services/enrichment/gdpr-compliance.ts
export function validateEnrichmentGDPR(source: EnrichmentSource): {
  allowed: boolean;
  reason?: string;
} {
  // Check source has documented GDPR basis
  // Check source has LIA document reference
  // Check workspace has enrichment enabled in settings
}

export async function generateArticle14Notice(
  contactId: string,
  enrichmentLogs: EnrichmentLogEntry[]
): Promise<string> {
  // Generate transparency notice listing:
  // - What data was enriched
  // - Source of each enrichment
  // - GDPR legal basis
  // - How to request deletion
}

export async function processErasureRequest(contactId: string): Promise<void> {
  // 1. Delete all enrichment data for this contact
  // 2. Revert enriched fields to pre-enrichment values using enrichmentLog
  // 3. Keep erasure audit log entry (required by GDPR)
  // 4. Remove AI-generated summaries mentioning this contact
}
```

**Testing**:
- Unit: validateEnrichmentGDPR rejects source without documented GDPR basis
- Unit: generateArticle14Notice includes all enrichment sources and dates
- Integration: processErasureRequest reverts enriched fields → contact restored to pre-enrichment state
- Integration: Erasure request creates audit log entry

#### 8.3 — Enrichment Worker & UI

**What**: Background enrichment worker and settings UI for configuring enrichment sources.

**Design**:

Enrichment triggers:
1. New contact created with email → enqueue enrichment job
2. New company created with domain → enqueue enrichment job
3. Manual "Enrich" button on contact/company detail
4. Batch enrichment via settings page

```typescript
// src/server/workers/enrichment.worker.ts
// 1. Load entity and active enrichment sources
// 2. For each source, call enrichCompany/enrichContact
// 3. For each result with confidence >= threshold:
//    a. Write enrichmentLog entry with status "pending"
//    b. If workspace.settings.auto_apply_enrichment: apply changes and set status "accepted"
//    c. Otherwise: leave as "pending" for manual review
// 4. Rate limit: max 60 enrichment requests per source per minute
```

Settings UI at `/settings/integrations`:
- List of enrichment sources with enabled/disabled toggle
- Auto-apply threshold slider (0.5 - 1.0)
- Link to GDPR Legitimate Interest Assessment document
- Enrichment activity log with approve/reject buttons

**Testing**:
- Integration: New company created → enrichment job enqueued → company fields updated
- Integration: Auto-apply disabled → enrichment changes remain "pending"
- E2E: Settings → enable OpenCorporates → create company → enrichment runs → review changes

---

## Phase 9: Custom Fields & Custom Objects

### Purpose
Implement the Attio-inspired custom field system that allows workspace admins to define arbitrary fields on contacts, companies, and deals, plus create entirely new custom object types. This uses the field_definitions meta-schema from data-model-suggestion-3 to validate JSONB custom fields at the application layer.

### Tasks

#### 9.1 — Custom Field CRUD & Validation

**What**: tRPC endpoints for managing field definitions and runtime JSONB validation.

**Design**:

```typescript
// src/server/trpc/routers/custom-fields.ts
customFields: t.router({
  list: protectedProcedure
    .input(z.object({ entityType: z.string() }))
    .query(/* list field_definitions for entity type in workspace */),

  create: protectedProcedure.input(z.object({
    entityType: z.enum(["contact", "company", "deal"]),
    fieldKey: z.string().regex(/^[a-z][a-z0-9_]*$/).max(100),
    displayName: z.string().min(1).max(255),
    fieldType: z.enum(["text", "number", "currency", "date", "datetime", "email",
                        "phone", "url", "select", "multi_select", "checkbox",
                        "user_reference", "entity_reference", "rich_text"]),
    isRequired: z.boolean().optional(),
    defaultValue: z.unknown().optional(),
    validation: z.record(z.unknown()).optional(),
    options: z.array(z.object({ value: z.string(), label: z.string(), color: z.string().optional() })).optional(),
    groupName: z.string().max(100).optional(),
    gdprCategory: z.enum(["personally_identifiable", "sensitive", "business", "none"]).optional(),
  })).mutation(/* insert into field_definitions */),

  update: protectedProcedure.input(/* partial update */).mutation(/* ... */),
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(/* ... */),
  reorder: protectedProcedure.input(z.object({
    entityType: z.string(),
    fieldIds: z.array(z.string().uuid()),
  })).mutation(/* update display_order */),
});
```

JSONB validation function:
```typescript
// src/server/lib/validators.ts
export async function validateCustomFields(
  workspaceId: string,
  entityType: string,
  customFields: Record<string, unknown>
): Promise<{ valid: boolean; errors: Array<{ field: string; message: string }> }> {
  const definitions = await db.select().from(fieldDefinitions)
    .where(and(eq(fieldDefinitions.workspaceId, workspaceId), eq(fieldDefinitions.entityType, entityType)));

  const errors: Array<{ field: string; message: string }> = [];

  for (const def of definitions) {
    const value = customFields[def.fieldKey];
    if (def.isRequired && (value === undefined || value === null)) {
      errors.push({ field: def.fieldKey, message: `${def.displayName} is required` });
      continue;
    }
    if (value !== undefined && def.validation) {
      // Validate against JSON Schema in def.validation
    }
  }

  // Check for unknown fields not in definitions
  for (const key of Object.keys(customFields)) {
    if (!definitions.find(d => d.fieldKey === key)) {
      errors.push({ field: key, message: `Unknown custom field: ${key}` });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Testing**:
- Unit: validateCustomFields rejects required field missing from JSONB
- Unit: validateCustomFields rejects unknown field key not in definitions
- Unit: Currency field validation checks amount is number and currency is 3-char code
- Integration: Create field definition → create contact with custom field → validates and stores
- Integration: Delete field definition → custom field key in existing contacts persists (no data loss)

#### 9.2 — Custom Object Definitions & Records

**What**: Allow workspace admins to create entirely new entity types (e.g., Invoices, Subscriptions) with their own field schemas.

**Design**:

```typescript
// src/server/db/schema/custom-objects.ts
export const customObjectDefinitions = pgTable("custom_object_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  objectKey: varchar("object_key", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  displayNamePlural: varchar("display_name_plural", { length: 255 }),
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_custom_obj_workspace_key").on(table.workspaceId, table.objectKey),
]);

export const customObjectRecords = pgTable("custom_object_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  objectDefId: uuid("object_def_id").notNull().references(() => customObjectDefinitions.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 500 }),
  fields: jsonb("fields").notNull().default({}),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_custom_records_workspace").on(table.workspaceId, table.objectDefId),
]);
```

**Testing**:
- Integration: Create custom object "Invoices" → add field definitions → create record → fields validated
- Integration: Delete custom object definition → CASCADE deletes all records
- Integration: Custom objects appear in sidebar navigation dynamically

#### 9.3 — Custom Field UI

**What**: Settings page for defining custom fields, and dynamic form renderer for displaying custom fields on entity detail pages.

**Design**:

```typescript
// src/components/shared/custom-field-renderer.tsx
interface CustomFieldRendererProps {
  definitions: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  mode: "view" | "edit";
}
// Renders each field based on fieldType:
// text → TextInput
// number → NumberInput
// currency → CurrencyInput (amount + currency code)
// date → DatePicker
// select → SelectDropdown (from options)
// multi_select → MultiSelectTags
// checkbox → Checkbox
// user_reference → UserPicker
// entity_reference → EntityPicker (contact/company/deal)
// rich_text → RichTextEditor
```

**Testing**:
- E2E: Settings → Custom Fields → Add "Contract Value" (currency) to deals → create deal → field appears on form
- E2E: Select field with options → dropdown shows configured options
- E2E: Required custom field left empty → validation error shown

---

## Phase 10: Webhooks & Workflow Automation

### Purpose
Implement outbound webhook delivery for CRM events and a trigger/action workflow builder for common sales automation sequences. After this phase, users can subscribe to CRM events and build automations like "when deal moves to Negotiation, create a task for legal review."

### Tasks

#### 10.1 — Webhook Dispatch System

**What**: Webhook registration, HMAC signature verification, reliable delivery with retry, and delivery log.

**Design**:

```typescript
// src/server/db/schema/webhooks.ts
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: text("events").array().notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  config: jsonb("config").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Webhook events:
```typescript
type WebhookEvent =
  | "contact.created" | "contact.updated" | "contact.deleted"
  | "company.created" | "company.updated" | "company.deleted"
  | "deal.created" | "deal.updated" | "deal.deleted" | "deal.stage_changed"
  | "activity.created"
  | "task.created" | "task.completed";
```

Webhook payload format:
```typescript
interface WebhookPayload {
  id: string;          // delivery ID
  event: string;
  timestamp: string;   // ISO 8601
  workspace_id: string;
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
    changes?: Record<string, { old: unknown; new: unknown }>;
  };
}
```

Dispatch flow:
```typescript
// src/server/services/webhook-dispatch.ts
// 1. On CRM event, find matching webhooks for workspace + event type
// 2. For each webhook, enqueue BullMQ job with payload
// 3. Worker signs payload with HMAC-SHA256 using webhook.secret
// 4. POST to webhook.url with headers:
//    X-Webhook-Id: <delivery-id>
//    X-Webhook-Signature: sha256=<hmac>
//    X-Webhook-Timestamp: <unix-timestamp>
//    Content-Type: application/json
// 5. Retry on 5xx/timeout: 3 retries with exponential backoff (30s, 120s, 600s)
// 6. Log delivery status (success, failed, retrying) for debugging
```

**Testing**:
- Unit: HMAC signature computed correctly with shared secret
- Integration: Create contact → webhook dispatched → POST received at mock endpoint
- Integration: Webhook endpoint returns 500 → retried 3 times with backoff
- Integration: Inactive webhook → no dispatch
- Integration: Webhook with event filter ["deal.stage_changed"] → not triggered on contact.created

#### 10.2 — Workflow Engine

**What**: Trigger-condition-action workflow system with JSONB workflow definitions.

**Design**:

```typescript
// src/server/db/schema/workflows.ts
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  definition: jsonb("definition").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  triggerEntityType: varchar("trigger_entity_type", { length: 50 }),
  triggerEntityId: uuid("trigger_entity_id"),
  status: varchar("status", { length: 20 }).notNull().default("running"),
  result: jsonb("result"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  error: text("error"),
});
```

Workflow definition schema:
```typescript
interface WorkflowDefinition {
  trigger: {
    type: "record_created" | "record_updated" | "stage_changed" | "scheduled";
    entityType: string;
    conditions?: Array<{ field: string; operator: "equals" | "changed" | "contains" | "gte" | "lte"; value?: unknown }>;
  };
  steps: WorkflowStep[];
}

type WorkflowStep =
  | { type: "condition"; if: Condition; then: WorkflowStep[]; else?: WorkflowStep[] }
  | { type: "create_task"; config: { title: string; assignee: "owner" | string; dueInDays?: number } }
  | { type: "update_field"; config: { field: string; value: unknown } }
  | { type: "send_notification"; config: { channel: "email" | "in_app"; message: string } }
  | { type: "wait"; config: { durationMinutes: number } }
  | { type: "call_webhook"; config: { url: string; body: Record<string, unknown> } };
```

```typescript
// src/server/services/workflow-engine.ts
export async function executeWorkflow(
  workflow: Workflow,
  triggerContext: { entityType: string; entityId: string; changes?: Record<string, unknown> }
): Promise<void> {
  // 1. Evaluate trigger conditions
  // 2. Walk step tree, executing each step
  // 3. For "wait" steps, schedule delayed BullMQ job
  // 4. Log execution in workflow_executions
}
```

**Testing**:
- Integration: Workflow "on deal stage_changed to Negotiation → create task" → task created
- Integration: Condition step evaluates false → "then" branch skipped, "else" executed
- Integration: Workflow with wait step → delayed job scheduled correctly
- Integration: Workflow execution logged with status "completed" and result
- E2E: Settings → create workflow → trigger it → execution log shows result

---

## Phase 11: MCP Server

### Purpose
Ship a first-class Model Context Protocol server that exposes CRM data as resources, write operations as tools, and common CRM tasks as prompt templates. This makes the CRM natively accessible to Claude, ChatGPT, Cursor, and other AI assistants without custom integration code. Key differentiator per standards.md analysis.

### Tasks

#### 11.1 — MCP Server Core & Resources

**What**: MCP server implementation using @modelcontextprotocol/sdk exposing CRM records as browsable resources.

**Design**:

```typescript
// src/server/services/mcp/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createMcpServer(workspaceId: string) {
  const server = new McpServer({
    name: "ai-native-crm",
    version: "1.0.0",
  });

  registerResources(server, workspaceId);
  registerTools(server, workspaceId);
  registerPrompts(server, workspaceId);

  return server;
}
```

Resources:
```typescript
// src/server/services/mcp/resources.ts
export function registerResources(server: McpServer, workspaceId: string) {
  // crm://contacts — list of contacts with key fields
  server.resource("contacts", "crm://contacts", async () => ({
    contents: [{ uri: "crm://contacts", mimeType: "application/json",
      text: JSON.stringify(await listContacts(workspaceId, { limit: 100 })) }],
  }));

  // crm://contacts/{id} — full contact record with activities
  server.resource("contact", "crm://contacts/{id}", async ({ id }) => ({
    contents: [{ uri: `crm://contacts/${id}`, mimeType: "application/json",
      text: JSON.stringify(await getContactWithActivities(workspaceId, id)) }],
  }));

  // crm://deals — pipeline overview
  // crm://deals/{id} — deal detail with stakeholders and health score
  // crm://companies/{id} — company with contacts and deals
  // crm://activities — recent activity feed
}
```

**Testing**:
- Integration: MCP client connects → resources/list returns contacts, deals, companies, activities
- Integration: Read crm://contacts → returns JSON array of contacts in workspace
- Integration: Read crm://deals/{id} → returns deal with associated contacts and health score
- Integration: Resources filtered by workspace isolation

#### 11.2 — MCP Tools (Write Operations)

**What**: MCP tools that allow AI agents to create/update CRM records, log activities, and move deals through pipeline stages.

**Design**:

```typescript
// src/server/services/mcp/tools.ts
export function registerTools(server: McpServer, workspaceId: string) {
  server.tool("create_contact", "Create a new CRM contact", {
    fullName: { type: "string", description: "Full name of the contact" },
    email: { type: "string", description: "Email address" },
    companyName: { type: "string", description: "Company name (will match or create)" },
    jobTitle: { type: "string", description: "Job title" },
  }, async (args) => {
    const contact = await createContact(workspaceId, args);
    return { content: [{ type: "text", text: `Created contact ${contact.fullName} (${contact.id})` }] };
  });

  server.tool("update_deal_stage", "Move a deal to a different pipeline stage", {
    dealId: { type: "string", description: "Deal UUID" },
    stageName: { type: "string", description: "Name of the target stage" },
  }, async (args) => {
    await moveDealToStage(workspaceId, args.dealId, args.stageName);
    return { content: [{ type: "text", text: `Deal moved to ${args.stageName}` }] };
  });

  server.tool("log_activity", "Log a note or call activity on a contact or deal", {
    type: { type: "string", enum: ["note", "call"], description: "Activity type" },
    contactId: { type: "string", description: "Contact UUID" },
    dealId: { type: "string", description: "Deal UUID (optional)" },
    subject: { type: "string", description: "Activity subject" },
    body: { type: "string", description: "Activity content" },
  }, async (args) => { /* ... */ });

  server.tool("search_crm", "Search across contacts, companies, and deals", {
    query: { type: "string", description: "Search query" },
  }, async (args) => {
    const results = await globalSearch(workspaceId, args.query);
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  });

  // Additional tools: create_task, get_deal_health, list_pipeline
}
```

**Testing**:
- Integration: MCP client calls create_contact → contact created in database
- Integration: MCP client calls update_deal_stage → deal stage updated, audit logged
- Integration: MCP client calls search_crm "acme" → returns matching results
- Integration: Invalid dealId in update_deal_stage → error response with message

#### 11.3 — MCP Prompts

**What**: Reusable prompt templates for common CRM tasks that AI agents can discover and invoke.

**Design**:

```typescript
// src/server/services/mcp/prompts.ts
export function registerPrompts(server: McpServer, workspaceId: string) {
  server.prompt("meeting_prep", "Prepare a briefing for an upcoming meeting", {
    contactId: { type: "string", description: "Contact UUID for the meeting" },
    dealId: { type: "string", description: "Associated deal UUID (optional)" },
  }, async (args) => {
    const contact = await getContactWithActivities(workspaceId, args.contactId);
    const deal = args.dealId ? await getDealWithContext(workspaceId, args.dealId) : null;
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Prepare a meeting briefing for ${contact.fullName}.

Contact info: ${JSON.stringify(contact)}
${deal ? `Deal context: ${JSON.stringify(deal)}` : "No associated deal."}
Recent activities: ${JSON.stringify(contact.recentActivities)}

Please provide:
1. Key relationship context and history
2. Open action items and pending tasks
3. Deal health and risks (if applicable)
4. Suggested talking points
5. Questions to ask`,
        },
      }],
    };
  });

  server.prompt("deal_summary", "Summarize the current state of a deal", { dealId: { type: "string" } }, /* ... */);
  server.prompt("follow_up_draft", "Draft a follow-up email after a meeting", { activityId: { type: "string" } }, /* ... */);
}
```

**Testing**:
- Integration: MCP client lists prompts → returns meeting_prep, deal_summary, follow_up_draft
- Integration: Get meeting_prep prompt with contactId → returns formatted message with contact context
- Integration: Get deal_summary prompt → includes health score and activity history

#### 11.4 — MCP HTTP Transport & Settings UI

**What**: HTTP transport endpoint for the MCP server and UI for generating API keys for AI assistant connections.

**Design**:

```typescript
// src/app/api/mcp/route.ts
// HTTP SSE transport for MCP per spec
// Authenticates via Bearer token (MCP API key)
// Creates McpServer scoped to the workspace of the authenticated key
```

Settings page at `/settings/integrations`:
- "AI Assistants (MCP)" section
- Generate MCP API key (workspace-scoped, display once)
- Connection instructions for Claude Desktop, Cursor, etc.
- List active MCP connections with last-seen timestamp

**Testing**:
- Integration: MCP client connects via HTTP → handshake succeeds → resources listed
- Integration: Invalid API key → 401 response
- E2E: Settings → generate MCP key → key displayed → copy to clipboard

---

## Phase 12: Reporting, Import/Export & Polish

### Purpose
Add pipeline analytics, vCard/CSV import/export for data migration, OpenAPI 3.1 spec generation, and final polish. After this phase, the product is ready for an open-source launch with complete CRM functionality, AI features, and developer-friendly APIs.

### Tasks

#### 12.1 — Pipeline Reports & Dashboard

**What**: Dashboard with key pipeline metrics: deal value by stage, win rate, deal velocity, and score distribution.

**Design**:

Dashboard page at `/`:
```
Pipeline Health Dashboard
├── KPI cards: Open deals, Pipeline value (weighted), Avg deal cycle (days), Win rate
├── Pipeline funnel chart (deals + value by stage)
├── Deal health distribution (hot/warm/cool/cold pie chart)
├── Activity volume (emails + meetings per day, 30-day line chart)
└── Stale deals table (deals with no activity > 7 days, sorted by value)
```

tRPC endpoints:
```typescript
// src/server/trpc/routers/reports.ts
reports: t.router({
  pipelineSummary: protectedProcedure.input(z.object({
    pipelineId: z.string().uuid().optional(),
    dateRange: z.object({ from: z.date(), to: z.date() }).optional(),
  })).query(async ({ ctx, input }) => {
    // Aggregate: deal count and total value per stage
    // Win rate: won / (won + lost) in date range
    // Avg cycle time: mean(actual_close_date - created_at) for closed deals
    // Health distribution: count per healthLabel
  }),

  activityVolume: protectedProcedure.input(z.object({
    days: z.number().int().min(7).max(90).default(30),
  })).query(async ({ ctx, input }) => {
    // Group activities by date and type
    // Return: [{ date: string, emails: number, meetings: number, calls: number, notes: number }]
  }),

  staleDeals: protectedProcedure.query(async ({ ctx }) => {
    // Open deals with last_activity_at > 7 days ago, sorted by amount DESC
  }),
});
```

Charts use recharts library for React server-compatible rendering.

**Testing**:
- Integration: pipelineSummary returns correct aggregates for workspace with known deal data
- Integration: Win rate computed correctly: 3 won / (3 won + 2 lost) = 60%
- Integration: staleDeals returns only deals with no activity in > 7 days
- E2E: Dashboard loads → funnel chart renders → clicking stage filters to deal list

#### 12.2 — vCard & CSV Import/Export

**What**: Import contacts from vCard (.vcf) and CSV files; export contacts/companies/deals as CSV.

**Design**:

Import flow:
```typescript
// src/server/services/import/vcard-parser.ts
// Parse RFC 6350 vCard 4.0 files
// Map vCard properties to contact fields:
//   FN → fullName
//   N → firstName, lastName
//   EMAIL → email
//   TEL → phone
//   TITLE → jobTitle
//   ADR → city, countryCode
//   ORG → match/create company
// Return { contacts: NewContact[], companies: NewCompany[], errors: ImportError[] }

// src/server/services/import/csv-parser.ts
// Parse CSV with configurable column mapping
// User maps CSV columns to contact/company/deal fields via UI
// Handles: deduplication by email, encoding detection, date parsing
```

Export flow:
```typescript
// src/server/trpc/routers/export.ts
export: t.router({
  contacts: protectedProcedure.input(z.object({
    format: z.enum(["csv", "vcf"]),
    filters: listContactsSchema.optional(),
  })).mutation(async ({ ctx, input }) => {
    // Stream contacts matching filters as CSV or vCard
    // Return download URL (temporary, expires in 1 hour)
  }),
});
```

**Testing**:
- Unit: vCard with FN, EMAIL, ORG → contact with fullName, email, companyName
- Unit: vCard with multiple TEL properties → first phone number used
- Unit: CSV with header mapping → contacts created with correct field assignments
- Integration: Import 100-contact CSV → 100 contacts created, duplicates merged by email
- Integration: Export contacts as CSV → download file contains all contacts with custom fields
- E2E: Import page → upload .vcf → preview → confirm → contacts appear in list

#### 12.3 — OpenAPI 3.1 Spec Generation

**What**: Auto-generated OpenAPI 3.1 specification for the public REST API at `/api/v1/*`, published at `/api/v1/openapi.json`.

**Design**:

Use `zod-to-openapi` to generate OpenAPI schemas from the Zod validators already used in tRPC.

```typescript
// src/app/api/v1/openapi.json/route.ts
import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

const registry = new OpenAPIRegistry();
// Register all endpoints from v1 REST routes
// Register Zod schemas as OpenAPI components

export async function GET() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const doc = generator.generateDocument({
    openapi: "3.1.0",
    info: { title: "AI-Native CRM API", version: "1.0.0" },
    servers: [{ url: "/api/v1" }],
    security: [{ bearerAuth: [] }],
  });
  return Response.json(doc);
}
```

**Testing**:
- Integration: GET `/api/v1/openapi.json` → valid OpenAPI 3.1 document
- Unit: Generated spec includes all REST endpoints with correct methods and paths
- Unit: Zod schemas correctly translated to JSON Schema components

#### 12.4 — Seed Data & Developer Experience

**What**: Development seed script and documentation for getting started.

**Design**:

```typescript
// scripts/seed.ts
// Creates:
// - 1 workspace ("Acme Sales Team")
// - 3 users (admin, rep1, rep2)
// - 1 default pipeline with 6 stages
// - 50 companies with realistic domain/industry data
// - 200 contacts distributed across companies
// - 30 deals across pipeline stages with amounts
// - 500 activities (emails, meetings, notes)
// - 5 custom field definitions (contract_value, renewal_date, tech_stack, etc.)
// - Pre-computed deal health scores
```

**Testing**:
- Integration: Run seed script → all entities created → pipeline board shows deals
- Integration: Seed data includes activities within last 30 days for realistic timeline views

---

## Phase Summary & Dependencies

```
Phase 1: Foundation & Scaffold          ─── required by everything
    │
Phase 2: Core CRM Entities & API       ─── requires Phase 1
    │
    ├── Phase 3: Frontend Shell & Pipeline Board ─── requires Phase 2
    │       │
    │       └── Phase 5: Activity Timeline & Search ─── requires Phase 3, Phase 4
    │
    ├── Phase 4: Email & Calendar Sync  ─── requires Phase 2
    │       │
    │       ├── Phase 6: LLM Summaries & Follow-Ups ─── requires Phase 4, Phase 5
    │       │
    │       └── Phase 7: ML Scoring     ─── requires Phase 4, Phase 5
    │
    ├── Phase 8: GDPR Enrichment        ─── requires Phase 2 (can parallel with 4-7)
    │
    ├── Phase 9: Custom Fields & Objects ─── requires Phase 2 (can parallel with 4-8)
    │
    └── Phase 10: Webhooks & Workflows  ─── requires Phase 2 (can parallel with 4-9)
         │
Phase 11: MCP Server                   ─── requires Phase 2 (benefits from Phase 6, 7)
    │
Phase 12: Reports, Import/Export        ─── requires Phase 3 (benefits from all prior phases)
```

### Parallelism Opportunities

- **Phases 8, 9, 10**: Can be developed concurrently after Phase 2; they don't depend on each other or on the email sync pipeline.
- **Phase 11**: Can start after Phase 2; MCP resources and tools map to the same CRUD operations. Benefits from but doesn't require the AI features (Phase 6, 7).
- **Phase 3 and Phase 4**: Can be partially parallelised — frontend shell can be built while email sync backend is in progress, since the frontend uses tRPC which works with seed data.

---

## Definition of Done (per phase)

1. All tasks implemented and functional.
2. All unit and integration tests pass (`pnpm test`).
3. TypeScript strict mode compiles with zero errors (`pnpm build`).
4. ESLint passes with no errors (`pnpm lint`).
5. Docker build succeeds (`docker build .`).
6. Feature works end-to-end in browser (for phases with UI).
7. New API endpoints documented (for REST API additions).
8. Database migrations generated and applied (`pnpm drizzle-kit generate && pnpm drizzle-kit push`).
9. New environment variables documented in `.env.example`.
10. Sensitive data (tokens, keys) encrypted at rest.
11. No OWASP API Security Top 10 violations introduced (BOLA, excessive data exposure, mass assignment).
12. Workspace isolation enforced on all new queries (workspace_id filter or RLS).
