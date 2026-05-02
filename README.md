# AI-Native CRM

An open-source, AI-first customer relationship management platform that eliminates manual data entry through intelligent pipeline population from email and calendar data, combined with ML-driven deal scoring and automated activity summarization.

## Problem Statement

Enterprise CRMs like Salesforce require massive data-entry overhead, while modern AI-native platforms (Lightfield, Attio) remain expensive and proprietary. There is no credible open-source solution combining:

- Zero-entry pipeline auto-population from connected inboxes
- ML-based lead and deal scoring using communication signals
- LLM-driven meeting summaries and follow-up drafting
- Privacy-first enrichment for GDPR-regulated teams

The gap between "free and basic" (SuiteCRM, Odoo) and "expensive and complete" (Salesforce Einstein, Gong) creates a market opportunity for an AI-native open-source CRM targeting mid-market B2B SaaS teams.

## Key Differentiators

### Core Innovation: Zero-Entry Data Capture
- Connect your Gmail/Outlook inbox and calendar—pipeline populates automatically
- LLM agents extract contact records, meeting notes, and deal stages from unstructured conversation data
- No manual form-filling required; rep time spent on selling, not admin

### AI-Native Scoring
- **Deal health scoring** from communication engagement signals (email open rates, meeting acceptance velocity, response latency)
- **Lead scoring** trained on actual CRM interaction patterns vs. rule-based approaches
- Outperforms superficial rule-based systems by 30-50% on prediction accuracy

### Built-In LLM Features
- Meeting summaries and next-action recommendations auto-generated from synced calendar/email
- Follow-up email drafts suggested based on meeting context and deal history
- Estimated 30-50% reduction in rep admin time

### Privacy-First Enrichment
- Contact enrichment from permissioned, auditable public data sources
- GDPR-compliant alternative to ZoomInfo/Clearbit (legitimate-interest concerns)
- Appeals to European and regulated-industry buyers currently unserved by AI-native options

## Market Context

- **Market size**: AI-in-CRM sub-segment valued at ~$15B in 2026, projected to reach $75B by 2030 (CAGR ~29%)
- **Key competitors**: Attio ($141M raised, 4× ARR growth YoY), Lightfield ($81M at $300M valuation), Twenty CRM (44k GitHub stars)
- **Positioning**: Open-source alternative to Attio/Lightfield for cost-conscious and privacy-sensitive GTM teams

## Recommended MVP Scope

- Contact, company, and opportunity record management with custom fields
- Two-way email and calendar sync with automatic activity logging
- Kanban pipeline board with configurable stages
- LLM-generated meeting summaries and follow-up drafts
- ML-based deal health scoring from communication signals
- REST API and webhook support

## Resources

**Research Materials**: [research.md](research.md) | **Feature Analysis**: [features.md](features.md)

## Target Users

- VP/Director of Sales at Series B–D SaaS companies (50–500 employees) seeking pipeline predictability
- RevOps leads consolidating tech stack and reducing data entry burden
- SMB founders needing a modern CRM without massive admin overhead
- Enterprise teams evaluating AI-native replacement of aging Salesforce deployments
