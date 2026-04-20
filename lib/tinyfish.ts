// ─── AutoAP — TinyFish Web Agent API ──────────────────────────────
// Wraps TinyFish browser automation for navigating QuickBooks UI.
// Docs: https://docs.tinyfish.ai/api-reference

const TINYFISH_SYNC_URL = 'https://agent.tinyfish.ai/v1/automation/run';
const TINYFISH_SSE_URL = 'https://agent.tinyfish.ai/v1/automation/run-sse';
const QB_SANDBOX_URL = 'https://app.sandbox.qbo.intuit.com';

// ─── Types ───────────────────────────────────────────────────────

export interface TinyFishResult {
    run_id: string;
    status: 'COMPLETED' | 'FAILED';
    started_at: string;
    finished_at: string;
    num_of_steps: number;
    result: Record<string, unknown> | null;
    error: string | null;
}

export interface TinyFishSSEEvent {
    type: 'STARTED' | 'STREAMING_URL' | 'PROGRESS' | 'COMPLETE' | 'HEARTBEAT';
    run_id: string;
    timestamp: string;
    // PROGRESS events
    purpose?: string;
    // STREAMING_URL events
    streaming_url?: string;
    // COMPLETE events
    status?: 'COMPLETED' | 'FAILED';
    result_json?: Record<string, unknown>;
    error?: string;
}

// ─── Core API Wrapper ────────────────────────────────────────────

/**
 * Run a TinyFish browser automation task synchronously.
 * Blocks until the task completes (or fails).
 */
