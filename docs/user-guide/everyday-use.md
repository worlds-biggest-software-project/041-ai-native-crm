# Everyday Use Guide

This guide is for the person who has NativeCRM set up and wants to know how to use it day to day. Think of it as the "now what?" guide. We will walk through your daily routine, explain what everything on screen means, and share shortcuts that save real time.

---

## Your Morning Routine with NativeCRM

Here is a simple routine that takes about 5 minutes and sets you up for the day:

1. **Open NativeCRM and check the Dashboard.** Look at your deal metrics. Is anything closing this week? Are there deals that went cold?
2. **Scan the Recent Activities feed.** See who emailed you overnight, which meetings are coming up, and whether any deal stages changed.
3. **Check your AI meeting summaries.** If you had meetings yesterday, their summaries are ready. Read the key points and action items so nothing slips through the cracks.
4. **Glance at your Pipeline Board.** See the visual layout of where every deal stands. Are any stuck in one stage for too long?
5. **Follow up on anything flagged.** If NativeCRM generated follow-up email drafts, review and send them while the context is fresh.

That's it. Five minutes and you know exactly where everything stands.

---

## Checking Your Pipeline

Click **Deals** in the sidebar to open the **Pipeline Board**. This is a visual board -- like a wall of sticky notes -- organized into columns by stage.

[Screenshot: The pipeline board showing deals as cards across stage columns]

### What each column means

| Stage | What it means |
|---|---|
| **Qualification** | You are figuring out if this lead is a real opportunity. |
| **Discovery** | You are learning about their needs and whether your product fits. |
| **Proposal** | You have sent a proposal or are preparing one. |
| **Negotiation** | You are working out pricing, terms, or contracts. |
| **Closed Won** | The deal is done. You got it! |
| **Closed Lost** | The deal did not work out. |

### What the numbers mean

At the top of each column, you will see:

- **Count** -- How many deals are in that stage.
- **Total Value** -- The combined value of all deals in that stage.

At the top of the board, you will see the overall pipeline total -- the sum of all open deals.

### Moving deals between stages

When a deal progresses, just **drag the deal card** from one column to the next. The move saves instantly (NativeCRM uses optimistic updates, so it feels snappy even on slow connections). The activity timeline on that deal will automatically record the stage change.

---

## Reading the Activity Timeline

Every contact, company, and deal has an **Activity Timeline** -- a chronological feed of everything that has happened.

Click on any contact, company, or deal, and you will see the timeline on the right side of the screen (or below the details on mobile).

[Screenshot: An activity timeline showing a mix of emails, meetings, notes, and stage changes]

### Types of activities you will see

| Icon | Activity Type | What it means |
|---|---|---|
| Envelope | **Email (inbound)** | They sent you an email. |
| Paper plane | **Email (outbound)** | You sent them an email. |
| Calendar | **Meeting** | A synced calendar meeting with this person. |
| Phone | **Call** | A logged phone call. |
| Pencil | **Note** | A note someone on your team wrote. |
| Arrow | **Stage Change** | A deal moved from one stage to another. |

### Reading between the lines

The timeline tells a story. When you open a contact before a call, scan the timeline from top to bottom to answer:

- When was the last interaction?
- Was it them reaching out, or us?
- Have meetings been happening regularly, or did things go quiet?
- Are there any action items from the last AI summary that are still outstanding?

This context is what separates a good sales call from a great one.

---

## Using AI Summaries

After every synced meeting, NativeCRM generates an AI summary. You will find it on the **AI Insights** tab of the related contact or deal.

[Screenshot: An AI meeting summary showing key points, action items, sentiment, and topics]

### What is in a summary

- **Key Points** -- The main things discussed, in bullet-point form.
- **Action Items** -- Things that need to happen next, with the person responsible if mentioned.
- **Sentiment** -- An overall read on the tone of the meeting (positive, neutral, cautious, etc.). This is a guide, not gospel -- use your own judgment too.
- **Topics** -- Tags for the subjects covered (e.g., "pricing," "timeline," "technical requirements").

### What to do with summaries

- **Before your next meeting** with the same person, re-read the last summary. It is faster than re-reading your notes.
- **Share with your team.** Summaries are visible to everyone in your workspace. If a colleague is picking up a deal, the summaries give them instant context.
- **Check action items.** If you promised to send a proposal by Friday, the summary will remind you.

### AI Follow-Up Drafts

NativeCRM can also draft follow-up emails based on meeting context. You will see a **Draft Follow-Up** button on meeting summaries. Click it, review the draft, edit anything you want to change, and hit **Send**. The AI writes the first version -- you make it yours.

---

## Deal Scores: What the Numbers Mean

Every deal gets a **health score** from 0 to 100. You will see it as a colored badge on deal cards and detail pages.

| Score Range | Label | Color | What it means |
|---|---|---|---|
| 75 -- 100 | **Hot** | Green | This deal is active and moving. Keep doing what you are doing. |
| 50 -- 74 | **Warm** | Yellow | Things are progressing but could use attention. |
| 25 -- 49 | **Cool** | Orange | Activity is slowing down. Time to re-engage. |
| 0 -- 24 | **Cold** | Red | Very little activity. This deal may be at risk. |

### What goes into the score

The score is calculated from real signals, not guesswork:

- **Email velocity** -- How frequently are emails being exchanged? More is better.
- **Meeting frequency** -- Are meetings happening regularly?
- **Response time** -- How quickly do they reply to you (and you to them)?
- **Stage progression** -- Is the deal moving forward, or stuck?

### What to do about low scores

- **Cool deals (25-49):** Send a check-in email. Suggest a meeting. Reference something specific from your last conversation to show you are paying attention.
- **Cold deals (0-24):** Be honest with yourself -- is this deal still alive? If so, try a different approach (new contact at the company, different value proposition). If not, consider moving it to Closed Lost so your pipeline stays accurate.

