# AI-Native CRM — Feature & Functionality Survey

> Candidate #41 · Researched: 2026-05-01

## Solutions Analysed

| Tool | Type | Licence / Model | URL |
|------|------|-----------------|-----|
| Salesforce Sales Cloud + Einstein | Commercial SaaS | Proprietary; $25–$330/user/mo | https://salesforce.com |
| HubSpot CRM + Breeze AI | Commercial SaaS | Proprietary; free–$150/user/mo | https://hubspot.com |
| Attio | Commercial SaaS | Proprietary; est. $30–$50/user/mo | https://attio.com |
| Lightfield | Commercial SaaS | Proprietary; invite-based | https://lightfield.app |
| Pipedrive | Commercial SaaS | Proprietary; $14–$64/user/mo | https://pipedrive.com |
| Microsoft Dynamics 365 Sales | Commercial SaaS | Proprietary; from $65/user/mo | https://microsoft.com/dynamics365 |
| Twenty CRM | Open Source | AGPL-3.0; self-hosted free | https://twenty.com |
| SuiteCRM | Open Source | AGPL-3.0; self-hosted free | https://suitecrm.com |
| Odoo CRM | Open Source + Commercial | LGPL (Community); proprietary Enterprise | https://odoo.com |

## Feature Analysis by Solution

### Salesforce Sales Cloud + Einstein

**Core features**
- Contact, account, and opportunity management with customisable fields and page layouts
- Pipeline management with stage-based forecasting
- Activity logging (calls, emails, meetings) with task reminders
- Reports and dashboards with drag-and-drop builder
- Einstein AI: lead scoring, opportunity health scoring, email summarisation, and activity capture

**Differentiating features**
- Largest CRM ecosystem: thousands of AppExchange integrations
- Einstein Copilot: conversational AI assistant for record summarisation and next-step recommendations
- Agentforce: autonomous AI agent framework for customer-facing workflows (2025–2026)
- Native Slack integration for deal collaboration

**UX patterns**
- Highly configurable but requires admin expertise; steep onboarding curve
- Lightning Experience web UI with record-centric navigation
- Mobile app with offline sync capability

**Integration points**
- Thousands of native AppExchange connectors
- REST and SOAP APIs; Salesforce Flow for automation
- Native: Slack, Tableau, MuleSoft

**Known gaps**
- AI features feel bolted onto a data-entry-centric architecture, not native
- Heavy admin overhead; high total cost of ownership
- Expensive at scale; $330/user/mo for Unlimited tier

**Licence / IP notes**
- Fully proprietary; no open-source components in core CRM

---

### HubSpot CRM + Breeze AI

**Core features**
- Contact, company, and deal management with automatic activity logging from connected email/calendar
- Visual pipeline boards with drag-and-drop stage management
- Email integration with tracking (opens, clicks) and sequence templates
- Breeze Intelligence (formerly Clearbit): real-time contact and company enrichment
- Breeze AI Copilot: writing assistant for emails, meeting summaries, and CRM field suggestions

**Differentiating features**
- Free CRM tier with no time limit; lowest barrier to adoption in the category
- Breeze Intelligence enriches inbound form fills in real time, shortening forms to improve conversion
- Native enrichment from Clearbit acquisition eliminates need for third-party data vendor

**UX patterns**
- Consumer-grade web UI; minimal training required
- Unified hub navigation across Marketing, Sales, Service, and CMS tools
- Inline AI suggestions within deal records and email composer

**Integration points**
- Native: Gmail, Outlook, Zoom, Slack, Shopify, Stripe
- 1,500+ App Marketplace integrations
- REST API with OAuth 2.0

**Known gaps**
- AI features remain shallow compared to Attio and Lightfield
- Data silos between Hubs require expensive bundle upgrades
- Breeze Intelligence coverage thinner than ZoomInfo for enterprise/EU contacts
- Enrichment ecosystem now locked to HubSpot platform

**Licence / IP notes**
- Fully proprietary; Clearbit data is proprietary

---

### Attio

**Core features**
- Flexible, programmable data model: custom objects, attributes, and relationships without code
- "Ask Attio" natural-language query layer for ad-hoc CRM data questions
- Real-time contact and company enrichment from curated public data sources
- Workflow automation engine with trigger/action builder
- Kanban, list, table, and board views across any object type

**Differentiating features**
- Fully customisable data model: teams design their own CRM schema rather than conforming to Salesforce's fixed structure
- Strongest CRM for AI-native tech companies; 4x ARR growth year-on-year as of 2026
- Google Ventures-backed; $141M raised; fastest-growing CRM in the modern GTM segment
- No-code custom object system enables RevOps teams to iterate the CRM schema without engineering help

**UX patterns**
- Spreadsheet-like list views combined with Kanban pipeline boards
- Inline editing across all views; keyboard-navigation optimised
- Slack-like comment threads on records for team collaboration

