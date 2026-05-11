# MCP Server Contract: AI-Native CRM

**Protocol**: Model Context Protocol (MCP) Specification 2025-11-25
**Transport**: HTTP SSE at `/api/mcp`
**Authentication**: Bearer token (MCP API key, workspace-scoped)
**SDK**: @modelcontextprotocol/sdk

## Resources

Resources expose CRM data for AI assistant context (read-only).

| Resource | URI Pattern | Description |
|----------|-------------|-------------|
| contacts | `crm://contacts` | List of contacts (key fields: name, email, company, stage, score) |
| contact | `crm://contacts/{id}` | Full contact record with recent activities |
| companies | `crm://companies` | List of companies (name, domain, industry, deal totals) |
| company | `crm://companies/{id}` | Company with contacts and deals |
| deals | `crm://deals` | Pipeline overview (all open deals with stages and scores) |
| deal | `crm://deals/{id}` | Deal detail with stakeholders, health score, stage history |
| activities | `crm://activities` | Recent activity feed (last 50) |

All resources are filtered by the authenticated workspace.

## Tools

Tools expose CRM write operations for AI agents.

| Tool | Description | Parameters |
|------|-------------|------------|
| create_contact | Create a new CRM contact | `fullName` (required), `email`, `companyName`, `jobTitle` |
| update_contact | Update an existing contact | `contactId` (required), `email?`, `jobTitle?`, `lifecycleStage?` |
| create_deal | Create a new deal | `name` (required), `pipelineId`, `stageId`, `amount?`, `companyId?` |
| update_deal_stage | Move a deal to a pipeline stage | `dealId` (required), `stageName` (required) |
| log_activity | Log a note or call on a contact/deal | `type` (note\|call), `contactId`, `dealId?`, `subject`, `body` |
| create_task | Create a task | `title` (required), `assigneeId?`, `contactId?`, `dealId?`, `dueAt?` |
| search_crm | Search across contacts, companies, deals | `query` (required) |
| get_deal_health | Get deal health score and breakdown | `dealId` (required) |

All tools enforce the same workspace isolation and permission rules as the web UI.

## Prompts

Reusable prompt templates for common CRM tasks.

| Prompt | Description | Parameters |
|--------|-------------|------------|
| meeting_prep | Prepare a briefing for an upcoming meeting | `contactId` (required), `dealId?` |
| deal_summary | Summarize the current state of a deal | `dealId` (required) |
| follow_up_draft | Draft a follow-up email after a meeting | `activityId` (required) |
| pipeline_review | Review overall pipeline health and risks | — |

### meeting_prep Output Structure

Returns a user message containing:
1. Key relationship context and history
2. Open action items and pending tasks
3. Deal health and risks (if applicable)
4. Suggested talking points
5. Questions to ask

### deal_summary Output Structure

Returns a user message containing:
1. Deal overview (name, amount, stage, owner)
2. Health score with contributing factors
3. Recent activity summary
4. Stakeholder map
5. Risk assessment and recommended actions
