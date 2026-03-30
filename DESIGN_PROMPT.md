# AutoAP — Design Prompt for Antigravity IDE

## 🎯 Project Overview

Build **AutoAP** — an autonomous accounts payable agent dashboard for SMBs. 
The UI is a real-time nerve center that shows a founder exactly what the agent 
is doing with their invoices at any moment, replacing 8 hours/week of manual AP work.

---

## 🎨 Aesthetic Direction: "Industrial Command Center"

Think: a Bloomberg Terminal meets a modern ops dashboard. Dark, dense, data-rich.
Every pixel earns its place. No decorative fluff — only actionable information.

- **Theme:** Deep navy/charcoal dark mode (#0a0e1a base)
- **Accent:** Electric cyan (#00d4ff) for primary actions, lime green (#00ff88) for success, 
  amber (#ff8800) for warnings, crimson (#ff4466) for exceptions
- **Typography:** `JetBrains Mono` or `IBM Plex Mono` for data/numbers, 
  `DM Sans` or `Syne` for headings — monospace precision meets editorial clarity
- **Motion:** Subtle pulse animations on live agent steps. Row flash on new invoice arrival.
  Progress bars animate smoothly. No gratuitous animation.
- **Layout:** Dense 3-column grid. Left sidebar = pipeline status. 
  Center = invoice feed. Right = agent activity log.

---

## 📐 Pages & Components to Build

### 1. `/dashboard` — Main Command Center
The primary view. A founder opens this like a pilot's cockpit.

**Top KPI Strip (4 cards):**
- Invoices Processed Today (with delta vs yesterday)
- Total $ Processed This Month
- Pending Approvals (actionable count)
- Exceptions Flagged (red alert if > 0)

**Left Panel — Pipeline Status:**
Real-time agent step tracker. Shows the current invoice being processed
with animated step indicators:
```
[✓] Email Detected        — 2 min ago
[✓] Invoice Parsed        — 1 min ago  
[⟳] PO Match in Progress  — live...
[ ] Bill Creation
[ ] Payment Scheduled
```

**Center Panel — Invoice Feed:**
Table with columns: Vendor | Invoice # | Amount | PO Match | Status | Action
- Color-coded status badges: AUTO-APPROVED (green), PENDING (amber), EXCEPTION (red)
- Click row to expand full invoice detail + agent reasoning
- Infinite scroll, most recent first

**Right Panel — Agent Activity Log:**
Live stream of TinyFish agent actions. Monospace, timestamped.
```
14:32:01  → Navigating QuickBooks login...
14:32:04  → Authenticated successfully
14:32:05  → Searching PO #4521...
14:32:08  → Match found. Amount: $1,240.00
14:32:09  → Creating bill in QB...
14:32:11  ✓ Bill created. Payment scheduled Net-30.
```

### 2. `/invoice/:id` — Invoice Detail View
Full breakdown of a single invoice run through the agent:
- Side-by-side: original invoice PDF preview vs extracted JSON
- 3-way match result visualization (PO / Invoice / Receipt)
- Agent decision reasoning (why it approved or flagged)
- Manual override buttons: APPROVE / DISPUTE / ESCALATE

### 3. `/exceptions` — Human Review Queue
List of flagged invoices requiring human decision.
Each card shows: vendor, discrepancy type, amount delta, recommended action.
One-click approve/reject with audit logging.

### 4. `/settings` — Agent Configuration
- AP inbox connection (AgentMail)
- QuickBooks OAuth connection status
- Matching rules (tolerance %, auto-approve threshold)
- Notification preferences (Slack webhook, email)
- Vendor whitelist/blacklist

---

## 🧩 Component Specs

### `<InvoiceFeed />` 
- Virtualized list (react-window) for performance
- Real-time updates via WebSocket or polling
- Row highlight animation on new arrival (cyan flash, 500ms)
- Status badge component: pill shape, color-coded

### `<AgentActivityLog />`
- Monospace font, dark background
- Auto-scroll to bottom on new entry
- Color-code by event type: info (white), success (green), warning (amber), error (red)
- Timestamp in HH:MM:SS format

### `<PipelineTracker />`
- Vertical stepper component
- Animated spinner on active step
- Checkmark animation on completion
- Shows current invoice being processed

### `<KPICard />`
- Large number display with trend delta
- Subtle background glow matching status color
- Hover reveals sparkline of last 7 days

### `<MatchVisualizer />`
- Three columns: PO | Invoice | Receipt
- Green connector lines if match, red if discrepancy
- Delta amount highlighted in red on mismatch

---

## 🔌 API Integration Points

```typescript
// Invoice feed (MongoDB → API)
GET /api/invoices?status=all&limit=50&page=1

// Agent activity stream  
GET /api/agent/log?live=true  // SSE or WebSocket

// Pipeline current state
GET /api/pipeline/status

// Exception queue
GET /api/invoices?status=exception

// Manual action
POST /api/invoices/:id/action
Body: { action: 'approve' | 'dispute' | 'escalate', note?: string }

// Settings
GET/PUT /api/settings
```

---

## 📦 Suggested Tech Stack for Frontend

```
Framework:     Next.js 14 (App Router)
Styling:       Tailwind CSS + CSS variables for theme
UI Gen:        v0 by Vercel (generate base components)
Charts:        Recharts or Tremor
Animation:     Framer Motion (light usage)
Tables:        TanStack Table v8
Real-time:     Server-Sent Events (SSE) from Next.js API route
Icons:         Lucide React
Fonts:         JetBrains Mono + DM Sans (Google Fonts)
Deployment:    Vercel
```

---

## 🎬 Demo Day Optimization

The UI must look GREAT during a screen recording. Key moments to nail:

1. **Invoice arrives** — row flashes into the feed live
2. **Agent navigates QB** — activity log streams in real time (visible on right panel)  
3. **Match result** — green/red indicator animates on the invoice row
4. **Dashboard KPIs tick up** — number increments with a subtle count-up animation

The founder says: *"That took 23 seconds. It used to take 25 minutes."*
The UI should make that obvious without them saying it.