**Integration points**
- Native: Gmail, Outlook, Slack, Zapier, Make
- REST API; webhooks for custom integrations
- Enrichment from proprietary public-data sources

**Known gaps**
- Still maturing on enterprise features (advanced approval workflows, territory management)
- Autonomous agent features less developed than Lightfield's zero-entry model
- Sales reps still spend time on manual data entry; not zero-entry

**Licence / IP notes**
- Fully proprietary SaaS

---

### Lightfield

**Core features**
- Zero-entry pipeline population: connects to inbox, and the CRM populates automatically from emails, meetings, and calls with no manual data entry required
- "Complete customer memory": structures unstructured conversation data into CRM records autonomously
- Meeting prep briefs auto-generated before each customer meeting
- Deal stage inference from communication patterns without rep action
- AI-driven follow-up draft generation post-meeting

**Differentiating features**
- Only CRM that requires no manual data entry as its core design principle, not an add-on
- Built by the founders of Tome (25M users); $81M raised at $300M valuation
- Five-minute onboarding: connect inbox, import CSV from legacy CRM, pipeline populated immediately
- Represents the most radical departure from the Salesforce data-entry paradigm

**UX patterns**
- Minimal, conversation-centric UI rather than form-heavy record editing
- Timeline view of customer interactions with AI-generated summaries
- Designed to be read, not filled in

**Integration points**
- Gmail / Google Workspace (primary)
- Outlook integration in roadmap
- Limited third-party integrations at launch stage

**Known gaps**
- Very early-stage; limited integrations compared to established CRMs
- Primarily tested for B2B SaaS GTM teams; untested for complex enterprise use cases
- Invite-only access limits adoption research
- Entirely cloud-based; no self-hosted or privacy-first option

**Licence / IP notes**
- Fully proprietary; invite-based commercial SaaS

---

### Pipedrive

**Core features**
- Pipeline-centric CRM with visual deal tracking as the primary UX metaphor
- Email integration with open/click tracking and two-way sync
- AI sales assistant: deal probability scores, activity reminders, and email drafting suggestions
- Goals and activity-based selling methodology enforcement

**Differentiating features**
- Most intuitive pipeline UI in the category; purpose-built for sales reps rather than admins
- Flat pricing model accessible to SMBs ($14–$64/user/mo)
- Marketplace of 400+ integrations

**UX patterns**
- Pipeline board as the default home screen; drag deals across stages
- Activity-first design: each deal has a mandatory next activity to prevent stalled pipelines

**Integration points**
- Native: Gmail, Outlook, Zoom, Slack, Zapier
- REST API; 400+ marketplace integrations

**Known gaps**
- Limited AI depth; deal probability scoring is rule-based rather than ML-driven
- Not suitable for high-volume outbound or complex enterprise deal structures
- Marketing automation requires third-party tools or expensive add-ons

**Licence / IP notes**
- Fully proprietary

---

### Twenty CRM

**Core features**
- Core CRM objects: contacts, companies, opportunities, activities with standard relationship model
- Email and calendar sync (two-way)
- Kanban pipeline board; list and table views
- Workflow engine: triggers (record created/updated, scheduled), actions (create record, send email, call webhook), conditional logic
- Custom objects and fields via TypeScript SDK (Twenty 2.0)
- Role-based permissions
- Self-hosted deployment (Docker) or cloud option

**Differentiating features**
- #1 open-source CRM on GitHub by stars (~44,000 stars as of 2026); AGPL-3.0
- TypeScript SDK (twenty-sdk) allows developers to define data models, server-side logic, and React components deployed inside Twenty
- Extensions scaffolded via `npx create-twenty-app`; designed for AI agent and custom skill integration
- Full data ownership via self-hosted deployment; no vendor lock-in

**UX patterns**
- Modern, Notion-influenced interface; significantly more polished than SuiteCRM
- Inline editing across all views
- Command palette for keyboard-driven navigation

**Integration points**
- Gmail, Outlook (email/calendar sync)
- Webhooks; REST API
- Extensible via TypeScript plugins for custom integrations

**Known gaps**
- AI features nascent; no zero-entry, autonomous pipeline population, or built-in LLM scoring
- Workflow engine functional but less powerful than Salesforce Flow for complex automation
- Enterprise features (territory management, advanced approval chains) absent
- Limited ecosystem of third-party integrations compared to Salesforce/HubSpot

**Licence / IP notes**
- AGPL-3.0: copyleft licence; network use triggers share-alike obligations; commercial SaaS deployments must open-source modifications or obtain a commercial licence from Twenty

---

### SuiteCRM

**Core features**
- Full-featured open-source CRM: contacts, accounts, leads, opportunities, cases, contracts, quotes
- Campaign management and email marketing
- Role-based security and team management
- Reporting engine with scheduled report delivery
- Module builder for custom objects and fields

