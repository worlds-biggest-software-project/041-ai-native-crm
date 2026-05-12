# NativeCRM Sales Presentation Script

## 15-Slide Deck --- Speaker Notes and Talking Points

**Estimated Duration:** 25--30 minutes (15 min presentation + 10--15 min Q&A)
**Audience:** Sales leaders, VP Sales, RevOps, CRM administrators, founders

---

## Slide 1: Title Slide

**Visual:** NativeCRM logo. Tagline: "AI-Native, Not AI-Added."

**Talking Points:**
"Thanks for taking the time today. I'm [name] from NativeCRM, and over the next 15 minutes I'm going to show you a CRM that works fundamentally differently from anything you've seen before. I won't ask you to imagine anything --- I'll show you."

"But before I do, I want to understand your world a little better."

**Discovery Questions:**
- "What CRM is your team currently using?"
- "On a scale of 1 to 10, how would you rate your team's CRM adoption?"
- "If you could change one thing about your current CRM, what would it be?"

*Take notes on their answers. These become reference points throughout the presentation.*

---

## Slide 2: The Problem

**Visual:** Stat graphic: "Sales reps spend only 34% of their time selling." (Source: Salesforce State of Sales)

**Talking Points:**
"Here's a number that should concern every sales leader. According to Salesforce's own research, sales reps spend only 34% of their time actually selling. The rest goes to data entry, record updates, meeting notes, internal communication, and administrative tasks."

"For a team of 10 reps, that means roughly 6--7 of them are doing admin at any given moment, not generating revenue."

"And here's the irony: the tool that's supposed to help them sell --- the CRM --- is a major contributor to this problem. Reps spend hours every week feeding the CRM, and in return they get a system they resent using."

*Tie back to their answer:* "You mentioned your team is using [their CRM]. How much time do you think your reps spend on data entry per week?"

---

## Slide 3: Why This Happens

**Visual:** Diagram showing the legacy CRM architecture: Human -> Manual Entry -> Database -> Reports

**Talking Points:**
"This problem exists because every major CRM was designed with the same core assumption: humans will manually enter the data. Salesforce, HubSpot, Pipedrive --- they were all built in an era when there was no alternative."

"The result is a system that depends on human discipline for data quality. And we all know what happens: reps skip fields, delay updates, estimate instead of recording, or stop using the CRM entirely."

"This creates a cascade of problems: bad data leads to inaccurate forecasting, which leads to missed targets, which leads to more pressure on reps, who respond by spending even less time on the CRM."

---

## Slide 4: The NativeCRM Approach

**Visual:** New diagram: Email/Calendar -> AI Capture -> Database -> AI Analysis -> Insights + Actions

**Talking Points:**
"NativeCRM was built on a different assumption. We assume the CRM should capture its own data."

"Instead of asking humans to type, NativeCRM connects to the tools your team is already using --- Gmail, Outlook, calendar --- and extracts contacts, interactions, and meeting data automatically."

"Then AI analyzes that data: scoring deals, summarizing meetings, drafting follow-ups, enriching contacts. The human's role shifts from data entry to decision-making."

"This is what we mean by 'AI-native.' The intelligence isn't an add-on. It's the foundation that every other feature is built on."

---

## Slide 5: Live Demo --- Email Sync & Auto-Capture

**Visual:** Live product demo or recorded walkthrough

**KEY DEMO MOMENT: Show the pipeline board with auto-captured contacts and deals.**

**Talking Points:**
"Let me show you what this looks like in practice. I've connected a Gmail account to NativeCRM. Watch what happened automatically."

"These contacts were captured from email conversations. No one typed them in. These deals were created based on email threads that NativeCRM identified as sales conversations. These interaction logs were generated from the actual email exchanges."

*Point to specific records:* "This contact was captured three days ago from an email thread. Notice the professional data that's been enriched --- title, company, LinkedIn. The interaction timeline shows every email exchange, automatically."

**Discovery Question:**
"How does your team currently track new contacts? Is that a manual process?"

---

## Slide 6: Live Demo --- ML Deal Scoring

**Visual:** Live demo showing deal cards with health scores

**KEY DEMO MOMENT: Show a deal with a high score and a deal with a declining score. Hover over scores to show contributing factors.**

**Talking Points:**
"Every deal in NativeCRM gets a health score from 0 to 100, calculated by our ML model."

"This deal has a score of 82. If I hover over it, you can see why: the prospect is responding within hours, meeting frequency has increased over the past two weeks, and email sentiment is positive."

"Now look at this deal: it was at 71 last week and has dropped to 43. The model is flagging that the prospect's response time has doubled, they cancelled a scheduled meeting, and the last email had negative sentiment markers."

"This rep doesn't need to tell their manager the deal is at risk. The system already knows. And more importantly, it knew before the rep was ready to admit it."

*Tie back to their answers:* "You mentioned [their pain point with pipeline visibility]. This is how NativeCRM addresses that --- objective, real-time deal intelligence instead of subjective rep updates."

