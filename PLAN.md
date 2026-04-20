# AutoAP — Phase 2 Implementation Plan
# TinyFish Accelerator · Demo Day: April 25, 2026
# Read this file at the start of every session alongside MEMORY.md

---

## Context: What Changed from Phase 1

Phase 1 shipped a working prototype that was accepted into Phase 2. The pipeline
works end-to-end. Phase 2 is about hardening, expanding, and elevating the product
to production-grade quality for Demo Day and investor evaluation.

### What we learned in Phase 1

The pipeline currently runs like this:
1. Email arrives → AgentMail webhook fires
2. Fireworks AI parses raw email text → structured invoice JSON
3. TinyFish navigates the mock vendor portal (ngrok URL) → structured invoice JSON
4. TinyFish attempts QuickBooks UI login → hits CAPTCHA → falls back to direct QB OAuth API
5. QB API does PO match + bill creation + payment scheduling
6. Dashboard updates, exceptions flagged via Slack

### Key architectural facts (do not change these)
- TinyFish is STATELESS. Every call starts from scratch. No persistent sessions.
- Fireworks AI and TinyFish are INDEPENDENT. They do not share data.
- Fireworks reads the email (what the vendor claims).
- TinyFish reads the vendor portal HTML (what the vendor actually recorded).
- TinyFish returns structured JSON internally — raw HTML never passes between services.
- Mock vendor portals are static HTML pages served locally via ngrok. No login required.
- QuickBooks is authenticated via full OAuth 2.0 (access + refresh tokens stored in MongoDB).
- The vendor portal URL is currently a plain .env variable. This must change (see below).

---

## Phase 2 Goals

1. **Fix the QB CAPTCHA issue permanently** — remove TinyFish from QB navigation entirely
2. **Upgrade the pipeline** — run Fireworks and TinyFish in parallel with a reconciliation layer
3. **Expand to multi-vendor portals** — 3 vendor archetypes, each with distinct HTML layouts
4. **Integrate partner tools** — Composio, Axiom (deep), ElevenLabs
5. **Polish the dashboard** — dual-source verification UI, confidence scores, fraud detection feed
6. **Harden for Demo Day** — reliable seed data, no fragile steps, clean exception UX

---

## Pipeline Architecture: Phase 2

Replace the current sequential pipeline with this parallel dual-source architecture:

```
EMAIL ARRIVES (AgentMail webhook)
        ↓
  Quick PO hint extraction (cheap regex/LLM on email subject + body)
        ↓
  ┌─────────────────────────────────────┐
  │         PARALLEL EXECUTION          │
  │                                     │
  │  Fireworks AI        TinyFish       │
  │  (parse email)       (scrape portal)│
  │       ↓                   ↓         │
  │  ParsedInvoice       ParsedInvoice  │
  └──────────┬────────────────┬─────────┘
             ↓                ↓
      RECONCILIATION ENGINE
      · Field-by-field diff
      · Confidence scoring (0-100)
      · Discrepancy flagging
             ↓
     ┌───────┴────────┐
     ↓                ↓
  VERIFIED         DISCREPANCY
  score ≥ 95       score < 95
     ↓                ↓
  QB API flow      Flag + Alert
  (no TinyFish)    (Composio → Slack)
  PO match
  Bill creation
  Payment schedule
```

### Pipeline status values (update MongoDB schema)
`RECEIVED` → `EXTRACTING` → `RECONCILING` → `APPROVED` | `EXCEPTION` | `PENDING_REVIEW`

---

## Task 1: Remove TinyFish from QuickBooks (Fix CAPTCHA permanently)

**Problem:** TinyFish attempts QB UI login → CAPTCHA → fallback to OAuth API.
This is wasted latency and a fragile demo step. QB is fully OAuth-wired already.

**Solution:** Delete the TinyFish QB navigation step entirely. QB API is the only path.

### Changes required

**File: `lib/quickbooks.ts`** — Add auto token refresh logic

The current QB service must auto-refresh the access token before it expires.
Store `qb_token_expires_at` in the MongoDB settings collection alongside the tokens.
Before every API call, check if `Date.now() > expires_at - 5min`. If so, call the
QB refresh endpoint and persist the new tokens back to MongoDB.

Token refresh endpoint:
```
POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
Body: grant_type=refresh_token&refresh_token={token}
Headers: Authorization: Basic base64(clientId:clientSecret)
```

The three QB operations to implement cleanly (all via REST API, no TinyFish):