**Differentiating features**
- Most feature-complete open-source CRM; widest breadth of legacy CRM capabilities
- Active fork of SugarCRM with ongoing community maintenance
- On-premises deployment with full data ownership

**UX patterns**
- PHP-based web application; dated but functional UI
- Admin-heavy configuration; not self-service for business users

**Integration points**
- REST and SOAP APIs
- SMTP email integration
- Third-party plugins via SuiteCRM Store

**Known gaps**
- Significantly dated UI compared to Twenty, Attio, and modern CRMs
- AI capabilities entirely absent from core; require third-party plugin development
- Slow release cadence; security patches can lag
- Not suitable as an AI-native platform without substantial custom engineering

**Licence / IP notes**
- AGPL-3.0 (same copyleft obligations as Twenty)

---

## Cross-Cutting Feature Themes

### Table-Stakes Features
- Contact, company, and deal/opportunity record management with custom fields
- Two-way email sync with activity logging (automatic capture of sends, replies)
- Calendar sync for meeting activity logging
- Visual pipeline board with configurable deal stages
- Basic reporting: pipeline value by stage, win rate, activity counts
- Role-based access control
- REST API for third-party integration
- Mobile application (or responsive web)

### Differentiating Features
- Zero-entry or near-zero-entry data capture from email/calendar/call (Lightfield model)
- ML-based lead and deal scoring using communication signals (not just manually configured rules)
- LLM-generated meeting summaries, follow-up drafts, and deal health commentary
- Flexible custom object system without rigid schema (Attio model)
- Natural-language query interface for ad-hoc CRM data exploration
- Enrichment from public/permissioned data sources with auditable provenance
- Autonomous AI agents that perform CRM actions (update fields, send follow-ups) without rep input
- Privacy-compliant enrichment for GDPR-regulated environments

### Underserved Areas / Opportunities
- **OSS zero-entry CRM**: No open-source equivalent to Lightfield's auto-population approach exists; Twenty CRM has the architecture but not the AI features
- **GDPR-compliant enrichment built into OSS CRM**: Commercial enrichment (Clearbit/Breeze, ZoomInfo) raises compliance concerns; an OSS CRM enriching from public registries and permissioned sources with auditable data lineage fills a gap
- **Mid-market AI-native OSS**: Gap between "free and basic" (SuiteCRM/Odoo) and "expensive and AI-complete" (Salesforce Einstein) is large and underserved

### AI-Augmentation Candidates
- Contact and deal record creation: manual data entry → LLM extraction from email/calendar/call transcripts
- Lead scoring: rule-based manual scoring → ML model trained on email response latency, meeting acceptance rates, engagement signals
- Meeting preparation: manual research → auto-generated briefings from CRM history, news, and enrichment data
- Follow-up drafting: rep writes from scratch → LLM draft from meeting transcript and deal context
- Win/loss analysis: manual review → LLM synthesis of closed deal communication patterns

## Legal & IP Summary

Twenty CRM and SuiteCRM are both AGPL-3.0: any modifications deployed as a network service must be released as open source under AGPL, or a commercial licence obtained from the project maintainer. This is a meaningful constraint for building a commercial SaaS product on top of either codebase. Odoo Community Edition is LGPL, which is more permissive for integration but the CRM module itself carries LGPL obligations. All commercial platforms (Salesforce, HubSpot, Attio, Lightfield, Pipedrive, Microsoft Dynamics) are fully proprietary with no code reuse permitted. GDPR Article 14 (transparency) and Article 6 (lawful basis) apply to any contact enrichment feature; legitimate interest is the most common basis claimed by commercial vendors but is increasingly scrutinised by EU data protection authorities. No specific patent concerns on CRM AI features were identified, though Salesforce holds patents on aspects of its Einstein scoring methodology.

## Recommended Feature Scope

**Must-have (MVP)**:
- Contact, company, and opportunity record management with custom field support
- Two-way email and calendar sync with automatic activity logging (zero manual entry for standard interactions)
- Pipeline board with configurable stages and probability weighting
- LLM-generated meeting summaries and follow-up draft suggestions from synced calendar/email context
- ML-based deal health scoring using communication engagement signals
- REST API and webhook support for third-party integration

**Should-have (v1.1)**:
- Natural-language query interface ("show me all deals that haven't had activity in 14 days")
- Contact enrichment from permissioned/public data sources with auditable provenance (GDPR-safe by design)
- Workflow automation: trigger-action builder with conditional logic for common sales sequences
- Win/loss analysis: LLM synthesis of closed deal communication and notes

**Nice-to-have (backlog)**:
- Autonomous AI agents that update CRM fields and trigger actions without rep input
- Mobile application with push notifications for deal activity alerts
- Competitive intelligence surfacing: detect competitor mentions across deal communications
- Revenue forecasting: statistical and ML-based pipeline roll-up with confidence intervals
- Full self-hosted deployment with on-premises LLM option for privacy-sensitive deployments