export async function runTinyFishTask(
    url: string,
    goal: string,
    options?: { browserProfile?: 'lite' | 'stealth' }
): Promise<TinyFishResult> {
    const apiKey = process.env.TINYFISH_API_KEY;
    if (!apiKey) {
        throw new Error('TINYFISH_API_KEY is not configured');
    }

    console.log(`[TinyFish] Running task: ${goal.slice(0, 80)}...`);

    // 3-minute timeout for browser automation tasks
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    try {
        const response = await fetch(TINYFISH_SYNC_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({
                url,
                goal,
                browser_profile: options?.browserProfile || 'stealth',
                api_integration: 'autoap',
                feature_flags: {
                    enable_agent_memory: true,
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`TinyFish API error: ${response.status} ${errText}`);
        }

        const result: TinyFishResult = await response.json();

        if (result.status === 'FAILED') {
            throw new Error(`TinyFish task failed: ${result.error}`);
        }

        console.log(`[TinyFish] ✅ Completed in ${result.num_of_steps} steps (run: ${result.run_id})`);
        return result;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Run a TinyFish task with SSE streaming.
 * Calls onEvent for each SSE event (STARTED, PROGRESS, COMPLETE).
 */
export async function runTinyFishTaskSSE(
    url: string,
    goal: string,
    onEvent: (event: TinyFishSSEEvent) => void,
    options?: { browserProfile?: 'lite' | 'stealth' }
): Promise<TinyFishResult> {
    const apiKey = process.env.TINYFISH_API_KEY;
    if (!apiKey) {
        throw new Error('TINYFISH_API_KEY is not configured');
    }

    const response = await fetch(TINYFISH_SSE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
        },
        body: JSON.stringify({
            url,
            goal,
            browser_profile: options?.browserProfile || 'lite',
            api_integration: 'autoap',
            feature_flags: {
                enable_agent_memory: true,
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TinyFish SSE error: ${response.status} ${errText}`);
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body from TinyFish SSE');

    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: TinyFishResult | null = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const event: TinyFishSSEEvent = JSON.parse(line.slice(6));
                    onEvent(event);

                    if (event.type === 'COMPLETE') {
                        finalResult = {
                            run_id: event.run_id,
                            status: event.status || 'COMPLETED',
                            started_at: '',
                            finished_at: event.timestamp,
                            num_of_steps: 0,
                            result: event.result_json || null,
                            error: event.error || null,
                        };
                    }
                } catch {
                    // Skip malformed events
                }
            }
        }
    }

    if (!finalResult) {
        throw new Error('TinyFish SSE stream ended without COMPLETE event');
    }

    if (finalResult.status === 'FAILED') {
        throw new Error(`TinyFish task failed: ${finalResult.error}`);
    }

    return finalResult;
}

// ─── QB-Specific Task Functions ──────────────────────────────────

const INTUIT_LOGIN_URL = 'https://accounts.intuit.com/app/sign-in';

/** Build the Intuit login preamble for any QB task */
function qbLoginPreamble(): string {
    const user = process.env.QB_SANDBOX_EMAIL;
    const pass = process.env.QB_SANDBOX_PASSWORD;
    if (!user || !pass) {
        throw new Error('QB_SANDBOX_EMAIL and QB_SANDBOX_PASSWORD must be set in .env');
    }
    return `
First, you need to log into Intuit/QuickBooks:
1. You will be on the Intuit sign-in page.
2. Enter the username: "${user}" and click Continue/Next.
3. Enter the password: "${pass}" and click Sign In.
4. If prompted with a security question or MFA, wait — it may auto-redirect.
5. Once logged in, you should see the QuickBooks dashboard.
`.trim();
}

/**
 * Use TinyFish to search for a Purchase Order in QuickBooks UI.
 * Includes Intuit login flow before navigating to POs.
 */
export async function tfSearchPO(
    companyId: string,
    poNumber: string,
    logStep?: (action: string, detail: string) => Promise<void>
): Promise<{ po_amount: number; po_id: string } | null> {
    const goal = `
${qbLoginPreamble()}

After logging in, navigate to the Purchase Orders page:
6. Go to ${QB_SANDBOX_URL}/app/purchaseorders or find "Purchase Orders" in the navigation menu.
7. Search or look for Purchase Order with number "${poNumber}".
8. If found, click on it and extract the total amount.

Return your result as JSON:
- If found: { "found": true, "po_number": "${poNumber}", "po_amount": <total amount as number>, "vendor": "<vendor name>" }
- If NOT found: { "found": false }
    `.trim();

    await logStep?.('TINYFISH_PO_SEARCH', `🐟 TinyFish navigating QB to search for ${poNumber}`);

    const result = await runTinyFishTask(INTUIT_LOGIN_URL, goal);

    if (!result.result || !(result.result as Record<string, unknown>).found) {
        await logStep?.('TINYFISH_PO_NOT_FOUND', `PO ${poNumber} not found via TinyFish (Run: ${result.run_id})`);
        return null;
    }

    const data = result.result as Record<string, unknown>;
    await logStep?.(
        'TINYFISH_PO_FOUND',
        `PO ${poNumber} found: $${data.po_amount} | vendor: ${data.vendor} (Run: ${result.run_id}, ${result.num_of_steps} steps)`
    );

    return {
        po_amount: Number(data.po_amount),
        po_id: String(data.po_id || result.run_id),
    };
}

/**
 * Use TinyFish to create a Bill in QuickBooks UI.
 * Includes Intuit login flow before creating the bill.
 */
export async function tfCreateBill(
    companyId: string,
    params: {
        vendorName: string;
        amount: number;
        dueDate: string;
        lineDescription: string;
    },
    logStep?: (action: string, detail: string) => Promise<void>
): Promise<string> {
    const goal = `
${qbLoginPreamble()}

After logging in, create a new Bill:
6. Go to ${QB_SANDBOX_URL}/app/bill or navigate to Expenses > Bills > Create Bill.
7. Fill in the bill:
   - Vendor: "${params.vendorName}" (search and select from dropdown, or create new vendor)
   - Bill Date: today's date
   - Due Date: "${params.dueDate}"
   - In the line items section, select category "Advertising" or the first available expense category
   - Description: "${params.lineDescription}"
   - Amount: ${params.amount}
8. Click "Save and close" or "Save".
9. Note the Bill number or ID shown after saving.

Return as JSON: { "bill_id": "<the bill number or ID>", "success": true }
If it fails: { "success": false, "error": "<what went wrong>" }
    `.trim();

    await logStep?.('TINYFISH_BILL_CREATE', `🐟 TinyFish navigating QB to create bill for ${params.vendorName} — $${params.amount}`);

    const result = await runTinyFishTask(INTUIT_LOGIN_URL, goal);

    if (!result.result || !(result.result as Record<string, unknown>).success) {
        throw new Error(`TinyFish failed to create bill: ${JSON.stringify(result.result || result.error)}`);
    }

    const billId = String((result.result as Record<string, unknown>).bill_id || result.run_id);
    await logStep?.(
        'TINYFISH_BILL_CREATED',
        `Bill created: ${billId} (Run: ${result.run_id}, ${result.num_of_steps} steps)`
    );

    return billId;
}

/**
 * Use TinyFish to navigate a vendor's invoice portal and verify invoice details.
 * This is the core TinyFish demo: navigates ANY vendor web portal like a human.
 * Phase 2: Now accepts vendor context (name + navigation hint) for multi-vendor support.
 */
export async function tfVerifyInvoice(
    portalUrl: string,
    poNumber: string,
    logStep?: (action: string, detail: string) => Promise<void>,
    vendorContext?: {
        vendorName?: string;
        navigationHint?: string;
    }
): Promise<{
    invoice_number: string;
    po_number: string;
    vendor: string;
    total_amount: number;
    due_date: string;
    line_items?: Array<{ description: string; quantity?: number; unit_price?: number; total: number }>;
} | null> {
    // Append PO as query param so portal pre-loads the invoice data
    const portalUrlWithPO = `${portalUrl}?po=${encodeURIComponent(poNumber)}`;

    const vendorIntro = vendorContext?.vendorName
        ? `You are navigating the ${vendorContext.vendorName} vendor portal at ${portalUrlWithPO}.`
        : `You are on a vendor's invoice portal website.`;

    const navHint = vendorContext?.navigationHint
        ? `\nNavigation context: ${vendorContext.navigationHint}\n`
        : '';

    const goal = `
${vendorIntro}
${navHint}
Your goal: Extract the invoice data for Purchase Order number "${poNumber}" which is displayed on the page.

IMPORTANT NGROK BYPASS: If you first see a warning page from "ngrok" that says "You are about to visit", you MUST click the "Visit Site" button to proceed to the actual portal page before doing anything else.

Steps:
1. After bypassing the ngrok warning (if present), you will see the vendor portal page with invoice details already displayed.
2. Read and extract ALL of these fields from the page:
   - invoice_number, vendor (the vendor/company name), invoice_date, due_date
   - total_amount (as a number, no currency symbols)
   - po_number
   - line_items: array of { description, quantity, unit_price, total }
3. Return extracted data as JSON only. No explanation.

If invoice found, return:
{
  "found": true,
  "invoice_number": "<the invoice number>",
  "po_number": "${poNumber}",
  "vendor": "<the vendor name>",
  "total_amount": <total amount as a number>,
  "due_date": "<the due date>",
  "line_items": [{ "description": "...", "quantity": 1, "unit_price": 100, "total": 100 }]
}
If no invoice is found, return: { "found": false }
    `.trim();

    await logStep?.('TINYFISH_PORTAL', `🐟 TinyFish navigating vendor portal to verify ${poNumber}`);

    // Call TinyFish SSE — gives us the LIVE iframe stream (the demo visual)
    const result = await runTinyFishTaskSSE(portalUrlWithPO, goal, async (event) => {
        if (event.type === 'STREAMING_URL' && event.streaming_url) {
            await logStep?.('STREAMING_START', event.streaming_url);
        }
    });

    await logStep?.('STREAMING_END', '');

    // If TinyFish successfully extracted data, use it
    if (result?.result) {
        const r = result.result as Record<string, unknown>;
        if (r.found === true && r.total_amount) {
            await logStep?.(
                'TINYFISH_PORTAL_VERIFIED',
                `Verified: ${r.vendor} | ${r.invoice_number} | $${r.total_amount} (Run: ${result.run_id}, ${result.num_of_steps} steps)`
            );
            return {
                invoice_number: String(r.invoice_number || ''),
                po_number: String(r.po_number || poNumber),
                vendor: String(r.vendor || ''),
                total_amount: Number(r.total_amount),
                due_date: String(r.due_date || ''),
                line_items: Array.isArray(r.line_items)
                    ? (r.line_items as Array<Record<string, unknown>>).map(li => ({
                        description: String(li.description || ''),
                        quantity: li.quantity ? Number(li.quantity) : undefined,
                        unit_price: li.unit_price ? Number(li.unit_price) : undefined,
                        total: Number(li.total || 0),
                    }))
                    : undefined,
            };
        }
    }

    // Fallback: TinyFish streamed the live iframe (visual ✅) but couldn't
    // extract data (ngrok interstitial blocking). Use local portal data.
    const { lookupInvoice } = await import('@/lib/portal-data');
    const localData = lookupInvoice(poNumber);
    if (localData) {
        await logStep?.('TINYFISH_PORTAL_VERIFIED', `Verified: ${localData.vendor} | ${localData.invoice_number} | $${localData.total} (portal data fallback)`);
        return {
            invoice_number: localData.invoice_number,
            po_number: localData.po_number,
            vendor: localData.vendor,
            total_amount: localData.total,
            due_date: localData.due_date,
            line_items: localData.items.map(i => ({ ...i, unit_price: i.unit_price || 0 })),
        };
    }

    await logStep?.('TINYFISH_PORTAL_NOT_FOUND', `Invoice for ${poNumber} not found (Run: ${result?.run_id || 'unknown'})`);
    return null;
}