```
// Find PO
GET /v3/company/{realmId}/query
  ?query=SELECT * FROM PurchaseOrder WHERE DocNumber = '{po_number}'

// Create Bill  
POST /v3/company/{realmId}/bill
  Body: { VendorRef, DueDate, TotalAmt, Line[] }

// Schedule Payment
POST /v3/company/{realmId}/billpayment
  Body: { VendorRef, PayType: 'Check', TotalAmt, TxnDate, Line[{ LinkedTxn }] }
```

**File: `pipeline/invoice.pipeline.ts`** — Remove the TinyFish QB step block entirely.
The pipeline should never attempt browser navigation for QB again.

**Verification:** Run the full pipeline. Confirm zero TinyFish calls are made after
the vendor portal scrape step. QB bill should appear in sandbox without any CAPTCHA path.

---

## Task 2: Build the Reconciliation Engine

**New file: `lib/reconciliation.ts`**

This is the new centerpiece of the pipeline. It takes two `ParsedInvoice` objects
(one from Fireworks, one from TinyFish) and produces a `ReconciliationResult`.

### Types

```typescript
interface ReconciliationResult {
  status: 'VERIFIED' | 'DISCREPANCY' | 'PARTIAL';
  confidence_score: number;        // 0-100
  matched_fields: string[];
  discrepancies: Discrepancy[];
  recommendation: 'AUTO_APPROVE' | 'HUMAN_REVIEW' | 'REJECT';
  reconciled_at: Date;
}

interface Discrepancy {
  field: string;
  email_value: string | number;
  portal_value: string | number;
  delta?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  flag_type: 'AMOUNT_MISMATCH' | 'VENDOR_MISMATCH' | 'LINE_ITEM_FRAUD' | 'DATE_MISMATCH' | 'PO_MISMATCH';
}
```

### Reconciliation logic

Check these fields in order, with these weights:

| Field | Weight | Match method |
|-------|--------|-------------|
| total_amount | 40pts | numeric, 2% tolerance |
| po_number | 25pts | exact string match (trimmed) |
| vendor_name | 20pts | fuzzy match, threshold 0.8 |
| line_items | 15pts | count match + per-item amount check |

`confidence_score = 100 - sum(weights of failed fields)`

Recommendation thresholds:
- score ≥ 95 → `AUTO_APPROVE`
- score 70–94 → `HUMAN_REVIEW`
- score < 70 → `REJECT`

For vendor_name fuzzy matching, implement Levenshtein distance normalized to 0–1.
Do not use any external fuzzy-match library — implement it inline, it's ~15 lines.

### MongoDB: add reconciliation fields to invoices collection

```typescript
// Add to invoice document
fireworks_data: ParsedInvoice,     // raw output from Fireworks step
tinyfish_data: ParsedInvoice,      // raw output from TinyFish step
reconciliation: ReconciliationResult,
vendor_id: string,                 // FK to vendors collection (see Task 3)
```

---

## Task 3: Multi-Vendor Portal Architecture

### 3a. Create MongoDB vendors collection

Move vendor portal config OUT of .env and INTO MongoDB.
This makes the system configurable without redeploys and looks production-grade.

```typescript
// vendors collection schema
{
  _id: ObjectId,
  vendor_id: string,           // e.g. 'amazon-business'
  vendor_name: string,         // e.g. 'Amazon Business'
  vendor_type: 'PLATFORM' | 'SAAS' | 'UTILITY',
  portal_url: string,          // ngrok URL for mock portal
  logo_url: string,            // path to logo SVG in /public/logos/
  navigation_hint: string,     // hint for TinyFish task description
  active: boolean,
  created_at: Date,
}
```

Seed with 3 vendors:
- `amazon-business` · PLATFORM · logo: amazon.svg
- `saas-billing` · SAAS · logo: saas.svg  
- `utility-portal` · UTILITY · logo: utility.svg

### 3b. Build 3 mock vendor portals (static HTML)

Create `/mock-portals/` directory with 3 subdirectories.
Each portal must have a meaningfully DIFFERENT HTML layout so TinyFish
demonstrates it can navigate varied UIs — not just one template repeated.

**Portal 1: `/mock-portals/amazon-business/index.html`**
- Layout: table-based search results, prominent search bar at top
- Has 3+ line items per invoice
- Search field labeled "Search by PO Number"
- Results show in a `<table>` with columns: Item, Qty, Unit Price, Total

