# AutoAP — Skills & Reusable Patterns
# Reference: "Use the patterns in SKILLS.md" when asking for help.

## Skill 1: TinyFish Agent Step Pattern
Use this pattern for EVERY TinyFish navigation step.
Always wrap in error handling and always log to AgentOps + Axiom.

```typescript
// lib/tinyfish.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function runAgentStep({
  sessionId,
  invoiceId,
  task,
  context,
  logStep,
}: {
  sessionId: string;
  invoiceId: string;
  task: string;
  context: Record<string, unknown>;
  logStep: (action: string, detail: string) => Promise<void>;
}) {
  await logStep('TINYFISH_START', `Starting: ${task}`);
  
  try {
    const response = await fetch('https://api.tinyfish.ai/v1/agent/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TINYFISH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        task,
        context,
        timeout: 60000,
      }),
    });

    if (!response.ok) {
      throw new Error(`TinyFish error: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();
    await logStep('TINYFISH_SUCCESS', `Completed: ${task} → ${JSON.stringify(result.output)}`);
    return result;

  } catch (error) {
    await logStep('TINYFISH_ERROR', `Failed: ${task} → ${String(error)}`);
    throw error;
  }
}
```

---

## Skill 2: Fireworks Invoice Parser
Extracts structured data from any invoice format (PDF text, HTML, plain text).

```typescript
// lib/fireworks.ts
export interface ParsedInvoice {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  currency: string;
  po_number: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  raw_text: string;
}

