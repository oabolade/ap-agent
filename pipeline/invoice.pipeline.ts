// ─── AutoAP — Invoice Pipeline Orchestrator (Phase 2) ─────────────
// Parallel dual-source pipeline:
//   Email → PO hint → [Fireworks AI ∥ TinyFish Portal] → Reconciliation → QB API → Bill/Exception
// TinyFish is used ONLY for vendor portal scraping. QB is always direct API.

import { parseInvoice } from '@/lib/fireworks';
import { searchPurchaseOrder, createBill, getQBCompanyId } from '@/lib/quickbooks';
import { logToAgentOps, logToAxiom } from '@/lib/observability';
import { updateInvoice, getInvoice, getSettings, findVendorByName } from '@/lib/mongodb';
import { sendExceptionAlert } from '@/lib/alerts';
import { logApprovalToNotion } from '@/lib/composio';
import { reconcile, ParsedInvoice } from '@/lib/reconciliation';
import { PipelineStatus } from '@/lib/types';

const DEMO_DELAY = 3000;

async function demoWait() {
    if (process.env.DEMO_MODE === 'true') {
        await new Promise(resolve => setTimeout(resolve, DEMO_DELAY));
    }
}

async function setStatus(invoiceId: string, status: PipelineStatus, extra = {}) {
    await updateInvoice(invoiceId, { status, updated_at: new Date().toISOString(), ...extra });
    
    // Auto-log terminal states to Notion
    if (['APPROVED', 'EXCEPTION', 'PENDING_REVIEW'].includes(status)) {
        try {
            const invoice = await getInvoice(invoiceId);
            if (invoice) {
                const data = (invoice.fireworks_data || invoice.tinyfish_data) as any;
                const confidence = invoice.reconciliation?.confidence_score;
                
                let notionStatus: 'Approved' | 'Exception' | 'Pending Review' = 'Exception';
                if (status === 'APPROVED') notionStatus = 'Approved';
                if (status === 'PENDING_REVIEW') notionStatus = 'Pending Review';

                await logApprovalToNotion({
                    invoiceId,
                    invoiceNumber: data?.invoice_number || 'Unknown',
                    vendor: data?.vendor_name || invoice.vendor_name || 'Unknown',
                    amount: data?.total_amount || invoice.amount || 0,
                    status: notionStatus,
                    confidenceScore: confidence as number | undefined,
                    processedAt: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('[Notion Log] Error triggering notion log:', err);
        }
    }
}

async function logStep(invoiceId: string, action: string, detail: string) {
    const entry = { timestamp: new Date().toISOString(), action, detail };

    const invoice = await getInvoice(invoiceId);
    if (invoice) {
        await updateInvoice(invoiceId, {
            agent_log: [...(invoice.agent_log || []), entry],
        });
    }

    await Promise.all([
        logToAgentOps({ invoiceId, action, detail }),
        logToAxiom({ invoiceId, action, detail, level: 'info' }),
    ]);
}

// ─── PO Hint Pre-Extraction ─────────────────────────────────────

function extractPOHint(rawEmail: string): string | null {
    // Fast regex scan for PO patterns in email subject + body
    const patterns = [
        /PO[-\s#:]*(\d{3,})/i,
        /Purchase\s*Order[-\s#:]*(\d{3,})/i,
        /P\.?O\.?\s*#?\s*(\d{3,})/i,
    ];
    for (const pattern of patterns) {
        const match = rawEmail.match(pattern);
        if (match) return `PO-${match[1]}`;
    }
    return null;
}

// ─── Vendor Portal Scraper (with live iframe) ───────────────────

async function scrapeVendorPortal(
    portalUrl: string,
    poNumber: string,
    log: (action: string, detail: string) => Promise<void>,
    vendorContext?: { vendorName?: string; navigationHint?: string }
): Promise<ParsedInvoice | null> {
    const { tfVerifyInvoice } = await import('@/lib/tinyfish');
    const result = await tfVerifyInvoice(portalUrl, poNumber, log, vendorContext);
    if (!result) return null;

    return {
        invoice_number: result.invoice_number,
        po_number: result.po_number,
        vendor_name: result.vendor,
        total_amount: result.total_amount,
        due_date: result.due_date,
        line_items: result.line_items,
    };
}

// ─── Main Pipeline ──────────────────────────────────────────────

export async function runInvoicePipeline(invoiceId: string) {
    const log = (action: string, detail: string) => logStep(invoiceId, action, detail);
    const pipelineStart = Date.now();

    try {
        const invoice = await getInvoice(invoiceId);
        if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

        // ── STEP 1: PO Hint Pre-Extraction ───────────────────────────────
        const poHint = extractPOHint(invoice.raw_email || '');
        if (poHint) {
            await log('PO_HINT', `Quick regex found PO hint: ${poHint}`);
        }

        // ── STEP 2: Parallel Dual-Source Extraction ──────────────────────
        await demoWait();
        await setStatus(invoiceId, 'EXTRACTING');
        await log('EXTRACTION_START', 'Starting parallel extraction: Fireworks AI + TinyFish portal scrape');

        let emailData: ParsedInvoice | null = null;
        let portalData: ParsedInvoice | null = null;

        if (poHint) {
            // ── PARALLEL: PO hint available, both can run simultaneously ──
            // Look up vendor from stored fields or email body
            const vendorHint = invoice.vendor_name
                || invoice.raw_email?.match(/Vendor:\s*(.+)/i)?.[1]?.trim()
                || invoice.raw_email?.match(/From:\s*(.+)/i)?.[1]?.trim()
                || '';
            const vendor = vendorHint ? await findVendorByName(vendorHint) : null;
            const portalUrl = vendor?.portal_url;

            const [emailResult, portalResult] = await Promise.allSettled([
                // Fireworks AI parses the email text
                (async () => {
                    await log('FIREWORKS_START', 'Fireworks.ai parsing email text...');
                    const parsed = await parseInvoice(invoice.raw_email);
                    await log('FIREWORKS_COMPLETE', `Email extraction: ${parsed.vendor_name} | $${parsed.total_amount} | PO: ${parsed.po_number}`);
                    return {
                        invoice_number: parsed.invoice_number,
                        po_number: parsed.po_number || poHint,
                        vendor_name: parsed.vendor_name || 'Unknown',
                        total_amount: parsed.total_amount,
                        due_date: parsed.due_date,
                        line_items: parsed.line_items?.map(li => ({
                            description: li.description,
                            total: li.total || 0,
                        })),
                    } as ParsedInvoice;
                })(),
                // TinyFish scrapes the vendor portal (with live iframe!)
                portalUrl ? (async () => {
                    await log('PORTAL_SCRAPE_START', `🐟 TinyFish scraping ${vendor?.vendor_name || 'vendor'} portal for ${poHint}...`);
                    return scrapeVendorPortal(portalUrl, poHint, log, {
                        vendorName: vendor?.vendor_name,
                        navigationHint: vendor?.navigation_hint,
                    });
                })() : Promise.resolve(null),
            ]);

            emailData = emailResult.status === 'fulfilled' ? emailResult.value : null;
            portalData = portalResult.status === 'fulfilled' ? portalResult.value : null;

            if (emailResult.status === 'rejected') {
                await log('FIREWORKS_ERROR', `⚠️ Fireworks extraction failed: ${String(emailResult.reason).slice(0, 100)}`);
            }
            if (portalResult.status === 'rejected') {
                await log('PORTAL_SCRAPE_ERROR', `⚠️ Portal scrape failed: ${String(portalResult.reason).slice(0, 100)}`);
            }
        } else {
            // ── SEQUENTIAL: No PO hint, Fireworks first, then portal ──────
            await log('FIREWORKS_START', 'Fireworks.ai parsing email text (sequential — no PO hint detected)...');
            const parsed = await parseInvoice(invoice.raw_email);
            await log('FIREWORKS_COMPLETE', `Email extraction: ${parsed.vendor_name} | $${parsed.total_amount} | PO: ${parsed.po_number}`);

            emailData = {
                invoice_number: parsed.invoice_number,
                po_number: parsed.po_number || '',
                vendor_name: parsed.vendor_name || 'Unknown',
                total_amount: parsed.total_amount,
                due_date: parsed.due_date,
                line_items: parsed.line_items?.map(li => ({
                    description: li.description,
                    total: li.total || 0,
                })),
            };

            // Now try portal with extracted PO
            if (parsed.po_number && parsed.vendor_name) {
                const vendor = await findVendorByName(parsed.vendor_name);
                if (vendor?.portal_url) {
                    await log('PORTAL_SCRAPE_START', `🐟 TinyFish scraping ${vendor.vendor_name} portal for ${parsed.po_number}...`);
                    try {
                        portalData = await scrapeVendorPortal(vendor.portal_url, parsed.po_number, log, {
                            vendorName: vendor.vendor_name,
                            navigationHint: vendor.navigation_hint,
                        });
                    } catch (err) {
                        await log('PORTAL_SCRAPE_ERROR', `⚠️ Portal scrape failed: ${String(err).slice(0, 100)}`);
                    }
                }
            }
        }

        // Bail if we have neither source
        if (!emailData) {
            await log('EXTRACTION_FAILED', 'Both extraction sources failed. Cannot proceed.');
            await setStatus(invoiceId, 'EXCEPTION');
            await sendExceptionAlert({ invoiceId, error: 'All extraction sources failed' });
            return;
        }

        // Persist the extracted data from email
        await updateInvoice(invoiceId, {
            vendor_name: emailData.vendor_name,
            invoice_number: emailData.invoice_number,
            amount: emailData.total_amount,
            due_date: emailData.due_date,
            po_number: emailData.po_number,
            fireworks_data: emailData as any,
            tinyfish_data: (portalData || undefined) as any,
        });

        // ── STEP 3: Reconciliation ───────────────────────────────────────
        await demoWait();
        await setStatus(invoiceId, 'RECONCILING');

        let reconciliationResult = null;
        if (emailData && portalData) {
            await log('RECONCILIATION_START', 'Comparing Fireworks AI vs TinyFish portal data...');
            reconciliationResult = reconcile(emailData, portalData);
            await updateInvoice(invoiceId, { reconciliation: reconciliationResult as any });
            await log(
                'RECONCILIATION_COMPLETE',
                `Score: ${reconciliationResult.confidence_score}% | ${reconciliationResult.status} | ${reconciliationResult.recommendation} | Matched: ${reconciliationResult.matched_fields.join(', ')}`
            );

            if (reconciliationResult.discrepancies.length > 0) {
                for (const d of reconciliationResult.discrepancies) {
                    await log('DISCREPANCY_FOUND', `🚩 ${d.flag_type}: email="${d.email_value}" vs portal="${d.portal_value}" (${d.severity})`);
                }
            }

            // If reconciliation says REJECT, flag as exception immediately
            if (reconciliationResult.recommendation === 'REJECT') {
                await log('RECONCILIATION_REJECT', `Dual-source verification failed (score: ${reconciliationResult.confidence_score}%). Flagging as exception.`);
                await setStatus(invoiceId, 'EXCEPTION', {
                    match_result: 'DISCREPANCY',
                    reconciliation: reconciliationResult,
                });
                await sendExceptionAlert({
                    invoiceId,
                    vendor: emailData.vendor_name,
                    invoiceAmount: emailData.total_amount,
                    error: `Reconciliation failed: ${reconciliationResult.discrepancies.map(d => d.flag_type).join(', ')}`,
                });
                return;
            }
        } else {
            await log('RECONCILIATION_SKIP', 'Portal data unavailable — proceeding with email-only verification');
        }

        // ── STEP 4: QB PO Match ──────────────────────────────────────────
        await demoWait();
        await setStatus(invoiceId, 'MATCHING');

        const companyId = await getQBCompanyId();
        const poNumber = emailData.po_number;
        await log('QB_SEARCH', `Looking up PO ${poNumber} in QuickBooks (Company: ${companyId})`);

        const poResult = poNumber
            ? await searchPurchaseOrder(companyId, poNumber)
            : null;

        if (!poResult) {
            await log('MATCH_FAILED', `PO ${poNumber || 'N/A'} not found in QuickBooks.`);
            await setStatus(invoiceId, 'EXCEPTION', { match_result: 'PO_NOT_FOUND' });
            await sendExceptionAlert({
                invoiceId,
                vendor: emailData.vendor_name,
                invoiceAmount: emailData.total_amount,
                error: `PO ${poNumber} not found`,
            });
            return;
        }

        const poAmount = poResult.po_amount;
        const settings = await getSettings();
        const delta = Math.abs(emailData.total_amount - poAmount);
        const toleranceAmount = poAmount * settings.match_tolerance_percent / 100;
        const isMatch = delta <= toleranceAmount;

        await updateInvoice(invoiceId, {
            po_amount: poAmount,
            match_result: isMatch ? 'MATCH' : 'MISMATCH',
            match_delta: delta,
        });

        await log('PO_MATCH_RESULT', `Invoice: $${emailData.total_amount} vs PO: $${poAmount} | Delta: $${delta.toFixed(2)} | ${isMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

        // ── STEP 5: Decision ─────────────────────────────────────────────
        await demoWait();

        // Check if reconciliation flagged for human review
        const needsHumanReview = reconciliationResult?.recommendation === 'HUMAN_REVIEW';

        if (needsHumanReview) {
            await log('PENDING_REVIEW', `Dual-source partial match (score: ${reconciliationResult!.confidence_score}%). Requires human review.`);
            await setStatus(invoiceId, 'PENDING_REVIEW');
            await sendExceptionAlert({
                invoiceId,
                vendor: emailData.vendor_name,
                invoiceAmount: emailData.total_amount,
                error: `Reconciliation score ${reconciliationResult!.confidence_score}% — needs review`,
            });
            return;
        }

        if (isMatch && emailData.total_amount <= settings.auto_approve_max) {
            await log('AUTO_APPROVE', `PO match + dual-source verified. Delta: $${delta.toFixed(2)}. Creating bill in QB.`);

            const billId = await createBill(companyId, {
                vendorName: emailData.vendor_name,
                amount: emailData.total_amount,
                dueDate: emailData.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                lineItems: emailData.line_items?.length
                    ? emailData.line_items.map(li => ({ description: li.description, amount: li.total || 0 }))
                    : [{ description: `Invoice ${emailData.invoice_number}`, amount: emailData.total_amount }],
            });

            await log('BILL_CREATED', `QuickBooks bill created — ID: ${billId}`);

            const paymentDate = new Date(Date.now() + 30 * 86400000).toISOString();
            await setStatus(invoiceId, 'APPROVED', {
                qb_bill_id: billId,
                payment_scheduled_date: paymentDate,
            });

            const durationMs = Date.now() - pipelineStart;
            await log('PIPELINE_COMPLETE', `Invoice approved. Bill #${billId} created. Payment scheduled for ${paymentDate.split('T')[0]}. (${(durationMs / 1000).toFixed(1)}s) ✓`);

        } else if (isMatch && emailData.total_amount > settings.auto_approve_max) {
            await log('APPROVAL_LIMIT', `Amount $${emailData.total_amount} exceeds auto-approve limit of $${settings.auto_approve_max}. Requires human approval.`);
            await setStatus(invoiceId, 'EXCEPTION');
            await sendExceptionAlert({
                invoiceId,
                vendor: emailData.vendor_name,
                invoiceAmount: emailData.total_amount,
                poAmount,
                delta,
            });
        } else {
            await log('MATCH_FAILED', `Mismatch detected. Invoice: $${emailData.total_amount}, PO: $${poAmount}, Delta: $${delta.toFixed(2)}`);
            await setStatus(invoiceId, 'EXCEPTION');
            await sendExceptionAlert({
                invoiceId,
                vendor: emailData.vendor_name,
                invoiceAmount: emailData.total_amount,
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