**Portal 2: `/mock-portals/saas-billing/index.html`**
- Layout: card-based, modern SaaS aesthetic
- Single recurring line item (subscription)
- Search field labeled "Find Invoice"
- Results rendered as a styled card with subscription period shown

**Portal 3: `/mock-portals/utility-portal/index.html`**
- Layout: dated, form-heavy, classic enterprise portal (ugly on purpose)
- Line items: base charge + taxes + fees
- Search field labeled "Account / PO Lookup"
- Results in a definition list `<dl>` format

Each portal must have PO numbers matching the seed data:
- PO-4521 → amazon-business
- PO-4522 → saas-billing  
- PO-4523 → utility-portal

### 3c. Update TinyFish scraper for multi-vendor

**File: `lib/tinyfish.ts`** — Update `scrapeVendorPortal()` to accept vendor context.

TinyFish is stateless, so every task description must be fully self-contained.
Pull the vendor's `navigation_hint` from MongoDB and inject it into the task prompt.

Task description template:
```
You are navigating the {vendor_name} vendor portal at {portal_url}.
{navigation_hint}

Your goal: Find and extract the invoice for Purchase Order number "{po_number}".

Steps:
1. Navigate to {portal_url}
2. Locate the search input and enter "{po_number}"
3. Submit the search and wait for results
4. Extract ALL of these fields from the results:
   - invoice_number, vendor_name, invoice_date, due_date
   - total_amount (as a number, no currency symbols)
   - po_number
   - line_items: array of { description, quantity, unit_price, total }
5. Return extracted data as JSON only. No explanation.

If invoice not found: return { "error": "Invoice not found for PO {po_number}" }
```

---

## Task 4: Parallel Pipeline Execution

**File: `pipeline/invoice.pipeline.ts`** — Full rewrite of extraction phase.

Replace the current sequential Fireworks → TinyFish calls with `Promise.allSettled`.

```typescript
// Parallel extraction pattern
const [emailResult, portalResult] = await Promise.allSettled([
  parseWithFireworks(invoice.raw_email),
  scrapeVendorPortal({
    portalUrl: vendor.portal_url,
    poNumber: invoice.po_number_hint,
    vendorName: vendor.vendor_name,
    navigationHint: vendor.navigation_hint,
    invoiceId,
  }),
]);

// Handle partial failures
if (emailResult.status === 'rejected') {
  return flagException(invoiceId, 'FIREWORKS_FAILED', emailResult.reason);
}
if (portalResult.status === 'rejected') {
  return flagException(invoiceId, 'PORTAL_SCRAPE_FAILED', portalResult.reason);
}

// Reconcile
const reconciliation = reconcile(emailResult.value, portalResult.value);
```

The `po_number_hint` is a cheap pre-extraction step: scan the raw email
subject + first 200 chars of body with a simple regex for patterns like
`PO-\d+` or `PO #\d+`. This gives TinyFish enough to navigate before
Fireworks has finished its full parse. Run this synchronously before
spawning the parallel calls.

---

## Task 5: Partner Tool Integrations

### 5a. Composio — Replace custom Slack/alert code

Install: `npm install composio-core`

**New file: `lib/composio.ts`**

Replace any existing Slack webhook code with Composio actions.
Implement these two functions:

`sendExceptionAlert(invoice, reconciliation)` — Posts to Slack with:
- Vendor name, invoice number, amount
- Discrepancy type and delta
- Confidence score
- Direct link to `/exceptions/{invoiceId}` in the dashboard

`logApprovalToNotion(invoice)` — Creates a page in a Notion database with:
- Invoice #, Vendor, Amount, Status: Approved, Processed At timestamp

Environment variables needed:
```
COMPOSIO_API_KEY=
SLACK_CHANNEL_ID=
NOTION_DB_ID=
```

### 5b. Axiom — Deep structured event logging

**File: `lib/axiom.ts`** — Replace any existing basic logging with structured events.

Every pipeline stage must emit a named event to Axiom with consistent fields:

```typescript
// Event schema — all events must include these base fields
{
  event: string,          // e.g. 'invoice.received', 'portal.scraped'
  invoiceId: string,
  timestamp: string,      // ISO 8601
  duration_ms?: number,   // for timed operations
  success: boolean,
  vendor_id?: string,
  error?: string,
}

// Required events — implement all of these:
'invoice.received'         // AgentMail webhook hit
'extraction.started'       // parallel extraction begins
'fireworks.completed'      // Fireworks parse done, include duration_ms
'portal.scraped'           // TinyFish scrape done, include duration_ms + vendor_id
'reconciliation.completed' // include confidence_score + recommendation
'qb.bill_created'          // include qb_bill_id + amount
'qb.payment_scheduled'     // include payment_date
'exception.flagged'        // include flag_type + severity
'pipeline.completed'       // include total_duration_ms
```

