#!/usr/bin/env tsx
// ─── AutoAP — Pipeline Step Tester ────────────────────────────────
// Tests each pipeline step individually using a real invoice.
// Usage: npx tsx scripts/test-pipeline-steps.ts [step]
// Steps: parse | qb-search | qb-bill | all

import 'dotenv/config';

const REAL_EMAIL = `Please find attached our invoice #TEST-E2E-002 for office supplies. Amount
due: $1,240.00. PO: PO-4521. Due date: March 30, 2026.`;

// ─── Step 1: Test Fireworks.ai Parsing ────────────────────────────
async function testParsing() {
    console.log('\n🔍 STEP 2: Fireworks.ai Invoice Parsing');
    console.log('─'.repeat(50));

    const { parseInvoice } = await import('../lib/fireworks');

    console.log('  Input:', REAL_EMAIL.slice(0, 80) + '...');
    console.log('  Sending to Fireworks.ai...\n');

    const parsed = await parseInvoice(REAL_EMAIL);

    console.log('  ✅ Parsed result:');
    console.log(JSON.stringify(parsed, null, 2));
    console.log(`\n  Vendor:  ${parsed.vendor_name}`);
    console.log(`  Invoice: ${parsed.invoice_number}`);
    console.log(`  Amount:  $${parsed.total_amount}`);
    console.log(`  PO:      ${parsed.po_number}`);
    console.log(`  Due:     ${parsed.due_date}`);

    return parsed;
}

// ─── Step 2: Test QuickBooks PO Search ────────────────────────────
async function testQBSearch(poNumber: string) {
    console.log('\n🔍 STEP 3-5: QuickBooks PO Search');
    console.log('─'.repeat(50));

    const { searchPurchaseOrder, getQBCompanyId } = await import('../lib/quickbooks');

    const companyId = await getQBCompanyId();
    console.log(`  Company ID: ${companyId}`);
    console.log(`  Searching PO: ${poNumber}...\n`);

    const result = await searchPurchaseOrder(companyId, poNumber);

    if (result) {
        console.log('  ✅ PO found!');
        console.log(`  PO Amount: $${result.po_amount}`);
        console.log(`  PO ID: ${result.po_id}`);
    } else {
        console.log('  ⚠️ PO not found in QuickBooks sandbox.');
        console.log('  This is expected if sandbox doesn\'t have demo POs yet.');
    }

    return result;
}

// ─── Step 3: Test QuickBooks Bill Creation ────────────────────────
async function testQBBill() {
    console.log('\n🔍 STEP 6: QuickBooks Bill Creation');
    console.log('─'.repeat(50));

    const { createBill, getQBCompanyId } = await import('../lib/quickbooks');

    const companyId = await getQBCompanyId();
    console.log(`  Company ID: ${companyId}`);
    console.log('  Creating test bill...\n');

    const billId = await createBill(companyId, {
        vendorName: 'Test Vendor (Pipeline Test)',
        amount: 100.00,
        dueDate: '2026-04-10',
        lineItems: [
            { description: 'Pipeline test item', amount: 100.00 },
        ],
    });

    console.log(`  ✅ Bill created! ID: ${billId}`);
    return billId;
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
    const step = process.argv[2] || 'parse';
    console.log('\n🧪 AutoAP — Pipeline Step Tester');
    console.log('═'.repeat(50));

    try {
        if (step === 'parse' || step === 'all') {
            const parsed = await testParsing();

            if (step === 'all' && parsed.po_number) {
                const po = await testQBSearch(parsed.po_number);
                if (po) {
                    // Don't auto-create bill in test mode
                    console.log('\n  ℹ️  Skipping bill creation in test mode.');
                    console.log('  Run with "qb-bill" arg to test bill creation separately.');
                }
            }
        }

        if (step === 'qb-search') {
            await testQBSearch('PO-4521');
        }

        if (step === 'qb-bill') {
            await testQBBill();
        }

        console.log('\n✅ Test complete!\n');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

main();
