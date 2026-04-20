# AutoAP — Demo Day Video Script
# TinyFish Accelerator Final Submission
# Target: 3 minutes | Format: Screen recording + voiceover

---

## PRE-RECORDING CHECKLIST

Before hitting record, confirm ALL of these:

- [x] ElevenLabs voice summary endpoint (`/api/voice-summary`) implemented and functional
- [x] Reconciliation engine (`lib/reconciliation.ts`) implemented with confidence scoring
- [x] Parallel pipeline execution (Fireworks ∥ TinyFish) wired in `pipeline/invoice.pipeline.ts`
- [x] TinyFish SSE streaming + Live iframe overlay working on dashboard
- [x] Composio Slack + Notion alerting wired for exceptions
- [x] Axiom structured event logging across all pipeline stages
- [x] Demo reset endpoint (`/api/demo/reset`) does full wipe + 5-invoice re-seed
- [x] `npm run lint` passes clean (0 errors, 0 warnings)
- [ ] QB sandbox OAuth token valid (check MongoDB settings → `qb_token_expires_at`)
- [ ] ngrok tunnel running, URL matches `VENDOR_PORTAL_URL` in `.env`
- [ ] Run demo reset: `curl -X POST http://localhost:3000/api/demo/reset`
- [ ] Dashboard open in browser at `http://localhost:3000/dashboard`
- [ ] Agent Activity panel visible on right side of dashboard
- [ ] Flagged tab shows "2 flagged" (the fraud + portal-scrape-failed invoices)
- [ ] Screen resolution: 1920×1080, browser zoom: 100%
- [ ] Close all other tabs, notifications, and Slack

---

## DEMO OVERVIEW

Two live scenarios, back-to-back:

| # | Scenario | What It Shows | Trigger |
|---|----------|---------------|---------|
| 1 | **Multi-Vendor Portal Verification** | TinyFish navigates Amazon portal live, dual-source match → auto-approval | Send email from iCloud |
| 2 | **Fraud Detection** | Email claims $1,500 but portal shows $1,240 → $260 discrepancy flagged | Send email from iCloud |

---

## RECORDING STRUCTURE

Total time: ~3:00
- Problem + Market (0:00–0:40) — 40 seconds
- Product intro (0:40–0:55) — 15 seconds
- 🔴 LIVE: Scenario 1 — Portal Verification (0:55–1:50) — 55 seconds
- 🔴 LIVE: Scenario 2 — Fraud Catch (1:50–2:35) — 45 seconds
- TinyFish + Founder Close (2:35–3:00) — 25 seconds

---

## EMAIL TEMPLATES TO SEND FROM iPHONE/iCLOUD

Copy these into separate draft emails in your iCloud Mail app BEFORE recording.
Send each one to: **ap@autoap.dev** (or your AgentMail inbox address)

### 📧 Email 1: Happy Path — Amazon Business (Multi-Vendor Portal Verification)

```
To: autoap@agentmail.to
From: (your iCloud email)
Subject: Invoice #AMZ-2026-00512 from Amazon Business

Hi AP Team,

Please find below our latest invoice details:

Invoice Number: AMZ-2026-00512
Vendor: Amazon Business
Date: April 19, 2026
Due Date: May 19, 2026
Purchase Order: PO-4521

Items:
- Standing Desk — Electric, 60" (x2): $498.00
- Monitor Arm — Dual, Gas Spring (x4): $358.00
- Cable Management Kit (x4): $98.00
- Ergonomic Keyboard Tray (x2): $286.00

Subtotal: $1,240.00
Tax: $0.00
Total Due: $1,240.00

Payment Terms: Net 30
Please remit payment by the due date.

Thank you,
Amazon Business Billing
```

### 📧 Email 2: Fraud Case — Doctored Amazon Invoice ($260 Discrepancy)