**Potential Objection:** "How accurate are these scores?"
**Response:** "The model improves as it learns from your team's specific win/loss patterns. Out of the box, it uses engagement signals that are proven predictors of deal outcomes across sales organizations. Most teams see meaningful accuracy within the first month of use."

---

## Slide 7: Live Demo --- AI Meeting Summaries

**Visual:** Live demo showing a meeting summary with action items and draft follow-up

**KEY DEMO MOMENT: Open a meeting record. Show the structured summary, extracted action items, and the draft follow-up email.**

**Talking Points:**
"This is one of our most popular features. After every meeting, NativeCRM generates a structured summary."

"Look at this meeting from earlier this week. Here's the summary --- key discussion points, decisions that were made, and commitments from both sides. Below that, you'll see extracted action items, each linked to the right contact."

"And at the bottom: a draft follow-up email. It references the specific points discussed, includes the agreed-upon next steps, and is ready to review and send."

"The total time from meeting end to follow-up sent: about 30 seconds of review. Compare that to the 15--20 minutes most reps spend writing notes and drafting emails after every call."

"For a rep doing 5 meetings a day, that's 60--90 minutes saved. Every day."

---

## Slide 8: The Kanban Pipeline

**Visual:** Demo of the drag-and-drop pipeline board

**Talking Points:**
"The pipeline board is where your team lives day-to-day. Drag and drop deals between stages. Each card shows the deal value, health score, and last activity. Color coding gives you immediate visual priority."

"The global search --- Cmd+K --- lets you jump to any record instantly. Contacts, companies, deals, activities. Most users tell us they stop using the navigation sidebar entirely."

"Custom stages, custom fields, custom views. Your pipeline should reflect how your team actually works, not how a vendor thinks you should work."

---

## Slide 9: Workflow Automation

**Visual:** Workflow builder interface

**Talking Points:**
"NativeCRM's workflow automation connects your pipeline events to actions."

"Examples: when a deal score drops below 40, automatically notify the manager. When a deal moves to 'Proposal Sent,' create a follow-up task for 3 days out. When a new contact is captured, trigger enrichment and assign to the right rep based on territory."

"These aren't hypothetical. They're configured in minutes and run automatically."

---

## Slide 10: Privacy & Data Control

**Visual:** GDPR badge. Self-hosting architecture diagram. Data residency map.

**Talking Points:**
"NativeCRM is the only AI-native CRM that gives you full control over your data."

"Option one: self-host with Docker. Your data stays on your infrastructure. No third-party access. Full GDPR compliance by design."

"Option two: our managed cloud, hosted in the region of your choice with a 99.9% SLA."

"Either way, NativeCRM is open source. MIT licensed. You can audit every line of code, including the AI processing. You can verify exactly how contact data is enriched and how deal scores are calculated."

"For organizations with strict data residency or compliance requirements, this is a meaningful differentiator."

**Potential Objection:** "Open source means less secure."
**Response:** "Open source means more transparent. Security vulnerabilities are identified faster by a community of developers, and you can audit the code yourself. We use the same enterprise-grade technologies --- Next.js, PostgreSQL, Docker --- that power platforms serving billions of users."

---

## Slide 11: Developer Platform

**Visual:** API documentation screenshot. Code snippets for webhooks and MCP integration.

**Talking Points:**
"For teams with technical resources, NativeCRM is a platform, not just a product."

"Full REST API. HMAC-signed webhooks --- every notification is cryptographically verified, so you can trust the data in your downstream systems."

"Custom fields and custom objects via API. Build the data model your business needs."

"And our MCP server integration lets AI assistants --- like Claude, or tools your team is building internally --- read and write CRM data natively. This is how CRMs will work in the future: as data platforms that AI systems interact with directly."

*Adjust depth based on audience:* If non-technical, keep this brief. If technical audience, offer to go deeper.

---

## Slide 12: Comparison

**Visual:** Feature comparison table: NativeCRM vs. Salesforce vs. HubSpot vs. Pipedrive

**Talking Points:**
"Let me put NativeCRM in context."

"Against Salesforce: comparable AI capabilities --- deal scoring, auto-capture, meeting intelligence. But without the six-month implementation, the $300/user/month total cost, or the consultant dependency."

"Against HubSpot: NativeCRM's AI features are available at every tier, including free. HubSpot gates intelligence behind their Enterprise plans."

"Against Pipedrive: NativeCRM matches the simplicity but adds genuine AI intelligence and the option to self-host."

"The fundamental difference: in those platforms, AI was added after the fact. In NativeCRM, AI is the architecture."

*Tie to their specific CRM:* "Since you're using [their CRM], the key differences for you would be [specific relevant points]."

**Potential Objection:** "We've invested a lot in our current CRM."
**Response:** "Completely understand. Many of our customers ran NativeCRM alongside their existing CRM for a month to compare data quality and rep adoption before committing. There's zero risk in trying it --- free tier, full features, no credit card."

---

