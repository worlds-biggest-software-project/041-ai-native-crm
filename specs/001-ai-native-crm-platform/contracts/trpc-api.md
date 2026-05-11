# tRPC API Contract: AI-Native CRM

**Transport**: HTTP via Next.js App Router at `/api/trpc/[trpc]`
**Serialization**: SuperJSON (supports Date, BigInt, Map, Set)
**Authentication**: JWT session via Auth.js (cookie-based)

## Middleware

- **publicProcedure**: No authentication required (health check only)
- **protectedProcedure**: Requires valid session; injects `ctx.workspaceId` and `ctx.session`

## Routers

### health (public)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| health | query | — | `{ status: "ok", timestamp: Date }` |

### contacts

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| list | query | `{ cursor?, limit?, search?, lifecycleStage?, ownerId?, sortBy?, sortOrder? }` | `{ items: Contact[], nextCursor: string \| null }` |
| getById | query | `{ id: UUID }` | `Contact` (with company relation) |
| create | mutation | `CreateContactInput` | `Contact` |
| update | mutation | `{ id: UUID, ...PartialContactInput }` | `Contact` |
| delete | mutation | `{ id: UUID }` | `{ success: true }` |

### companies

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| list | query | `{ cursor?, limit?, search?, sortBy?, sortOrder? }` | `{ items: Company[], nextCursor }` |
| getById | query | `{ id: UUID }` | `Company` (with contact count, deal summary) |
| create | mutation | `CreateCompanyInput` | `Company` |
| update | mutation | `{ id: UUID, ...PartialCompanyInput }` | `Company` |
| delete | mutation | `{ id: UUID }` | `{ success: true }` |

### deals

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| list | query | `{ pipelineId?, stageId?, cursor?, limit?, sortBy?, sortOrder? }` | `{ items: Deal[], nextCursor }` |
| getById | query | `{ id: UUID }` | `Deal` (with company, contacts, stage history) |
| create | mutation | `CreateDealInput` | `Deal` |
| update | mutation | `{ id: UUID, ...PartialDealInput }` | `Deal` |
| delete | mutation | `{ id: UUID }` | `{ success: true }` |
| moveStage | mutation | `{ id: UUID, stageId: UUID }` | `Deal` |

### pipelines

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| list | query | — | `Pipeline[]` |
| create | mutation | `{ name, stages }` | `Pipeline` (admin only) |
| update | mutation | `{ id: UUID, name?, stages? }` | `Pipeline` (admin only) |

### activities

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| timeline | query | `{ contactId?, dealId?, companyId?, cursor?, limit?, activityType? }` | `{ items: Activity[], nextCursor }` |
| create | mutation | `{ activityType, subject, contactId?, dealId?, detail }` | `Activity` |

### ai

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| getSummary | query | `{ activityId: UUID }` | `AiSummary \| null` |
| generateSummary | mutation | `{ activityId: UUID }` | `{ jobId: string }` |
| reviewSummary | mutation | `{ summaryId: UUID, approved: boolean }` | `AiSummary` |
| getFollowUp | query | `{ activityId: UUID }` | `AiFollowUp \| null` |
| generateFollowUp | mutation | `{ activityId: UUID, contactId: UUID }` | `{ jobId: string }` |
| sendFollowUp | mutation | `{ followUpId: UUID }` | `AiFollowUp` |

### scoring

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| getDealHealth | query | `{ dealId: UUID }` | `{ score, label, updatedAt, trend, history[] }` |
| getLeadScore | query | `{ contactId: UUID }` | `{ score, label, updatedAt }` |
| rescore | mutation | `{ entityType, entityId }` | `{ jobId: string }` |

### enrichment

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| enrich | mutation | `{ entityType, entityId }` | `{ jobId: string }` |
| getLog | query | `{ entityType, entityId }` | `EnrichmentLogEntry[]` |
| reviewEnrichment | mutation | `{ logId: UUID, status: "accepted" \| "rejected" }` | `EnrichmentLogEntry` |

### sync

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| getConnections | query | — | `OAuthConnection[]` |
| initiateOAuth | mutation | `{ provider }` | `{ authUrl: string }` |
| revokeConnection | mutation | `{ connectionId: UUID }` | `{ success: true }` |

### webhooks (admin only)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| list | query | — | `Webhook[]` |
| create | mutation | `{ url, events[] }` | `Webhook` (with generated secret) |
| update | mutation | `{ id, url?, events?, isActive? }` | `Webhook` |
| delete | mutation | `{ id: UUID }` | `{ success: true }` |

### workflows (admin only)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| list | query | — | `Workflow[]` |
| create | mutation | `{ name, definition }` | `Workflow` |
| update | mutation | `{ id, name?, definition?, isActive? }` | `Workflow` |
| delete | mutation | `{ id: UUID }` | `{ success: true }` |
| getExecutions | query | `{ workflowId: UUID }` | `WorkflowExecution[]` |

### customFields (admin only for mutations)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| list | query | `{ entityType }` | `FieldDefinition[]` |
| create | mutation | `CreateFieldDefinitionInput` | `FieldDefinition` |
| update | mutation | `{ id, ...PartialFieldDefinitionInput }` | `FieldDefinition` |
| delete | mutation | `{ id: UUID }` | `{ success: true }` |
| reorder | mutation | `{ entityType, fieldIds[] }` | `{ success: true }` |

### search

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| global | query | `{ query, types?, limit? }` | `{ type, id, title, subtitle }[]` |

### export

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| contactsCsv | query | `{ search?, lifecycleStage?, ownerId? }` | `{ csv: string, count: number }` |
| contactsVcard | query | `{ search?, lifecycleStage?, ownerId? }` | `{ vcard: string, count: number }` |
| companiesCsv | query | `{ search? }` | `{ csv: string, count: number }` |
| dealsCsv | query | `{ pipelineId?, stageId? }` | `{ csv: string, count: number }` |

### reports

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| pipelineSummary | query | `{ pipelineId?, dateRange? }` | `{ stages[], winRate, avgCycleTime, healthDistribution }` |
| activityVolume | query | `{ days? }` | `{ date, emails, meetings, calls, notes }[]` |
| staleDeals | query | — | `Deal[]` (no activity >7 days, sorted by amount) |

### settings (admin only)

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| getWorkspace | query | — | `Workspace` |
| updateWorkspace | mutation | `{ name?, settings? }` | `Workspace` |
| listUsers | query | — | `User[]` |
| inviteUser | mutation | `{ email, role }` | `User` |
| updateUserRole | mutation | `{ userId, role }` | `User` |
| deactivateUser | mutation | `{ userId }` | `User` |
| generateMcpKey | mutation | — | `{ key: string }` (shown once) |