```
To: autoap@agentmail.to
From: (your iCloud email)
Subject: URGENT - Invoice #AMZ-2026-00513 from Amazon Business

Hi,

Attached is our updated invoice for recent office furniture order.

Invoice Number: AMZ-2026-00513
Vendor: Amazon Business
Date: April 18, 2026
Due Date: April 25, 2026
Purchase Order: PO-4521

Items:
- Executive Standing Desk Package (x2): $750.00
- Premium Monitor Arms + Cable Kit (x4): $750.00

Total Amount Due: $1,500.00

This invoice supersedes any previous versions. Please process urgently.

Best regards,
Amazon Business Accounts
```

> **Why this works:** Email 2 claims $1,500 for PO-4521, but the vendor portal
> (which has the real data) shows $1,240 for that same PO. The reconciliation
> engine will flag a $260 AMOUNT_MISMATCH discrepancy — the core "wow moment."

---

## FULL SCRIPT

---

### [0:00–0:40] THE PROBLEM + MARKET
*Screen: Black slide or a single stat. Voice only.*

"Every small business in America has an accounts payable problem.

Invoices arrive by email. Someone opens them, cross-checks them against
purchase orders, logs into QuickBooks, creates a bill, schedules a payment.
The average SMB finance manager spends eight hours a week on this.
That's a full working day — every single week — on work that produces no value.

And when they miss a discrepancy, it costs real money. AP fraud costs
US businesses over $300 billion a year.

The AP automation market is $3.8 billion today, growing to $7.5 billion by 2030.
But existing tools — Bill.com, Tipalti — require pre-built integrations
with specific vendors. If a vendor doesn't have an API, those tools can't
reach them. That's the gap. That's where AutoAP lives."

---

### [0:40–0:55] PRODUCT INTRO
*Screen: AutoAP dashboard loads — show full command center view with 5 seeded invoices*

"This is AutoAP. An autonomous AP agent that processes invoices end-to-end —
from email received to payment scheduled — with zero human involvement for
clean matches. Let me show you how it works live."

---

### [0:55–1:50] 🔴 LIVE SCENARIO 1 — MULTI-VENDOR PORTAL VERIFICATION
*Screen: Switch to your phone/email client, show sending Email 1*

"I'm forwarding an invoice from Amazon Business to the AutoAP inbox
right now — from my personal email."

*[Send Email 1 — show the send action on screen]*

"Watch the dashboard."

*[Switch to dashboard — new invoice row flashes in with cyan highlight animation]*

"Invoice received. The pipeline starts automatically.

Two things happen simultaneously — and this is what makes AutoAP different
from every other AP tool on the market.

Fireworks AI reads the email — pulling vendor name, amount, line items, PO number.
At the exact same time, TinyFish — the web navigation engine built by TinyFish AI —
opens the Amazon Business vendor portal and independently extracts its own
structured data directly from the vendor's system of record."

*[Point to Agent Activity panel on the right — TinyFish navigation steps streaming live]*
*[Live iframe overlay slides in showing TinyFish navigating the portal]*

"You can see TinyFish working in real time. It's navigating the vendor portal
exactly like a human would — finding the PO search field, entering the number,
reading the results. No API. No integration. Just visual navigation."

*[Match result appears — green VERIFIED badge, high confidence score]*

"Both sources agreed. $1,240 from the email. $1,240 from the portal.
100% confidence. AutoAP creates the bill in QuickBooks and schedules the payment
automatically.

Total time: about 25 seconds. That used to take 25 minutes."

*[PAUSE — let this land for 2 full seconds before continuing]*

---

### [1:50–2:35] 🔴 LIVE SCENARIO 2 — THE FRAUD CATCH
*Screen: Still on the dashboard*

"But here's what really matters. What happens when the numbers don't match?"

*[Send Email 2 from your phone — the doctored $1,500 invoice]*

"I just sent a second invoice. Same vendor, same PO number —
but this one claims $1,500 instead of $1,240. A $260 difference.
Maybe the email was intercepted. Maybe someone edited the PDF.
Let's see what happens."

*[Watch the dashboard — new row appears, pipeline runs]*
*[TinyFish navigates portal again, extracts $1,240]*

"Look — Fireworks reads the email and sees $1,500.
TinyFish reads the vendor portal and sees $1,240.

