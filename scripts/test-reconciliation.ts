// ─── Reconciliation Engine Unit Tests ─────────────────────────────
// Run: npx tsx scripts/test-reconciliation.ts

import { reconcile, ParsedInvoice } from '../lib/reconciliation';

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
    } catch (err) {
        console.log(`  ❌ ${name}: ${err}`);
    }
}

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
}

console.log('\n─── Reconciliation Engine Tests ───\n');

// Test 1: Perfect match → VERIFIED, score ≥ 95, AUTO_APPROVE
test('Perfect match → VERIFIED (98+)', () => {
    const email: ParsedInvoice = {
        invoice_number: 'AMZ-2025-00441',
        po_number: 'PO-4521',
        vendor_name: 'Amazon Business',
        total_amount: 1240.00,
        due_date: '2026-04-08',
        line_items: [
            { description: 'Standing Desk', total: 498.00 },
            { description: 'Monitor Arm', total: 358.00 },
        ],
    };
    const portal: ParsedInvoice = {
        invoice_number: 'AMZ-2025-00441',
        po_number: 'PO-4521',
        vendor_name: 'Amazon Business',
        total_amount: 1240.00,
        due_date: '2026-04-08',
        line_items: [
            { description: 'Standing Desk', total: 498.00 },
            { description: 'Monitor Arm', total: 358.00 },
        ],
    };

    const result = reconcile(email, portal);
    console.log(`    Score: ${result.confidence_score}, Status: ${result.status}, Rec: ${result.recommendation}`);
    assert(result.status === 'VERIFIED', `Expected VERIFIED, got ${result.status}`);
    assert(result.confidence_score >= 95, `Expected ≥95, got ${result.confidence_score}`);
    assert(result.recommendation === 'AUTO_APPROVE', `Expected AUTO_APPROVE, got ${result.recommendation}`);
    assert(result.discrepancies.length === 0, `Expected 0 discrepancies, got ${result.discrepancies.length}`);
});

// Test 2: Amount mismatch → DISCREPANCY, score < 70, REJECT
test('Amount mismatch ($1500 vs $1240) → DISCREPANCY', () => {
    const email: ParsedInvoice = {
        invoice_number: 'AMZ-2025-00389',
        po_number: 'PO-4519',
        vendor_name: 'Amazon Business',
        total_amount: 1500.00,
        due_date: '2026-04-08',
    };
    const portal: ParsedInvoice = {
        invoice_number: 'AMZ-2025-00389',
        po_number: 'PO-4519',
        vendor_name: 'Amazon Business',
        total_amount: 1240.00,
        due_date: '2026-04-08',
    };

    const result = reconcile(email, portal);
    console.log(`    Score: ${result.confidence_score}, Status: ${result.status}, Rec: ${result.recommendation}`);
    console.log(`    Discrepancies: ${result.discrepancies.map(d => d.flag_type).join(', ')}`);
    assert(result.status === 'DISCREPANCY', `Expected DISCREPANCY, got ${result.status}`);
    assert(result.confidence_score < 70, `Expected <70, got ${result.confidence_score}`);
    assert(result.recommendation === 'REJECT', `Expected REJECT, got ${result.recommendation}`);
    assert(result.discrepancies.some(d => d.flag_type === 'AMOUNT_MISMATCH'), 'Missing AMOUNT_MISMATCH flag');
});

// Test 3: Vendor name slight diff → PARTIAL, 70-94, HUMAN_REVIEW
test('Vendor mismatch ("Acme Corp" vs "ACME Corporation") → PARTIAL', () => {
    const email: ParsedInvoice = {
        invoice_number: 'UTIL-2025-112',
        po_number: 'PO-4523',
        vendor_name: 'Acme Corp',
        total_amount: 3500.00,
        due_date: '2026-03-30',
    };
    const portal: ParsedInvoice = {
        invoice_number: 'UTIL-2025-112',
        po_number: 'PO-4523',
        vendor_name: 'Totally Different Company',
        total_amount: 3500.00,
        due_date: '2026-03-30',
    };

    const result = reconcile(email, portal);
    console.log(`    Score: ${result.confidence_score}, Status: ${result.status}, Rec: ${result.recommendation}`);
    console.log(`    Matched: ${result.matched_fields.join(', ')}`);
    console.log(`    Discrepancies: ${result.discrepancies.map(d => `${d.flag_type} (${d.severity})`).join(', ')}`);
    assert(result.status === 'PARTIAL', `Expected PARTIAL, got ${result.status}`);
    assert(result.confidence_score >= 70 && result.confidence_score <= 94, `Expected 70-94, got ${result.confidence_score}`);
    assert(result.recommendation === 'HUMAN_REVIEW', `Expected HUMAN_REVIEW, got ${result.recommendation}`);
});

console.log('\n─── All tests complete ───\n');
