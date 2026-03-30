# AutoAP — Agent Memory & Context File
# This file gives the AI assistant persistent context about the project.
# Reference this in every session: "Read MEMORY.md before helping me."

## What We're Building
AutoAP is an autonomous accounts payable agent for SMBs (10–200 employees).
It monitors an AP inbox, parses invoices with an LLM, navigates QuickBooks via 
TinyFish to run a 3-way PO match, auto-approves clean invoices, flags exceptions,
and presents everything in a real-time dashboard.

Built for the **TinyFish Accelerator** (Demo Day: April 25, 2026).
Solo founder / full-stack build. Ship date target: March 29, 2026.

## Core Value Prop
"The average SMB spends 8 hours/week on AP. AutoAP does it in seconds, 
for any vendor, any portal — no integrations required."

Key differentiator vs Bill.com/Tipalti: TinyFish navigates ANY web UI 
like a human, so no pre-built vendor integrations needed.

## The 8-Step Pipeline
1. AgentMail detects invoice in ap@ inbox → webhook fires
2. Fireworks.ai LLM parses invoice → structured JSON
3. TinyFish logs into QuickBooks sandbox
4. TinyFish searches for matching PO number
5. 3-way match: PO amount vs invoice amount (2% tolerance)
6. MATCH → create bill + schedule payment in QB
   MISMATCH → flag exception + alert via Slack/email
7. All steps logged to AgentOps + Axiom
8. Dashboard updates in real time

## Tech Stack (Final Decisions)
- **Agent:** TinyFish Web Agent API
- **Inbox:** AgentMail (webhook trigger)
- **LLM/Parser:** Fireworks.ai (invoice extraction)
- **ERP target:** QuickBooks Online (Sandbox for dev/demo)
- **Database:** MongoDB Atlas (invoice state, audit log)
- **Observability:** AgentOps (agent tracing) + Axiom (structured logs)
- **Frontend:** Next.js 14 + Tailwind + v0 by Vercel
- **Deployment:** Vercel
- **Billing (future):** Alguna (usage-based, per invoice)

## QuickBooks Sandbox Setup
- Dev account: https://developer.intuit.com/
- Use OAuth 2.0 flow → store tokens in MongoDB `settings` collection
- Sandbox company already has sample POs for demo: PO-4521, PO-4522, PO-4523
- Sandbox base URL: https://sandbox-quickbooks.api.intuit.com/v3/company/{realmId}/

## AgentMail Setup
- Inbox: ap@autoap.dev (configured in AgentMail dashboard)
- Webhook endpoint: POST /api/webhooks/agentmail
- Validate with HMAC-SHA256 header: x-agentmail-signature
- Test by forwarding any invoice PDF to the inbox

## MongoDB Collections
- `invoices` — main pipeline state (see PROJECT_RULES.md for schema)
- `settings` — single doc with all config (id: 'global')
- `agent_sessions` — TinyFish session logs linked to invoice_id

## Known Decisions & Tradeoffs
- Using SSE (not WebSocket) for real-time dashboard — simpler, Next.js native
- Match tolerance: 2% by default, configurable in settings
- Auto-approve max: $10,000 — above this always requires human approval
- No auth layer in MVP — single-tenant, single user for hackathon
- QB payment execution shown in demo but not wired to real bank (sandbox only)

## Demo Script (2-3 min for X post)
1. Open: "SMB founders spend 8hrs/week on AP. Here's AutoAP solving it."
2. Forward a real invoice PDF to ap@autoap.dev on screen
3. Show dashboard — row appears in feed within 2 seconds
4. Agent log starts streaming on right panel (each QB navigation step)
5. Match result appears — green APPROVED badge
6. Cut to QB sandbox — bill is there, payment scheduled
7. Close: "23 seconds. Used to take 25 minutes. #TinyFishAccelerator #BuildInPublic"

## Files in This Project
```
/
├── MEMORY.md              ← this file
├── DESIGN_PROMPT.md       ← UI/UX direction for Antigravity
├── PROJECT_RULES.md       ← coding standards, data models, build order
├── autoap-architecture.svg ← full system diagram
├── app/
│   ├── api/
│   │   ├── webhooks/agentmail/route.ts   ← pipeline entry point
│   │   ├── invoices/route.ts
│   │   ├── invoices/[id]/route.ts
│   │   ├── agent/stream/route.ts         ← SSE endpoint
│   │   └── pipeline/status/route.ts
│   ├── dashboard/page.tsx
│   ├── invoice/[id]/page.tsx
│   └── exceptions/page.tsx
├── lib/
│   ├── tinyfish.ts        ← TinyFish API wrapper
│   ├── fireworks.ts       ← Invoice parser
│   ├── agentmail.ts       ← Webhook validation
│   ├── quickbooks.ts      ← QB OAuth + API calls
│   ├── mongodb.ts         ← DB connection + helpers
│   ├── agentops.ts        ← Step logging wrapper
│   └── axiom.ts           ← Structured logging
├── pipeline/
│   └── invoice.pipeline.ts  ← Main orchestrator (steps 1-8)
└── scripts/
    └── seed.ts            ← Demo data seeder
```

## Session Startup Checklist
When starting a new dev session, always:
1. Check MongoDB connection is live
2. Verify AgentMail webhook is receiving (check Axiom logs)
3. Confirm QB sandbox token is valid (check settings collection)
4. Run `npm run seed` if demo data needs refreshing
5. Check AgentOps dashboard for any failed sessions from last run