AutoAP's reconciliation engine catches the $260 discrepancy instantly."

*[EXCEPTION badge appears — red, with discrepancy details]*
*[Navigate to the Flagged tab or click the invoice to show the dual-source comparison]*

"The payment is frozen. A Slack alert fires to the finance channel.
The audit trail is logged to Notion automatically.

No existing AP automation tool does this — because they only read the email.
They have no independent verification source. AutoAP has two.

That's not just automation. That's a fraud detection layer that no competitor has."

---

### [2:35–3:00] TINYFISH IS THE ARCHITECTURE + FOUNDER CLOSE
*Screen: Dashboard showing both processed invoices — one green, one red*

"TinyFish is the reason AutoAP can do this across any vendor — not just
the ones with APIs. It navigates any portal, any layout, returning structured
JSON. Remove TinyFish, and the dual-source verification disappears entirely.
The fraud layer is gone. TinyFish isn't a feature — it's the architecture.

I'm Olasile Abolade. I spent a decade as a product leader at AWS and Adobe
building infrastructure at scale. AutoAP is live. The pipeline runs end-to-end.

I'm looking to partner with TinyFish and Mango Capital to bring this to
the first ten paying SMB customers.

Thank you."

---

## RECORDING NOTES

**Pacing:** Speak slower than feels natural. Judges watch on a screen.
Key terms — "dual-source", "fraud detection", "TinyFish is the architecture" —
pause half a beat before saying them.

**The money moment:** "Total time: about 25 seconds" — PAUSE here.
Let it land before moving to the fraud section.

**Do NOT rush the fraud catch.** This is the highest-scoring moment.
Let the EXCEPTION badge and discrepancy details be visible for 3+ seconds.

**If anything glitches:** Don't stop recording. Narrate what should be
happening ("TinyFish is navigating the portal — you can see it reading
the fields here"), then cut that segment in post.

**Pre-send emails:** Draft both emails in your Mail app BEFORE hitting
record. You should only need to tap "Send" during the demo.

**Cut points (if editing needed):**
- Cut 1: After "Total time: about 25 seconds" — clean pause
- Cut 2: After "That's a fraud detection layer" — before founder close

---

## QUICK REFERENCE: CURL TRIGGERS (BACKUP)

If the email pipeline isn't triggering fast enough, use these curl commands
as a backup to fire the webhook directly:

### Scenario 1: Happy Path
```bash
curl -X POST http://localhost:3000/api/webhooks/agentmail \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "billing@amazon.com",
    "to": "autoap@agentmail.to",
    "subject": "Invoice #AMZ-2026-00512 from Amazon Business",
    "text": "Invoice Number: AMZ-2026-00512\nVendor: Amazon Business\nDate: April 19, 2026\nDue Date: May 19, 2026\nPurchase Order: PO-4521\n\nItems:\n- Standing Desk Electric 60in (x2): $498.00\n- Monitor Arm Dual Gas Spring (x4): $358.00\n- Cable Management Kit (x4): $98.00\n- Ergonomic Keyboard Tray (x2): $286.00\n\nTotal Due: $1,240.00"
  }'
```

### Scenario 2: Fraud ($260 Discrepancy)
```bash
curl -X POST http://localhost:3000/api/webhooks/agentmail \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "billing@amazon.com",
    "to": "autoap@agentmail.to",
    "subject": "URGENT - Invoice #AMZ-2026-00513 from Amazon Business",
    "text": "Invoice Number: AMZ-2026-00513\nVendor: Amazon Business\nDate: April 18, 2026\nDue Date: April 25, 2026\nPurchase Order: PO-4521\n\nItems:\n- Executive Standing Desk Package (x2): $750.00\n- Premium Monitor Arms + Cable Kit (x4): $750.00\n\nTotal Amount Due: $1,500.00\n\nThis invoice supersedes any previous versions. Please process urgently."
  }'
```

### Reset Dashboard (run between takes)
```bash
curl -X POST http://localhost:3000/api/demo/reset
```