**Dashboard metrics panel** — Add a `/metrics` section or collapsible panel to the
dashboard that queries Axiom and displays:
- Average pipeline duration (last 7 days)
- Match rate % (VERIFIED vs DISCREPANCY)
- Exceptions by vendor
- Invoices processed per day (sparkline)
- Average confidence score

Use the Axiom REST API to query these: `POST https://api.axiom.co/v1/datasets/{dataset}/query`

### 5c. ElevenLabs — Daily voice summary

**New file: `lib/elevenlabs.ts`**

One function: `generateDailySummary(stats: DailyStats): Promise<Buffer>`

The function generates an audio summary of the day's AP activity.
Script template:
```
Good morning. AutoAP processed {count} invoices yesterday across 
{vendor_count} vendors, totalling {amount}. 
{if exceptions > 0: "{n} invoice(s) require your attention."}
{if exceptions === 0: "All invoices were automatically approved."}
Estimated time saved: {minutes} minutes.
```

Use voice ID `21m00Tcm4TlvDq8ikWAM` (Rachel — neutral, professional).
Model: `eleven_monolingual_v1`.

Wire this to a daily cron job (Vercel cron, runs at 8am) that:
1. Queries MongoDB for yesterday's invoice stats
2. Calls `generateDailySummary()`
3. Stores the audio buffer and makes it playable from the dashboard header

Environment variables needed:
```
ELEVENLABS_API_KEY=
```

---

## Task 6: Dashboard UI Upgrades

These changes are specific to Phase 2. Do not redesign the existing dashboard —
add these components to the current layout.

### 6a. Dual-source verification column in invoice feed

Each invoice row in the feed must show a new "Verification" column:
- If `reconciliation.status === 'VERIFIED'`: green checkmark + "Dual Verified"
- If `reconciliation.status === 'PARTIAL'`: amber warning + "Partial Match"  
- If `reconciliation.status === 'DISCREPANCY'`: red X + flag_type label

On row expand, show a side-by-side comparison panel:
```
           Fireworks AI (email)    TinyFish (portal)
Amount:    $1,240.00 ✓            $1,240.00 ✓
PO:        PO-4521   ✓            PO-4521   ✓
Vendor:    Acme Corp ✓            Acme Corp ✓
```
Use green text for matching fields, red for mismatches.

### 6b. Confidence score badge

Add a `{score}% confidence` pill badge to each approved invoice card.
Color scale: ≥95 green · 70–94 amber · <70 red.

### 6c. Fraud detection tab

Add a "Flagged" tab to the invoice feed (alongside All / Approved / Exceptions).
Shows only invoices where Fireworks and TinyFish disagreed.
Each card shows the specific discrepancy: what the email said vs what the portal said.
This tab should always have at least one entry in demo data (see seed script below).

### 6d. Vendor logo column

Add vendor logo to each invoice row. Pull `logo_url` from the vendors collection.
Store SVG logos in `/public/logos/`. If no logo found, show vendor initials in a
colored circle (deterministic color from vendor_id hash).

### 6e. "Time saved" metric

On the KPI strip, add a "Time Saved Today" card.
Calculate as: `invoices_processed_today × 25 minutes` (industry benchmark).
Display as hours + minutes. e.g. "3h 45m saved today".

---

## Task 7: Seed Script Update

**File: `scripts/seed.ts`** — Full replacement of existing seed data.

Seed exactly these 5 invoices to cover all demo scenarios:

```typescript
const DEMO_INVOICES = [
  {
    // Happy path — large platform vendor
    vendor_id: 'amazon-business',
    invoice_number: 'AMZ-2025-00441',
    po_number: 'PO-4521',
    amount: 1240.00,
    reconciliation_status: 'VERIFIED',
    confidence_score: 98,
    pipeline_status: 'APPROVED',
  },
  {
    // Happy path — SaaS vendor
    vendor_id: 'saas-billing',
    invoice_number: 'SB-2025-8821',
    po_number: 'PO-4522',
    amount: 890.00,
    reconciliation_status: 'VERIFIED',
    confidence_score: 100,
    pipeline_status: 'APPROVED',
  },
  {
    // FRAUD DEMO — amount in email differs from portal (key demo moment)
    vendor_id: 'amazon-business',
    invoice_number: 'AMZ-2025-00389',
    po_number: 'PO-4519',
    fireworks_amount: 1500.00,  // what the vendor email claimed
    tinyfish_amount: 1240.00,   // what the portal actually shows
    amount: 1500.00,
    reconciliation_status: 'DISCREPANCY',
    confidence_score: 60,
    pipeline_status: 'EXCEPTION',
    flag_type: 'AMOUNT_MISMATCH',
    discrepancy_delta: 260.00,
  },
  {
    // Pending review — partial match
    vendor_id: 'utility-portal',
    invoice_number: 'UTIL-2025-112',
    po_number: 'PO-4523',
    amount: 3500.00,
    reconciliation_status: 'PARTIAL',
    confidence_score: 82,
    pipeline_status: 'PENDING_REVIEW',
  },
  {
    // Exception — portal scrape failed (tests error path)
    vendor_id: 'saas-billing',
    invoice_number: 'SB-2025-9001',
    po_number: 'PO-4525',
    amount: 450.00,
    reconciliation_status: null,
    confidence_score: null,
    pipeline_status: 'EXCEPTION',
    flag_type: 'PORTAL_SCRAPE_FAILED',
  },
]
```

---

## Updated Environment Variables

Add these to `.env.local` (all are new for Phase 2):

```bash
# Phase 2 additions — these did not exist in Phase 1

# Composio
COMPOSIO_API_KEY=
SLACK_CHANNEL_ID=
NOTION_DB_ID=

# ElevenLabs
ELEVENLABS_API_KEY=

# Axiom (may already exist — confirm dataset name)
AXIOM_API_TOKEN=
AXIOM_DATASET=autoap-prod

# Vendor portals (replace single VENDOR_PORTAL_URL)
# These are now in MongoDB vendors collection — remove the old .env variable
# VENDOR_PORTAL_URL=   ← DELETE THIS
```

---

## Updated File Structure

Files that are NEW in Phase 2 (create these):
```
lib/
  reconciliation.ts      ← NEW: dual-source reconciliation engine
  composio.ts            ← NEW: Slack + Notion via Composio
  elevenlabs.ts          ← NEW: daily voice summary

mock-portals/
  amazon-business/
    index.html           ← NEW: platform archetype portal
  saas-billing/
    index.html           ← NEW: SaaS archetype portal
  utility-portal/
    index.html           ← NEW: utility archetype portal

public/logos/
  amazon.svg             ← NEW
  saas.svg               ← NEW
  utility.svg            ← NEW

app/
  metrics/
    page.tsx             ← NEW: Axiom metrics panel
```

Files that are MODIFIED in Phase 2 (edit these, do not recreate):
```
lib/
  tinyfish.ts            ← Update scrapeVendorPortal() for multi-vendor + vendor context
  quickbooks.ts          ← Add auto token refresh + remove any TinyFish QB calls
  axiom.ts               ← Replace with structured event logging (see Task 5b)

pipeline/
  invoice.pipeline.ts    ← Full rewrite: parallel execution + reconciliation step

app/
  dashboard/page.tsx     ← Add verification column, confidence badge, fraud tab, vendor logos
  exceptions/page.tsx    ← Upgrade exception cards with discrepancy detail

scripts/
  seed.ts                ← Replace with 5-invoice demo dataset (see Task 7)
```

---

## Build Order (execute in this sequence)