---

## Searching for Anything

NativeCRM has a **command palette** -- a universal search bar that finds contacts, companies, and deals instantly.

### How to open it

- **Mac:** Press **Cmd+K**
- **Windows/Linux:** Press **Ctrl+K**

[Screenshot: The command palette open with search results showing contacts, companies, and deals]

### How to use it

1. Press the keyboard shortcut. A search bar appears in the center of the screen.
2. Start typing. Results appear as you type -- no need to press Enter.
3. Results are grouped by type: Contacts, Companies, Deals.
4. Click a result (or use arrow keys and Enter) to jump straight to that record.

This is the single fastest way to navigate NativeCRM. Once you get used to it, you will never browse through lists again.

---

## Creating Notes and Logging Calls

Not everything happens over email. Sometimes you have a phone call or a quick conversation that you want to record.

### Adding a note

1. Open the contact, company, or deal you want to add a note to.
2. In the Activity Timeline section, click **+ Add Note**.
3. Type your note. You can use basic formatting (bold, lists, etc.).
4. Click **Save**.

The note appears in the timeline immediately, visible to your whole team.

### Logging a call

1. Open the relevant contact or deal.
2. Click **+ Log Call** (next to the Add Note button).
3. Fill in:
   - **Duration** -- How long the call lasted.
   - **Direction** -- Inbound or outbound.
   - **Notes** -- What was discussed.
4. Click **Save**.

> **Tip:** Log calls right after they happen. Even a one-sentence note ("Discussed pricing, they want a proposal by Tuesday") is infinitely better than nothing.

---

## Moving Deals Through Stages

There are two ways to move a deal to a new stage:

### Method 1: Drag and Drop (Pipeline Board)

Open the Pipeline Board, find the deal card, and drag it to the new stage column.

### Method 2: From the Deal Detail Page

1. Open the deal.
2. At the top, you will see the current stage displayed as a progress bar or dropdown.
3. Click the next stage to advance the deal, or select any stage from the dropdown.
4. The change saves immediately and is logged in the activity timeline.

[Screenshot: The deal detail page showing the stage progression bar at the top]

---

## Importing Contacts from a Spreadsheet

If you have a list of contacts in a spreadsheet (Excel, Google Sheets, etc.), you can bring them into NativeCRM in bulk.

1. Export your spreadsheet as a **CSV file** (most spreadsheet apps support this under File > Export or Save As).
2. In NativeCRM, go to **Contacts**.
3. Click the **Import** button (usually a small upload icon near the top of the list).
4. Select your CSV file.
5. NativeCRM shows a **column mapping** screen. It will try to automatically match your columns (like "First Name," "Email," "Company") to NativeCRM fields. Review and adjust if needed.
6. Click **Start Import**.
7. You will see a progress bar. When it finishes, your new contacts appear in the list.

### Tips for a smooth import

- Make sure your CSV has a header row (column names in the first row).
- Clean up duplicates in your spreadsheet before importing.
- Email addresses are used to detect duplicates -- if a contact with the same email already exists, NativeCRM will flag it for you.

---

## Keyboard Shortcuts Reference

These shortcuts work anywhere in NativeCRM.

| Shortcut | Action |
|---|---|
| **Cmd+K** / **Ctrl+K** | Open command palette (global search) |
| **N** then **C** | New contact |
| **N** then **D** | New deal |
| **N** then **N** | New note (on current record) |
| **G** then **D** | Go to Dashboard |
| **G** then **P** | Go to Pipeline |
| **G** then **C** | Go to Contacts |
| **G** then **O** | Go to Companies (Organizations) |
| **G** then **S** | Go to Settings |
| **Esc** | Close modal / cancel current action |
| **?** | Show keyboard shortcuts help |

> **Note:** Keyboard shortcuts use a "leader key" pattern. Press the first key, release it, then press the second key within one second.

---

## Tips and Tricks from Power Users

### 1. Use the command palette for everything
Stop clicking through menus. **Cmd+K** is your best friend. Search, navigate, even trigger actions -- all from one place.

### 2. Let the AI do the first draft
When NativeCRM offers a follow-up draft after a meeting, use it. Even if you rewrite 80% of it, starting from something is faster than starting from nothing.

### 3. Trust the deal scores, but verify
If a deal score drops, don't panic -- but do investigate. Open the timeline and see what changed. Maybe you missed a reply, or a meeting got cancelled.

### 4. Log context, not just facts
When adding notes, include the "why" not just the "what." Instead of "Called about contract," write "Called about contract -- they are waiting on legal review, expect answer by Friday. CFO is the final decision maker."

### 5. Keep your pipeline honest
It is tempting to leave dead deals in the pipeline because a bigger number feels better. Resist. Move stale deals to Closed Lost. Your pipeline metrics become much more useful when they reflect reality.

### 6. Check AI summaries even for meetings you attended
You were in the meeting, but did you catch everything? AI summaries often surface details you missed or forgot. They are also a quick way to recall context weeks later.

### 7. Use the activity timeline before every call
Spend 60 seconds reading the timeline before you pick up the phone. You will sound more prepared, and the other person will notice.

### 8. Set up email sync early
The sooner you connect your email, the more history NativeCRM captures. Don't wait until your pipeline is "ready" -- connect on day one.

### 9. Import existing contacts on day one
Don't build your CRM one contact at a time. Dump your existing spreadsheet in via CSV import. You can always clean up later, but starting with data makes the tool immediately useful.

### 10. Review your dashboard every morning
Five minutes in the morning saves an hour of scrambling in the afternoon. Make the dashboard your homepage.
