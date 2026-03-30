// ─── AutoAP — Invoice Pipeline Orchestrator ───────────────────────
// Main 8-step pipeline: Parse → QB PO Match → Decision → Bill/Exception
// Supports dual mode: TinyFish (browser agent) or Direct API

import { parseInvoice } from '@/lib/fireworks';
import { searchPurchaseOrder, createBill, getQBCompanyId } from '@/lib/quickbooks';
import { tfSearchPO, tfCreateBill } from '@/lib/tinyfish';
import { logToAgentOps, logToAxiom } from '@/lib/observability';
import { updateInvoice, getInvoice, getSettings } from '@/lib/mongodb';
import { sendExceptionAlert } from '@/lib/alerts';
import { PipelineStatus } from '@/lib/types';

const DEMO_DELAY = 3000; // 3s per step in demo mode
const USE_TINYFISH = process.env.USE_TINYFISH === 'true';

async function demoWait() {
    if (process.env.DEMO_MODE === 'true') {
        await new Promise(resolve => setTimeout(resolve, DEMO_DELAY));
    }
}

async function setStatus(invoiceId: string, status: PipelineStatus, extra = {}) {
    await updateInvoice(invoiceId, { status, updated_at: new Date().toISOString(), ...extra });
}

async function logStep(invoiceId: string, action: string, detail: string) {
    const entry = { timestamp: new Date().toISOString(), action, detail };

    // Append to invoice agent_log
    const invoice = await getInvoice(invoiceId);
    if (invoice) {
        await updateInvoice(invoiceId, {
            agent_log: [...(invoice.agent_log || []), entry],
        });
    }

    // Log to AgentOps + Axiom
    await Promise.all([
        logToAgentOps({ invoiceId, action, detail }),
        logToAxiom({ invoiceId, action, detail, level: 'info' }),
    ]);
}

// ─── QB Step Adapters (TinyFish vs Direct API) ──────────────────

async function searchPO(
    companyId: string,
    poNumber: string,
    log: (action: string, detail: string) => Promise<void>
): Promise<{ po_amount: number; po_id: string } | null> {
    if (USE_TINYFISH) {
        await log('MODE', '🐟 Using TinyFish browser agent for QB navigation');
        try {
            return await tfSearchPO(companyId, poNumber, log);
        } catch (err) {
            await log('TINYFISH_FALLBACK', `⚠️ TinyFish failed: ${String(err).slice(0, 80)} — falling back to direct API`);
        }
    }
    await log('MODE', '⚡ Using direct QB API for PO search');
    return searchPurchaseOrder(companyId, poNumber);
}

async function createQBBill(
    companyId: string,
    parsed: {
        vendor_name: string | null;
        invoice_number: string;
        total_amount: number;
        due_date: string;
        line_items: Array<{ description: string; total: number }>;
    },
    log: (action: string, detail: string) => Promise<void>
): Promise<string> {
    if (USE_TINYFISH) {
        try {
            return await tfCreateBill(
                companyId,
                {
                    vendorName: parsed.vendor_name || 'Unknown Vendor',
                    amount: parsed.total_amount,
                    dueDate: parsed.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                    lineDescription: parsed.line_items?.length > 0
                        ? parsed.line_items.map(li => li.description).join('; ')
                        : `Invoice ${parsed.invoice_number}`,
                },
                log
            );
        } catch (err) {
            await log('TINYFISH_FALLBACK', `⚠️ TinyFish bill creation failed: ${String(err).slice(0, 80)} — falling back to direct API`);
        }
    }
    return createBill(companyId, {
        vendorName: parsed.vendor_name || 'Unknown Vendor',
        amount: parsed.total_amount,
        dueDate: parsed.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        lineItems: parsed.line_items?.length > 0
            ? parsed.line_items.map(li => ({ description: li.description, amount: li.total || 0 }))
            : [{ description: `Invoice ${parsed.invoice_number}`, amount: parsed.total_amount }],
    });
}

// ─── Main Pipeline ──────────────────────────────────────────────