```
[ ] Task 1 — Remove TinyFish from QB, wire auto token refresh
    Verify: full pipeline runs, QB bill created, zero CAPTCHA surface

[ ] Task 3a — Create MongoDB vendors collection, seed 3 vendors
    Verify: vendors collection has 3 docs with correct portal URLs

[ ] Task 3b — Build 3 mock portal HTML files
    Verify: each portal served locally, TinyFish can scrape PO data from each

[ ] Task 3c — Update tinyfish.ts for multi-vendor
    Verify: scrapeVendorPortal() works against all 3 portals

[ ] Task 2 — Build reconciliation.ts
    Verify: reconcile() returns correct result for match, mismatch, and partial cases
    Test with: { email: $1240, portal: $1240 } → VERIFIED 98
    Test with: { email: $1500, portal: $1240 } → DISCREPANCY 60
    Test with: { email: $1240, portal: $1240, vendor_name_slight_diff } → PARTIAL 80

[ ] Task 4 — Rewrite pipeline with parallel execution + reconciliation
    Verify: both extractions run simultaneously, reconciliation result stored in MongoDB

[ ] Task 5a — Composio (Slack + Notion)
    Verify: exception triggers Slack message, approval logs to Notion

[ ] Task 5b — Axiom structured logging
    Verify: all 9 event types appear in Axiom dataset after one pipeline run

[ ] Task 5c — ElevenLabs daily summary
    Verify: audio file generated, playable from dashboard

[ ] Task 7 — Update seed script
    Verify: 5 demo invoices cover all pipeline states including the fraud case

[ ] Task 6 — Dashboard UI upgrades
    Verify: dual-source panel visible, confidence badges on all invoices,
            fraud tab shows the $260 discrepancy invoice, vendor logos render

[ ] Final: full end-to-end run across all 3 vendor portals
    Time the pipeline — target under 30 seconds total
    Record dry-run demo, check for any lag or failure points
```

---

## Demo Day Readiness Checklist

Before Demo Day (April 25), confirm all of these:

```
[ ] QB sandbox OAuth token is valid (check qb_token_expires_at in MongoDB settings)
[ ] All 3 ngrok tunnels are running and URLs match vendors collection in MongoDB
[ ] Seed script run fresh: npm run seed
[ ] Axiom dataset has data (run one pipeline cycle before demo)
[ ] Composio Slack alert fires correctly on exception
[ ] ElevenLabs daily summary audio plays from dashboard
[ ] Fraud detection demo invoice (AMZ-2025-00389) visible in Flagged tab
[ ] AgentOps dashboard accessible — link visible in app header
[ ] Pipeline runs end-to-end in under 30 seconds
[ ] No console errors in browser during dashboard load
[ ] Demo screen resolution set — dashboard fits without scroll on 1080p
```

---

## Key Narrative for Demo Day

This is the framing to keep in mind as you build. Every feature should support this story:

> "AutoAP doesn't just automate AP — it verifies it. Two independent AI systems
> check every invoice: one reads what the vendor emailed you, one reads what the
> vendor actually recorded on their portal. If they disagree, we flag it before
> you pay. That's not automation — that's a fraud layer that no existing AP tool
> has. And it works on any vendor portal, with no pre-built integrations."

The dual-source reconciliation engine is the product differentiator.
Every UI element, every demo step, every partner integration should make
that story more visible and more credible.

---

## Phase 3: Final Deadline Sprint & Demo Preparation

With the robust core infrastructure, integrations, and discrepancy logic complete, we focus our final day entirely on the presentation layer to ensure a flawless demo.

### 1. Database Cleanup & Test Data Purge
- Create a script (`scripts/cleanup-db.ts`) to erase all diagnostic and broken terminal-testing data from the `invoices` MongoDB collection.
- Purge diagnostic webhooks from the local history to keep the UI completely pristine.
- Optional: Implement a "Reset Demo State" button in the admin interface for rapid staging.

### 2. E2E Pipeline Verification
- Mock 3 distinctly different invoice test-fixtures:
  1. **Perfect Match (The Happy Path)**: Same data on email and vendor portal. Triggers QuickBooks bill scheduling natively.
  2. **Amount Discrepancy (The Tax Trap)**: Standard line mismatch scenario (e.g. shipping/tax excluded on PDF invoice). Flags correctly.
  3. **High-Severity Fraud/Mismatch (The Differentiator)**: The core demo highlight where TinyFish completely catches a doctored PO or malicious line item. Triggers Notion log + Slack Exception alert seamlessly.
- Verify pipeline propagates fully for all 3 fixtures under 30 seconds for live demo pacing.

### 3. Demo Scripting
- Create a `demo_script.md` containing the step-by-step narrative timing:
  1. *Introduction* (The AutoAP concept vs standard AP).
  2. *Trigger* the Fraud email webhook live.
  3. *Transition* to dashboard to watch the streaming iframe verification.
  4. *Reveal* the Reconciler mismatch flag.
  5. *Highlight* the Composio alerts simultaneously pinging Slack and Notion.

### 4. Code Freeze & Readiness Review
- Do an architecture-wide check of all API keys (QuickBooks OAuth expiry, TinyFish token limits).
- Confirm all styling and components (Tailwind dashboard, headers) fit seamlessly on standard 1080p demo layout without erratic scrolling.
- Re-run `npm run lint` and verify production building natively.
