# Frequently Asked Questions

---

## Getting Started

### How do I sign up for NativeCRM?
Go to app.nativecrm.com and click Sign Up. You can log in with your Google or Microsoft account -- there is no separate password to create or remember.

### Can I try NativeCRM before committing?
Yes. NativeCRM offers a free trial so you can explore the full product with your own data. No credit card is required to start the trial.

### How do I invite my team?
Go to Settings > Workspace > Members and click Invite Member. Enter their email address and select a role (admin or member). They will receive an email with a link to join your workspace.

### Can I have multiple workspaces?
Yes. You can create separate workspaces for different teams or business units. Each workspace is completely isolated -- data, contacts, deals, and settings are not shared between workspaces. Switch between workspaces using the workspace selector in the top-left corner.

### What browsers does NativeCRM support?
NativeCRM works in all modern browsers: Chrome, Firefox, Safari, and Edge. We recommend keeping your browser up to date for the best experience. Internet Explorer is not supported.

### Is there a mobile app?
NativeCRM is designed as a responsive web application that works well on mobile browsers. A dedicated native app for iOS and Android is on the roadmap.

---

## Email and Calendar Sync

### Which email providers does NativeCRM support?
NativeCRM supports Gmail (including Google Workspace) and Microsoft Outlook (including Microsoft 365). Other email providers are not supported at this time.

### How far back does the email sync go?
When you first connect your email, NativeCRM syncs the last 30 days of email history. After that, new emails are synced incrementally as they arrive, typically within a few minutes.

### Does NativeCRM send emails on my behalf?
NativeCRM never sends email on your behalf without your explicit action. When using AI follow-up drafts, you review and edit the draft before choosing to send. The email is sent from your own email account.

### Will connecting my email slow down my email client?
No. NativeCRM uses background sync through your email provider's API and does not interfere with your email client. You will not notice any performance difference.

### Can I disconnect my email later?
Yes. Go to Settings > Integrations > Email and click Disconnect. Previously synced email data remains in NativeCRM unless you explicitly request its deletion.

### Does calendar sync work with shared calendars?
Calendar sync pulls events from your primary calendar. Shared calendars and delegated calendars are not synced by default. If you need to sync a shared calendar, contact support for assistance.

---

## AI Features

### How does the AI meeting summary work?
After a synced calendar meeting ends, NativeCRM generates a summary using AI. The summary includes key discussion points, action items, overall sentiment, and topic tags. Summaries typically appear within 15 minutes of the meeting ending.

### Are AI summaries always accurate?
AI summaries are generated from available context such as meeting metadata, prior email threads, and notes. They are highly useful but should be treated as a helpful reference, not a transcript. Always verify critical details.

### Can I edit an AI-generated summary?
Yes. Open the summary from the AI Insights tab and click Edit. You can modify any part of the summary, add missing details, or correct inaccuracies. Edited summaries are marked as "human-reviewed."

### How does the AI draft follow-up emails?
NativeCRM uses the meeting summary, recent email history, and deal context to generate a draft follow-up email. You can review, edit, and send it from the meeting summary view. The draft is a starting point -- personalize it before sending.

### What is a deal health score?
A score from 0 to 100 that indicates how healthy and active a deal is. It is calculated from email frequency, meeting cadence, response times, and stage progression speed. Higher scores mean the deal is progressing well; lower scores suggest it needs attention.

### Can I turn off AI features?
Yes. Workspace admins can disable specific AI features at Settings > AI. You can turn off meeting summaries, follow-up drafts, and deal scoring independently.

---

## Data and Privacy

### Who can see my data?
Only members of your workspace can see your CRM data. Workspaces are completely isolated from each other. Within a workspace, all members can see all contacts, companies, and deals.

### Is my data encrypted?
Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). API tokens and webhook secrets are stored using one-way hashing and cannot be retrieved after creation.

### Can I export all my data?
Yes. You can export contacts, companies, deals, and activities in CSV or JSON format from any list view. For a full workspace export, contact support to request a complete data export package.

### How do I handle a GDPR data subject access request?
Navigate to the relevant contact record, click the Privacy tab, and use the Data Export function to generate a complete report of all data held for that individual. For erasure requests, use the Process Erasure Request button on the same tab.

### Where is my data stored?
NativeCRM data is stored in secure cloud data centers. Contact sales or support for specific data residency requirements if your organization has geographic data storage mandates.

### What happens to my data if I cancel my subscription?
After cancellation, your data is retained for 30 days in case you change your mind. After 30 days, all workspace data is permanently deleted. You can request an export before or during this retention period.

---

## Customization

### Can I add custom fields to contacts, companies, or deals?
Yes. Workspace admins can add custom fields of various types (text, number, date, select, multi-select, boolean) at Settings > Custom Fields. Custom fields appear on forms, detail views, and are available through the API.

### What are custom objects?
Custom objects let you create entirely new entity types beyond contacts, companies, and deals. For example, you could create a "Products" object or a "Support Tickets" object with its own fields and relationships. Configure them at Settings > Custom Objects.

### Can I customize the pipeline stages?
The default pipeline stages (Qualification, Discovery, Proposal, Negotiation, Closed Won, Closed Lost) are built into the system. Custom pipeline configuration is on the product roadmap. You can use workflows to automate actions at specific stages.

### Can I create custom reports?
The built-in reports cover the most common analytics needs. Filters, date ranges, and groupings allow significant flexibility. For fully custom reports, export your data in CSV or JSON format and use your preferred analytics tool.

---

## Billing and Plans

### What plans are available?
NativeCRM offers multiple plans to fit different team sizes and needs. Visit the pricing page at nativecrm.com/pricing for current plan details, or contact sales for enterprise pricing.

### Can I change my plan later?
Yes. You can upgrade or downgrade your plan at any time from Settings > Billing. Upgrades take effect immediately; downgrades take effect at the start of your next billing cycle.

### How does billing work for team members?
NativeCRM is billed per workspace seat. Each user who joins your workspace counts as one seat. You can add or remove seats at any time, and charges are prorated.

---

## Troubleshooting

### My email sync seems stuck. What should I do?
First, check the sync status at Settings > Integrations > Email. If it shows an error, try disconnecting and reconnecting your email account. If the issue persists, check that you have not revoked NativeCRM's permissions in your Google or Microsoft account settings.

### I cannot find a contact I know exists. Where is it?
Check whether the contact was soft-deleted. Go to Contacts and toggle the Show Deleted filter. Also try the global search (Cmd+K / Ctrl+K) which searches across all records. If the contact was auto-created from email, it may have a slightly different name than expected.

### A deal's health score seems wrong. How is it calculated?
Deal health scores are based on email velocity, meeting frequency, response time, and stage progression. If a score seems off, check whether recent emails or meetings were properly linked to the deal. You can manually link activities to a deal from the activity's detail view.

### I accidentally deleted a contact. Can I get it back?
Yes. Deleted records are soft-deleted and retained for 90 days. Go to Contacts, toggle the Show Deleted filter, find the contact, and click Restore.

### My webhook is not receiving events. What should I check?
Go to Settings > Webhooks and open the Delivery Log for your webhook. Check for failed deliveries and inspect the HTTP status codes and error messages. Common issues include incorrect URLs, expired SSL certificates, firewall rules blocking inbound requests, and server timeouts exceeding 10 seconds.

### The AI meeting summary did not appear. Why?
AI summaries are generated only for meetings that are synced through calendar integration. Verify that your calendar is connected at Settings > Integrations > Calendar and that the meeting appears in your NativeCRM activity feed. Summaries typically take up to 15 minutes to generate after a meeting ends.