export async function runInvoicePipeline(invoiceId: string) {
    const log = (action: string, detail: string) => logStep(invoiceId, action, detail);

    try {
        const invoice = await getInvoice(invoiceId);
        if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

        // ── STEP 2: Parse invoice ────────────────────────────────────────
        await demoWait();
        await setStatus(invoiceId, 'PARSING');
        await log('PARSE_START', 'Sending to Fireworks.ai for extraction');

        const parsed = await parseInvoice(invoice.raw_email);

        await updateInvoice(invoiceId, {
            vendor_name: parsed.vendor_name || 'Unknown Vendor',
            invoice_number: parsed.invoice_number,
            amount: parsed.total_amount,
            currency: parsed.currency,
            due_date: parsed.due_date,
            po_number: parsed.po_number,
        });
        await log('PARSE_COMPLETE', `Extracted: ${parsed.vendor_name || 'Unknown'} | $${parsed.total_amount} | PO: ${parsed.po_number}`);

        // ── STEP 2.5: TinyFish Vendor Portal Verification (demo) ─────────
        if (USE_TINYFISH && process.env.VENDOR_PORTAL_URL && parsed.po_number) {
            await demoWait();
            await log('VENDOR_PORTAL_START', `🐟 TinyFish verifying invoice on vendor portal...`);

            try {
                const { tfVerifyInvoice } = await import('@/lib/tinyfish');
                const portalResult = await tfVerifyInvoice(
                    process.env.VENDOR_PORTAL_URL,
                    parsed.po_number,
                    log
                );

                if (portalResult) {
                    await updateInvoice(invoiceId, {
                        portal_verified: true,
                        portal_invoice_number: portalResult.invoice_number,
                        portal_amount: portalResult.total_amount,
                    });
                    await log('VENDOR_PORTAL_DONE', `✅ Portal confirmed: ${portalResult.vendor} | ${portalResult.invoice_number} | $${portalResult.total_amount}`);
                } else {
                    await log('VENDOR_PORTAL_MISS', `⚠️ Invoice not found on vendor portal — continuing with parsed data`);
                }
            } catch (err) {
                await log('VENDOR_PORTAL_ERROR', `⚠️ Portal verification failed: ${String(err)} — continuing`);
            }
        }

        // ── STEP 3-5: QB PO Match ────────────────────────────────────────
        await demoWait();
        await setStatus(invoiceId, 'MATCHING');

        const companyId = await getQBCompanyId();
        await log('QB_SEARCH', `Looking up PO ${parsed.po_number} in QuickBooks (Company: ${companyId})`);

        const poResult = parsed.po_number
            ? await searchPO(companyId, parsed.po_number, log)
            : null;

        if (!poResult) {
            await log('MATCH_FAILED', `PO ${parsed.po_number || 'N/A'} not found in QuickBooks.`);
            await setStatus(invoiceId, 'EXCEPTION', {
                match_result: 'PO_NOT_FOUND',
            });
            await sendExceptionAlert({
                invoiceId,
                vendor: parsed.vendor_name || 'Unknown',
                invoiceAmount: parsed.total_amount,
                error: `PO ${parsed.po_number} not found`,
            });
            return;
        }

        const poAmount = poResult.po_amount;
        const settings = await getSettings();
        const delta = Math.abs(parsed.total_amount - poAmount);
        const toleranceAmount = poAmount * settings.match_tolerance_percent / 100;
        const isMatch = delta <= toleranceAmount;

        await updateInvoice(invoiceId, {
            po_amount: poAmount,
            match_result: isMatch ? 'MATCH' : 'MISMATCH',
            match_delta: delta,
        });

        await log('PO_MATCH_RESULT', `Invoice: $${parsed.total_amount} vs PO: $${poAmount} | Delta: $${delta.toFixed(2)} | ${isMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

        // ── STEP 6: Decision ─────────────────────────────────────────────
        await demoWait();

        if (isMatch && parsed.total_amount <= settings.auto_approve_max) {
            await log('AUTO_APPROVE', `PO match confirmed. Delta: $${delta.toFixed(2)}. Creating bill in QB.`);

            const billId = await createQBBill(companyId, parsed, log);

            await log('BILL_CREATED', `QuickBooks bill created — ID: ${billId}`);

            const paymentDate = new Date(Date.now() + 30 * 86400000).toISOString();
            await setStatus(invoiceId, 'APPROVED', {
                qb_bill_id: billId,
                payment_scheduled_date: paymentDate,
            });
            await log('PIPELINE_COMPLETE', `Invoice approved. Bill #${billId} created. Payment scheduled for ${paymentDate.split('T')[0]}. ✓`);

        } else if (isMatch && parsed.total_amount > settings.auto_approve_max) {
            await log('APPROVAL_LIMIT', `Amount $${parsed.total_amount} exceeds auto-approve limit of $${settings.auto_approve_max}. Requires human approval.`);
            await setStatus(invoiceId, 'EXCEPTION');
            await sendExceptionAlert({
                invoiceId,
                vendor: parsed.vendor_name || 'Unknown',
                invoiceAmount: parsed.total_amount,
                poAmount,
                delta,
            });

        } else {
            await log('MATCH_FAILED', `Mismatch detected. Invoice: $${parsed.total_amount}, PO: $${poAmount}, Delta: $${delta.toFixed(2)}`);
            await setStatus(invoiceId, 'EXCEPTION');
            await sendExceptionAlert({
                invoiceId,
                vendor: parsed.vendor_name || 'Unknown',
                invoiceAmount: parsed.total_amount,
                poAmount,
                delta,
            });
        }

    } catch (error) {
        console.error(`[Pipeline Error] ${invoiceId}:`, error);
        await logToAxiom({ invoiceId, action: 'PIPELINE_ERROR', detail: String(error), level: 'error' });
        await setStatus(invoiceId, 'EXCEPTION');
        await sendExceptionAlert({ invoiceId, error: String(error) });
        throw error;
    }
}