## Slide 13: Pricing

**Visual:** Three-tier pricing: Free / Team $29/user/mo / Enterprise contact us

**Talking Points:**
"Our pricing philosophy is simple: no feature gating, no AI upsells."

"Free tier: self-host with Docker. Full feature set. Unlimited users. This is not a trial --- it's a permanent option for teams that want to manage their own infrastructure."

"Team at $29 per user per month: managed cloud, automatic updates, priority support, 99.9% SLA, SSO. Everything in free, plus we handle the infrastructure."

"Enterprise: dedicated infrastructure, custom SLA, onboarding and training, dedicated success manager, audit logs, and compliance documentation. Contact us for pricing."

"Compare that to Salesforce at $25 per user per month before adding Einstein AI at $50+ per user, Sales Engagement at $50, and Revenue Intelligence at $15. Their fully loaded cost often exceeds $150 per user."

---

## Slide 14: Getting Started

**Visual:** Three-step graphic: 1. Connect email  2. Watch pipeline build  3. Start selling smarter

**Talking Points:**
"Getting started takes minutes, not months."

"Step one: sign up and connect your team's email. Gmail and Outlook both supported. Takes about 60 seconds per person."

"Step two: give NativeCRM a few hours to sync your recent activity. You'll see contacts, deals, and interaction histories appear automatically."

"Step three: start using the pipeline. Deals already have health scores. Meetings already have summaries. Your team is productive from day one."

"No data migration marathon. No field mapping spreadsheet. No three-month implementation project. NativeCRM builds your pipeline from the conversations your team is already having."

---

## Slide 15: Close / Next Steps

**Visual:** Contact information. QR code to sign up. "AI-Native, Not AI-Added."

**Talking Points:**
"Here's what I'd recommend as a next step."

*For high-interest prospects:*
"I'd like to set up a 30-minute hands-on session where we connect your actual email --- or a test account --- and you can see NativeCRM build a pipeline from your real conversations. Would [specific date/time] work?"

*For mid-interest prospects:*
"The best way to evaluate NativeCRM is to try it. I can set your team up with a free account today. Connect one person's email, give it 24 hours, and see what it captures. No commitment, no credit card. Would that be useful?"

*For early-stage / evaluating prospects:*
"I'd be happy to send you a comparison document that maps NativeCRM features against [their current CRM] specifically. I can also add you to our sandbox environment so you can explore at your own pace. What would be most helpful?"

**Always end with:**
"Any questions I haven't addressed? Anything you'd want to see that I didn't show?"

---

## Appendix: Objection Handling Quick Reference

Use these throughout the presentation when objections arise naturally.

### "How does AI handle sensitive customer data?"
"Great question. NativeCRM can be self-hosted, which means your data never leaves your infrastructure. For cloud deployments, all data is encrypted at rest and in transit, and we don't use customer data to train models. The code is open source, so you can verify exactly how data is processed."

### "Our team won't switch CRMs."
"The adoption challenge with most CRMs is that they create work. NativeCRM eliminates work. Reps don't have to change their behavior --- they keep using email and calendar as they always do. NativeCRM does the CRM work in the background. Most teams see organic adoption because the tool is actually helpful."

### "We need [specific integration] that you don't have."
"Our REST API and HMAC-signed webhooks mean you can connect NativeCRM to any system that accepts HTTP requests. For the most common integrations, we have pre-built connectors. For anything custom, the API gives you full access. What's the specific integration you need? Let me check."

### "We're locked into an annual Salesforce contract."
"No problem. The free self-hosted tier means you can run NativeCRM in parallel right now, at zero cost, and compare. When your contract comes up for renewal, you'll have real data on which system your team prefers and which produces better pipeline data."

### "What about reporting and forecasting?"
"NativeCRM includes pipeline analytics, deal velocity tracking, and activity metrics. The ML deal scoring also improves forecast accuracy because it's based on behavioral data rather than rep estimates. For advanced analytics, the full REST API and CSV/JSON export mean you can push data to any BI tool."

### "Is an open-source startup going to be around in 5 years?"
"Being open source is actually our longevity advantage. Even in a worst-case scenario, the code is MIT licensed and permanently available. Your investment is never stranded. That said, we're well funded, growing fast, and the open-source model means our community contributes to the product's development alongside our team."

---

## Demo Preparation Checklist

Before every sales demo:

- [ ] Confirm prospect's current CRM and pain points (from discovery call or CTA form)
- [ ] Prepare a demo environment with realistic data (not empty)
- [ ] Ensure email sync is running and showing recent auto-captured contacts
- [ ] Have at least 3 deals at different health score levels
- [ ] Have at least 2 meeting summaries with follow-up drafts ready
- [ ] Test Cmd+K search with the prospect's industry terms
- [ ] Have one workflow automation configured and ready to show
- [ ] Test screen sharing and network connectivity
- [ ] Review the prospect's website and LinkedIn to personalize examples
- [ ] Prepare pricing comparison specific to their current CRM and team size
