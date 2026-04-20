// ─── AutoAP — Dual-Source Reconciliation Engine ──────────────────
// Compares Fireworks AI (email) output against TinyFish (portal) output.
// Produces a confidence score and recommendation for each invoice.

// ─── Types ───────────────────────────────────────────────────────

export interface ParsedInvoice {
    invoice_number: string;
    po_number: string;
    vendor_name: string;
    total_amount: number;
    due_date: string;
    line_items?: Array<{
        description: string;
        quantity?: number;
        unit_price?: number;
        total: number;
    }>;
}

export interface Discrepancy {
    field: string;
    email_value: string | number;
    portal_value: string | number;
    delta?: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    flag_type:
        | 'AMOUNT_MISMATCH'
        | 'VENDOR_MISMATCH'
        | 'LINE_ITEM_FRAUD'
        | 'DATE_MISMATCH'
        | 'PO_MISMATCH';
}

export interface ReconciliationResult {
    status: 'VERIFIED' | 'DISCREPANCY' | 'PARTIAL';
    confidence_score: number; // 0–100
    matched_fields: string[];
    discrepancies: Discrepancy[];
    recommendation: 'AUTO_APPROVE' | 'HUMAN_REVIEW' | 'REJECT';
    reconciled_at: Date;
}

// ─── Fuzzy String Matching ───────────────────────────────────────

/**
 * Compute Levenshtein distance between two strings.
 * Returns a similarity ratio from 0 (completely different) to 1 (identical).
 */
function levenshteinSimilarity(a: string, b: string): number {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const len1 = s1.length;
    const len2 = s2.length;

    // Use two rows instead of full matrix for memory efficiency
    let prev = Array.from({ length: len2 + 1 }, (_, i) => i);
    let curr = new Array(len2 + 1);

    for (let i = 1; i <= len1; i++) {
        curr[0] = i;
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,      // deletion
                curr[j - 1] + 1,   // insertion
                prev[j - 1] + cost // substitution
            );
        }
        [prev, curr] = [curr, prev]; // swap rows
    }

    const distance = prev[len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
}

// ─── Field Matching ──────────────────────────────────────────────

const FIELD_WEIGHTS = {
    total_amount: 40,
    po_number: 25,
    vendor_name: 20,
    line_items: 15,
} as const;

const AMOUNT_TOLERANCE = 0.02; // 2% tolerance
const VENDOR_FUZZY_THRESHOLD = 0.8;

function matchAmount(
    emailAmt: number,
    portalAmt: number
): { matched: boolean; delta: number } {
    const delta = Math.abs(emailAmt - portalAmt);
    const tolerance = Math.max(emailAmt, portalAmt) * AMOUNT_TOLERANCE;
    return { matched: delta <= tolerance, delta };
}

function matchPO(emailPO: string, portalPO: string): boolean {
    return emailPO.trim().toUpperCase() === portalPO.trim().toUpperCase();
}

function matchVendor(
    emailVendor: string,
    portalVendor: string
): { matched: boolean; similarity: number } {
    const similarity = levenshteinSimilarity(emailVendor, portalVendor);
    return { matched: similarity >= VENDOR_FUZZY_THRESHOLD, similarity };
}

function matchLineItems(
    emailItems: ParsedInvoice['line_items'],
    portalItems: ParsedInvoice['line_items']
): { matched: boolean; detail: string } {
    if (!emailItems?.length || !portalItems?.length) {
        return { matched: true, detail: 'Line items not available — skipped (no penalty)' };
    }

    if (emailItems.length !== portalItems.length) {
        return {
            matched: false,
            detail: `Count mismatch: email has ${emailItems.length}, portal has ${portalItems.length}`,
        };
    }

    // Sort by total for comparison
    const eSorted = [...emailItems].sort((a, b) => a.total - b.total);
    const pSorted = [...portalItems].sort((a, b) => a.total - b.total);

    for (let i = 0; i < eSorted.length; i++) {
        const delta = Math.abs(eSorted[i].total - pSorted[i].total);
        if (delta > eSorted[i].total * AMOUNT_TOLERANCE) {
            return {
                matched: false,
                detail: `Item ${i + 1} amount mismatch: $${eSorted[i].total} vs $${pSorted[i].total}`,
            };
        }
    }

    return { matched: true, detail: 'All line items verified' };
}

// ─── Main Reconciliation Function ────────────────────────────────

export function reconcile(
    emailData: ParsedInvoice,
    portalData: ParsedInvoice
): ReconciliationResult {
    const matched_fields: string[] = [];
    const discrepancies: Discrepancy[] = [];
    let score = 100;

    // 1. Total Amount (40 pts)
    const amountResult = matchAmount(emailData.total_amount, portalData.total_amount);
    if (amountResult.matched) {
        matched_fields.push('total_amount');
    } else {
        score -= FIELD_WEIGHTS.total_amount;
        discrepancies.push({
            field: 'total_amount',
            email_value: emailData.total_amount,
            portal_value: portalData.total_amount,
            delta: amountResult.delta,
            severity: amountResult.delta > portalData.total_amount * 0.1 ? 'HIGH' : 'MEDIUM',
            flag_type: 'AMOUNT_MISMATCH',
        });
    }

    // 2. PO Number (25 pts)
    if (matchPO(emailData.po_number, portalData.po_number)) {
        matched_fields.push('po_number');
    } else {
        score -= FIELD_WEIGHTS.po_number;
        discrepancies.push({
            field: 'po_number',
            email_value: emailData.po_number,
            portal_value: portalData.po_number,
            severity: 'HIGH',
            flag_type: 'PO_MISMATCH',
        });
    }

    // 3. Vendor Name (20 pts)
    const vendorResult = matchVendor(emailData.vendor_name, portalData.vendor_name);
    if (vendorResult.matched) {
        matched_fields.push('vendor_name');
    } else {
        score -= FIELD_WEIGHTS.vendor_name;
        discrepancies.push({
            field: 'vendor_name',
            email_value: emailData.vendor_name,
            portal_value: portalData.vendor_name,
            severity: vendorResult.similarity < 0.5 ? 'HIGH' : 'MEDIUM',
            flag_type: 'VENDOR_MISMATCH',
        });
    }

    // 4. Line Items (15 pts — bonus scoring, no penalty if unavailable)
    const lineResult = matchLineItems(emailData.line_items, portalData.line_items);
    if (lineResult.matched) {
        matched_fields.push('line_items');
    } else {
        // Only penalize if both sources provided line items and they disagree
        if (emailData.line_items?.length && portalData.line_items?.length) {
            score -= FIELD_WEIGHTS.line_items;
            discrepancies.push({
                field: 'line_items',
                email_value: lineResult.detail,
                portal_value: lineResult.detail,
                severity: 'MEDIUM',
                flag_type: 'LINE_ITEM_FRAUD',
            });
        }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine recommendation
    let recommendation: ReconciliationResult['recommendation'];
    if (score >= 95) recommendation = 'AUTO_APPROVE';
    else if (score >= 70) recommendation = 'HUMAN_REVIEW';
    else recommendation = 'REJECT';

    // Determine status
    let status: ReconciliationResult['status'];
    if (score >= 95) status = 'VERIFIED';
    else if (score >= 70) status = 'PARTIAL';
    else status = 'DISCREPANCY';

    return {
        status,
        confidence_score: score,
        matched_fields,
        discrepancies,
        recommendation,
        reconciled_at: new Date(),
    };
}
