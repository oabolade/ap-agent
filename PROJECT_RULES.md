# AutoAP — Project Rules
# Place this file at: .cursor/rules OR antigravity.rules.md

## 🧠 Project Context

You are building **AutoAP** — an autonomous accounts payable agent for SMBs.
The agent uses TinyFish Web Agent API to navigate websites, Fireworks.ai to parse
invoices, AgentMail to monitor inboxes, and MongoDB to store all state.
This is a TinyFish Accelerator submission. Every feature decision should optimize
for demo impact AND real business value for founders with 10–200 employees.

---

## 🏗️ Architecture Rules

### Agent Orchestration
- The main pipeline is triggered by AgentMail webhook → Express/Next.js API route
- Each invoice goes through exactly these stages in order:
  `RECEIVED → PARSING → MATCHING → DECISION → COMPLETED | EXCEPTION`
- Store pipeline state in MongoDB `invoices` collection with a `status` field
- Never skip stages. If a stage fails, set status to `EXCEPTION` with error detail
- All agent actions must be logged to AgentOps with step name + metadata

### TinyFish Integration
- Use TinyFish Web Agent API for ALL browser navigation (QuickBooks, vendor portals)
- Never use Puppeteer/Playwright directly — TinyFish handles the browser
- Always pass a `session_id` tied to the invoice ID for traceability
- Handle TinyFish errors gracefully — if navigation fails, route to EXCEPTION

### Data Model (MongoDB)
```
invoices collection:
{
  _id: ObjectId,
  invoice_number: string,
  vendor_name: string,
  vendor_email: string,
  amount: number,
  currency: string,
  due_date: Date,
  line_items: Array<{ description: string, amount: number, qty: number }>,
  po_number: string | null,
  po_amount: number | null,
  match_result: 'MATCH' | 'MISMATCH' | 'NO_PO' | null,
  match_delta: number | null,
  status: 'RECEIVED' | 'PARSING' | 'MATCHING' | 'APPROVED' | 'EXCEPTION' | 'DISPUTED',
  qb_bill_id: string | null,
  payment_scheduled_date: Date | null,
  agent_log: Array<{ timestamp: Date, action: string, detail: string }>,
  raw_email: string,
  raw_pdf_url: string | null,
  created_at: Date,
  updated_at: Date
}

settings collection:
{
  _id: 'global',
  agentmail_inbox: string,
  qb_access_token: string,
  qb_company_id: string,
  match_tolerance_percent: number,  // default: 2
  auto_approve_max: number,         // default: 10000
  slack_webhook_url: string | null,
  alert_email: string | null
}
```

---

## 💻 Code Style Rules

### TypeScript
- Use TypeScript everywhere. No `any` types — define proper interfaces
- All API routes must have request/response type definitions
- Use Zod for runtime validation of webhook payloads

### API Routes (Next.js App Router)
- All routes in `/app/api/`
- Follow REST conventions: GET for reads, POST for actions, PUT for updates
- Always return `{ success: boolean, data?: T, error?: string }`
- Use 200 for success, 400 for bad input, 500 for server errors
- Log all errors to Axiom before returning

### Environment Variables
```
# Required — never hardcode
TINYFISH_API_KEY=
FIREWORKS_API_KEY=
MONGODB_URI=
AGENTMAIL_WEBHOOK_SECRET=
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
AGENTOPS_API_KEY=
AXIOM_API_TOKEN=
AXIOM_DATASET=autoap-logs
SLACK_WEBHOOK_URL=
ALERT_EMAIL=
```

### Error Handling
- Wrap all async operations in try/catch
- On any caught error: log to Axiom, update invoice status to EXCEPTION, alert via Slack/email
- Never let unhandled errors crash the pipeline silently

---

## 🎨 Frontend Rules

### Component Structure
```
/components
  /dashboard
    KPIStrip.tsx       — 4 top metric cards
    PipelineTracker.tsx — left panel, current agent step
    InvoiceFeed.tsx    — center table with real-time updates
    AgentActivityLog.tsx — right panel, live log stream
  /invoice
    InvoiceDetail.tsx
    MatchVisualizer.tsx
    ActionButtons.tsx
  /shared
    StatusBadge.tsx
    MoneyDisplay.tsx   — always format: $1,240.00 USD
    TimestampDisplay.tsx — always format: relative + absolute on hover
```

### Styling Rules
- Dark mode only. Base: `#0a0e1a`. Never use pure black `#000000`
- Primary cyan: `#00d4ff`. Success: `#00ff88`. Warning: `#ff8800`. Error: `#ff4466`
- Use CSS variables for all colors — no hardcoded hex in components
- Monospace font (`JetBrains Mono`) ONLY for: amounts, invoice numbers, timestamps, agent logs
- All other text: `DM Sans`
- Minimum touch target: 44x44px
- Always show loading skeletons, never blank screens

### Real-time Updates
- Use SSE (Server-Sent Events) for agent activity log — `/api/agent/stream`
- Poll `/api/invoices` every 5 seconds for feed updates
- Use optimistic UI for manual approval actions

---

## 🔒 Security Rules

- Validate AgentMail webhook signature on every request (HMAC-SHA256)
- Store QB tokens encrypted at rest in MongoDB
- Never log sensitive data (amounts fine, but no PII beyond vendor name)
- Rate limit all API routes: 60 req/min per IP
- QB OAuth tokens must refresh automatically — handle 401s transparently

---

## 🚀 Demo Day Rules

These rules exist specifically to make the live demo work perfectly:

- **ALWAYS have seed data** — `/scripts/seed.ts` must populate 10 demo invoices in varied states
- **Demo mode flag** — `DEMO_MODE=true` in env causes the pipeline to run in slow motion (3s per step) so judges can see each step live
- **Never fail silently in demo** — if any step errors, show a visible error state in the UI with the error message
- **AgentOps dashboard link** — always visible in the header so judges can click through to see the full agent trace
- The QuickBooks sandbox must be pre-authenticated before demo — store valid token in MongoDB before recording

---

## 📋 Build Priority Order

```
P0 (must demo):
  [ ] AgentMail webhook receiver
  [ ] Fireworks.ai invoice parser
  [ ] MongoDB invoice storage
  [ ] TinyFish QB navigation (login → PO lookup → bill creation)
  [ ] Dashboard with live feed + agent log
  [ ] Exception flagging + Slack alert

P1 (demo polish):
  [ ] AgentOps integration
  [ ] Payment scheduling in QB
  [ ] KPI cards with real data
  [ ] Invoice detail view

P2 (if time permits):
  [ ] Vendor portal invoice download
  [ ] Alguna billing integration
  [ ] Settings page
  [ ] Email alerts
```