export async function parseInvoice(rawText: string): Promise<ParsedInvoice> {
  const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an expert invoice parser. Extract all invoice data and return ONLY valid JSON. 
                    No markdown, no explanation. If a field is not found, use null.
                    Always normalize amounts to numbers (no $ signs, no commas).
                    Always normalize dates to ISO 8601 format (YYYY-MM-DD).`,
        },
        {
          role: 'user',
          content: `Parse this invoice and return JSON matching this exact schema:
{
  "vendor_name": string,
  "invoice_number": string,
  "invoice_date": string,
  "due_date": string,
  "total_amount": number,
  "currency": string,
  "po_number": string | null,
  "line_items": [{"description": string, "quantity": number, "unit_price": number, "total": number}]
}

Invoice text:
${rawText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Strip any accidental markdown fences
  const clean = content.replace(/```json\n?|```\n?/g, '').trim();
  const parsed = JSON.parse(clean);
  
  return { ...parsed, raw_text: rawText };
}
```

---

## Skill 3: Pipeline Orchestrator
The main invoice pipeline. Import and call `runInvoicePipeline(invoiceId)`.

```typescript
// pipeline/invoice.pipeline.ts
import { parseInvoice } from '@/lib/fireworks';
import { runAgentStep } from '@/lib/tinyfish';
import { logToAgentOps, logToAxiom } from '@/lib/observability';
import { updateInvoice, getInvoice } from '@/lib/mongodb';
import { sendExceptionAlert } from '@/lib/alerts';

type PipelineStatus = 'RECEIVED' | 'PARSING' | 'MATCHING' | 'APPROVED' | 'EXCEPTION' | 'DISPUTED';

async function setStatus(invoiceId: string, status: PipelineStatus, extra = {}) {
  await updateInvoice(invoiceId, { status, updated_at: new Date(), ...extra });
}

async function logStep(invoiceId: string, action: string, detail: string) {
  const entry = { timestamp: new Date(), action, detail };
  
  // Append to invoice agent_log
  await updateInvoice(invoiceId, {
    $push: { agent_log: entry }
  });
  
  // Log to AgentOps + Axiom
  await Promise.all([
    logToAgentOps({ invoiceId, action, detail }),
    logToAxiom({ invoiceId, action, detail, level: 'info' }),
  ]);
}

export async function runInvoicePipeline(invoiceId: string) {
  const log = (action: string, detail: string) => logStep(invoiceId, action, detail);
  
  try {
    const invoice = await getInvoice(invoiceId);
    const sessionId = `autoap-${invoiceId}`;

    // ── STEP 2: Parse invoice ────────────────────────────────────────
    await setStatus(invoiceId, 'PARSING');
    await log('PARSE_START', 'Sending to Fireworks.ai for extraction');
    
    const parsed = await parseInvoice(invoice.raw_email);
    
    await updateInvoice(invoiceId, {
      vendor_name: parsed.vendor_name,
      invoice_number: parsed.invoice_number,
      amount: parsed.total_amount,
      currency: parsed.currency,
      due_date: new Date(parsed.due_date),
      line_items: parsed.line_items,
      po_number: parsed.po_number,
    });
    await log('PARSE_COMPLETE', `Extracted: ${parsed.vendor_name} | $${parsed.total_amount} | PO: ${parsed.po_number}`);

    // ── STEP 3-5: QB Navigation + PO Match ──────────────────────────
    await setStatus(invoiceId, 'MATCHING');
    
    // Login to QuickBooks
    await runAgentStep({
      sessionId,
      invoiceId,
      task: 'Navigate to QuickBooks Online and log in using saved credentials',
      context: { 
        company_id: process.env.QB_COMPANY_ID,
        login_url: 'https://qbo.intuit.com/login' 
      },
      logStep: log,
    });

    // Look up PO
    const poResult = await runAgentStep({
      sessionId,
      invoiceId,
      task: `Search for Purchase Order number ${parsed.po_number} and return the PO amount`,
      context: { po_number: parsed.po_number },
      logStep: log,
    });

    const poAmount = poResult.output?.po_amount;
    const delta = Math.abs(parsed.total_amount - poAmount);
    const toleranceAmount = poAmount * (await getSettings()).match_tolerance_percent / 100;
    const isMatch = delta <= toleranceAmount;

    await updateInvoice(invoiceId, {
      po_amount: poAmount,
      match_result: isMatch ? 'MATCH' : 'MISMATCH',
      match_delta: delta,
    });

    // ── STEP 6: Decision ─────────────────────────────────────────────
    if (isMatch) {
      await log('MATCH_SUCCESS', `PO match confirmed. Delta: $${delta.toFixed(2)}. Auto-approving.`);
      
      // Create bill in QB
      await runAgentStep({
        sessionId,
        invoiceId,
        task: `Create a bill in QuickBooks for vendor "${parsed.vendor_name}", amount $${parsed.total_amount}, due ${parsed.due_date}. Assign to expense account.`,
        context: { parsed },
        logStep: log,
      });

      // Schedule payment
      await runAgentStep({
        sessionId,
        invoiceId,
        task: `Schedule payment for the bill just created, according to Net-30 terms from invoice date ${parsed.invoice_date}`,
        context: {},
        logStep: log,
      });

      await setStatus(invoiceId, 'APPROVED', {
        payment_scheduled_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await log('PIPELINE_COMPLETE', `Invoice approved and payment scheduled. ✓`);

    } else {
      await log('MATCH_FAILED', `Mismatch detected. Invoice: $${parsed.total_amount}, PO: $${poAmount}, Delta: $${delta.toFixed(2)}`);
      await setStatus(invoiceId, 'EXCEPTION');
      await sendExceptionAlert({
        invoiceId,
        vendor: parsed.vendor_name,
        invoiceAmount: parsed.total_amount,
        poAmount,
        delta,
      });
    }

  } catch (error) {
    await logToAxiom({ invoiceId, action: 'PIPELINE_ERROR', detail: String(error), level: 'error' });
    await setStatus(invoiceId, 'EXCEPTION');
    await sendExceptionAlert({ invoiceId, error: String(error) });
    throw error;
  }
}
```

---

## Skill 4: SSE Agent Log Stream
Powers the real-time activity log in the right panel.

```typescript
// app/api/agent/stream/route.ts
import { NextRequest } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const client = await getMongoClient();
      const db = client.db('autoap');
      
      // Watch for changes on invoices collection
      const changeStream = db.collection('invoices').watch([
        { $match: { 'updateDescription.updatedFields.agent_log': { $exists: true } } }
      ]);

      changeStream.on('change', (change) => {
        const updatedFields = change.updateDescription?.updatedFields;
        // Find the newly added log entry
        const newEntry = Object.entries(updatedFields || {})
          .filter(([key]) => key.startsWith('agent_log.'))
          .map(([, value]) => value)[0];

        if (newEntry) {
          const data = `data: ${JSON.stringify(newEntry)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      });

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        changeStream.close();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Skill 5: Seed Script for Demo Data
Run `npx tsx scripts/seed.ts` before every demo session.

```typescript
// scripts/seed.ts
import { getMongoClient } from '../lib/mongodb';

const DEMO_INVOICES = [
  {
    vendor_name: 'Acme Office Supplies',
    invoice_number: 'INV-2025-001',
    amount: 1240.00,
    po_number: 'PO-4521',
    po_amount: 1240.00,
    status: 'APPROVED',
    match_result: 'MATCH',
    match_delta: 0,
  },
  {
    vendor_name: 'CloudHost Pro',
    invoice_number: 'INV-CH-8821',
    amount: 890.00,
    po_number: 'PO-4522',
    po_amount: 850.00,
    status: 'EXCEPTION',
    match_result: 'MISMATCH',
    match_delta: 40.00,
  },
  {
    vendor_name: 'Design Studio Co',
    invoice_number: 'DS-2025-112',
    amount: 3500.00,
    po_number: 'PO-4523',
    po_amount: 3500.00,
    status: 'APPROVED',
    match_result: 'MATCH',
    match_delta: 0,
  },
];

async function seed() {
  const client = await getMongoClient();
  const db = client.db('autoap');
  
  await db.collection('invoices').deleteMany({});
  await db.collection('invoices').insertMany(
    DEMO_INVOICES.map(inv => ({
      ...inv,
      currency: 'USD',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date(),
      agent_log: [
        { timestamp: new Date(), action: 'PIPELINE_COMPLETE', detail: 'Demo data' }
      ],
    }))
  );
  
  console.log('✓ Seeded', DEMO_INVOICES.length, 'demo invoices');
  process.exit(0);
}

seed().catch(console.error);
```
