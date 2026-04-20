// ─── AutoAP — Phase 2 Demo Seed Script ────────────────────────────
// Seeds exactly 5 invoices covering all pipeline states + fraud demo.
// Run: npx tsx scripts/seed-demo.ts

import { config } from 'dotenv';
config({ path: '.env' });

import { MongoClient } from 'mongodb';

const DB_NAME = 'autoap';

const DEMO_INVOICES = [
    {
        // 1. Happy path — large platform vendor (VERIFIED + APPROVED)
        _id: 'inv-demo-001',
        vendor_name: 'Amazon Business',
        vendor_email: 'billing@amazon.com',
        invoice_number: 'AMZ-2025-00441',
        po_number: 'PO-4521',
        amount: 1240.00,
        po_amount: 1240.00,
        currency: 'USD',
        due_date: '2026-04-08',
        match_result: 'MATCH',
        match_delta: 0,
        status: 'APPROVED',
        qb_bill_id: 'QB-DEMO-101',
        payment_scheduled_date: '2026-05-08T00:00:00.000Z',
        vendor_id: 'amazon-business',
        line_items: [
            { description: 'Standing Desk — Electric, 60"', amount: 498.00, qty: 2 },
            { description: 'Monitor Arm — Dual, Gas Spring', amount: 358.00, qty: 4 },
            { description: 'Cable Management Kit', amount: 98.00, qty: 4 },
            { description: 'Ergonomic Keyboard Tray', amount: 286.00, qty: 2 },
        ],
        fireworks_data: {
            invoice_number: 'AMZ-2025-00441', po_number: 'PO-4521',
            vendor_name: 'Amazon Business', total_amount: 1240.00, due_date: '2026-04-08',
        },
        tinyfish_data: {
            invoice_number: 'AMZ-2025-00441', po_number: 'PO-4521',
            vendor_name: 'Amazon Business', total_amount: 1240.00, due_date: '2026-04-08',
        },
        reconciliation: {
            status: 'VERIFIED', confidence_score: 100,
            matched_fields: ['total_amount', 'po_number', 'vendor_name', 'line_items'],
            discrepancies: [], recommendation: 'AUTO_APPROVE',
            reconciled_at: new Date().toISOString(),
        },
        raw_email: 'From: billing@amazon.com\nSubject: Invoice AMZ-2025-00441\n\nPO: PO-4521\nTotal: $1,240.00',
        raw_pdf_url: null,
        portal_verified: true,
        portal_invoice_number: 'AMZ-2025-00441',
        portal_amount: 1240.00,
        agent_log: [
            { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@amazon.com' },
            { timestamp: new Date(Date.now() - 3500000).toISOString(), action: 'FIREWORKS_COMPLETE', detail: 'Extracted: Amazon Business | $1240.00 | PO: PO-4521' },
            { timestamp: new Date(Date.now() - 3400000).toISOString(), action: 'TINYFISH_PORTAL_VERIFIED', detail: 'Verified: Amazon Business | AMZ-2025-00441 | $1240.00' },
            { timestamp: new Date(Date.now() - 3300000).toISOString(), action: 'RECONCILIATION_COMPLETE', detail: 'Score: 100% | VERIFIED | AUTO_APPROVE' },
            { timestamp: new Date(Date.now() - 3200000).toISOString(), action: 'PIPELINE_COMPLETE', detail: 'Invoice approved. Bill #QB-DEMO-101 created. ✓' },
        ],
    },
    {
        // 2. Happy path — SaaS vendor (VERIFIED + APPROVED)
        _id: 'inv-demo-002',
        vendor_name: 'CloudHost Pro',
        vendor_email: 'billing@cloudhost.pro',
        invoice_number: 'SB-2025-8821',
        po_number: 'PO-4522',
        amount: 850.00,
        po_amount: 850.00,
        currency: 'USD',
        due_date: '2026-03-31',
        match_result: 'MATCH',
        match_delta: 0,
        status: 'APPROVED',
        qb_bill_id: 'QB-DEMO-102',
        payment_scheduled_date: '2026-04-30T00:00:00.000Z',
        vendor_id: 'saas-billing',
        line_items: [
            { description: 'Cloud Hosting — Pro Tier (Monthly)', amount: 650.00, qty: 1 },
            { description: 'SSL Certificate — Wildcard', amount: 120.00, qty: 1 },
            { description: 'CDN Bandwidth (500GB)', amount: 80.00, qty: 1 },
        ],
        fireworks_data: {
            invoice_number: 'SB-2025-8821', po_number: 'PO-4522',
            vendor_name: 'CloudHost Pro', total_amount: 850.00, due_date: '2026-03-31',
        },
        tinyfish_data: {
            invoice_number: 'SB-2025-8821', po_number: 'PO-4522',
            vendor_name: 'CloudHost Pro', total_amount: 850.00, due_date: '2026-03-31',
        },
        reconciliation: {
            status: 'VERIFIED', confidence_score: 100,
            matched_fields: ['total_amount', 'po_number', 'vendor_name', 'line_items'],
            discrepancies: [], recommendation: 'AUTO_APPROVE',
            reconciled_at: new Date().toISOString(),
        },
        raw_email: 'From: billing@cloudhost.pro\nSubject: Invoice SB-2025-8821\n\nPO: PO-4522\nTotal: $850.00',
        raw_pdf_url: null,
        portal_verified: true,
        portal_invoice_number: 'SB-2025-8821',
        portal_amount: 850.00,
        agent_log: [
            { timestamp: new Date(Date.now() - 7200000).toISOString(), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@cloudhost.pro' },
            { timestamp: new Date(Date.now() - 7100000).toISOString(), action: 'FIREWORKS_COMPLETE', detail: 'Extracted: CloudHost Pro | $850.00 | PO: PO-4522' },
            { timestamp: new Date(Date.now() - 7000000).toISOString(), action: 'RECONCILIATION_COMPLETE', detail: 'Score: 100% | VERIFIED | AUTO_APPROVE' },
            { timestamp: new Date(Date.now() - 6900000).toISOString(), action: 'PIPELINE_COMPLETE', detail: 'Invoice approved. Bill #QB-DEMO-102 created. ✓' },
        ],
    },
    {
        // 3. 🚨 FRAUD DEMO — email claims $1500, portal shows $1240 (DISCREPANCY)
        _id: 'inv-demo-003',
        vendor_name: 'Amazon Business',
        vendor_email: 'billing@amazon.com',
        invoice_number: 'AMZ-2025-00389',
        po_number: 'PO-4519',
        amount: 1500.00, // What the email claimed
        po_amount: null,
        currency: 'USD',
        due_date: '2026-04-04',
        match_result: 'DISCREPANCY',
        match_delta: 260.00,
        status: 'EXCEPTION',
        qb_bill_id: null,
        payment_scheduled_date: null,
        vendor_id: 'amazon-business',
        line_items: [
            { description: 'Office Chair — Executive Mesh', amount: 1500.00, qty: 4 },
        ],
        fireworks_data: {
            invoice_number: 'AMZ-2025-00389', po_number: 'PO-4519',
            vendor_name: 'Amazon Business', total_amount: 1500.00, due_date: '2026-04-04',
        },
        tinyfish_data: {
            invoice_number: 'AMZ-2025-00389', po_number: 'PO-4519',
            vendor_name: 'Amazon Business', total_amount: 1240.00, due_date: '2026-04-04',
        },
        reconciliation: {
            status: 'DISCREPANCY', confidence_score: 60,
            matched_fields: ['po_number', 'vendor_name'],
            discrepancies: [{
                field: 'total_amount',
                email_value: 1500.00,
                portal_value: 1240.00,
                delta: 260.00,
                severity: 'HIGH',
                flag_type: 'AMOUNT_MISMATCH',
            }],
            recommendation: 'REJECT',
            reconciled_at: new Date().toISOString(),
        },
        raw_email: 'From: billing@amazon.com\nSubject: Invoice AMZ-2025-00389\n\nPO: PO-4519\nTotal: $1,500.00',
        raw_pdf_url: null,
        portal_verified: true,
        portal_invoice_number: 'AMZ-2025-00389',
        portal_amount: 1240.00,
        agent_log: [
            { timestamp: new Date(Date.now() - 5400000).toISOString(), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@amazon.com' },
            { timestamp: new Date(Date.now() - 5300000).toISOString(), action: 'FIREWORKS_COMPLETE', detail: 'Extracted: Amazon Business | $1500.00 | PO: PO-4519' },
            { timestamp: new Date(Date.now() - 5200000).toISOString(), action: 'TINYFISH_PORTAL_VERIFIED', detail: 'Verified: Amazon Business | AMZ-2025-00389 | $1240.00' },
            { timestamp: new Date(Date.now() - 5100000).toISOString(), action: 'DISCREPANCY_FOUND', detail: '🚩 AMOUNT_MISMATCH: email="1500" vs portal="1240" (HIGH)' },
            { timestamp: new Date(Date.now() - 5000000).toISOString(), action: 'RECONCILIATION_REJECT', detail: 'Dual-source verification failed (score: 60%). Flagging as exception.' },
        ],
    },
    {
        // 4. Pending review — partial vendor name match (PARTIAL)
        _id: 'inv-demo-004',
        vendor_name: 'Metro Utilities Inc',
        vendor_email: 'accounts@metro-utilities.com',
        invoice_number: 'UTIL-2025-112',
        po_number: 'PO-4523',
        amount: 3500.00,
        po_amount: 3500.00,
        currency: 'USD',
        due_date: '2026-03-30',
        match_result: 'MATCH',
        match_delta: 0,
        status: 'PENDING_REVIEW',
        qb_bill_id: null,
        payment_scheduled_date: null,
        vendor_id: 'utility-portal',
        line_items: [
            { description: 'Commercial Electricity — Base Rate', amount: 2200.00, qty: 1 },
            { description: 'Peak Demand Surcharge', amount: 580.00, qty: 1 },
            { description: 'Municipal Tax & Fees', amount: 420.00, qty: 1 },
            { description: 'Renewable Energy Credit', amount: 300.00, qty: 1 },
        ],
        fireworks_data: {
            invoice_number: 'UTIL-2025-112', po_number: 'PO-4523',
            vendor_name: 'Metro Utilities', total_amount: 3500.00, due_date: '2026-03-30',
        },
        tinyfish_data: {
            invoice_number: 'UTIL-2025-112', po_number: 'PO-4523',
            vendor_name: 'Metro Utilities Inc', total_amount: 3500.00, due_date: '2026-03-30',
        },
        reconciliation: {
            status: 'PARTIAL', confidence_score: 80,
            matched_fields: ['total_amount', 'po_number', 'line_items'],
            discrepancies: [{
                field: 'vendor_name',
                email_value: 'Metro Utilities',
                portal_value: 'Metro Utilities Inc',
                severity: 'MEDIUM',
                flag_type: 'VENDOR_MISMATCH',
            }],
            recommendation: 'HUMAN_REVIEW',
            reconciled_at: new Date().toISOString(),
        },
        raw_email: 'From: accounts@metro-utilities.com\nSubject: Invoice UTIL-2025-112\n\nPO: PO-4523\nTotal: $3,500.00',
        raw_pdf_url: null,
        portal_verified: true,
        portal_invoice_number: 'UTIL-2025-112',
        portal_amount: 3500.00,
        agent_log: [
            { timestamp: new Date(Date.now() - 1800000).toISOString(), action: 'EMAIL_DETECTED', detail: 'Invoice received from accounts@metro-utilities.com' },
            { timestamp: new Date(Date.now() - 1700000).toISOString(), action: 'RECONCILIATION_COMPLETE', detail: 'Score: 80% | PARTIAL | HUMAN_REVIEW' },
            { timestamp: new Date(Date.now() - 1600000).toISOString(), action: 'PENDING_REVIEW', detail: 'Dual-source partial match. Requires human review.' },
        ],
    },
    {
        // 5. Exception — portal scrape failed (tests error path)
        _id: 'inv-demo-005',
        vendor_name: 'CloudHost Pro',
        vendor_email: 'billing@cloudhost.pro',
        invoice_number: 'SB-2025-9001',
        po_number: 'PO-4525',
        amount: 450.00,
        po_amount: null,
        currency: 'USD',
        due_date: '2026-04-15',
        match_result: null,
        match_delta: null,
        status: 'EXCEPTION',
        qb_bill_id: null,
        payment_scheduled_date: null,
        vendor_id: 'saas-billing',
        line_items: [
            { description: 'Cloud Hosting — Starter Tier', amount: 450.00, qty: 1 },
        ],
        fireworks_data: {
            invoice_number: 'SB-2025-9001', po_number: 'PO-4525',
            vendor_name: 'CloudHost Pro', total_amount: 450.00, due_date: '2026-04-15',
        },
        tinyfish_data: null,
        reconciliation: null,
        raw_email: 'From: billing@cloudhost.pro\nSubject: Invoice SB-2025-9001\n\nPO: PO-4525\nTotal: $450.00',
        raw_pdf_url: null,
        portal_verified: false,
        agent_log: [
            { timestamp: new Date(Date.now() - 900000).toISOString(), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@cloudhost.pro' },
            { timestamp: new Date(Date.now() - 800000).toISOString(), action: 'FIREWORKS_COMPLETE', detail: 'Extracted: CloudHost Pro | $450.00 | PO: PO-4525' },
            { timestamp: new Date(Date.now() - 700000).toISOString(), action: 'PORTAL_SCRAPE_ERROR', detail: '⚠️ Portal scrape failed: Connection timeout' },
            { timestamp: new Date(Date.now() - 600000).toISOString(), action: 'RECONCILIATION_SKIP', detail: 'Portal data unavailable — single-source only' },
        ],
    },
];

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(DB_NAME);
    const col = db.collection('invoices');

    // Clear existing demo invoices
    const deleteResult = await col.deleteMany({
        _id: { $regex: /^inv-demo-/ },
    } as any);
    console.log(`🧹 Cleared ${deleteResult.deletedCount} old demo invoices`);

    // Also clear any test CloudHost Pro invoices
    const testResult = await col.deleteMany({ vendor_name: 'CloudHost Pro' });
    if (testResult.deletedCount > 0) {
        console.log(`🧹 Cleared ${testResult.deletedCount} test CloudHost invoices`);
    }

    const now = new Date().toISOString();
    const docsToInsert = DEMO_INVOICES.map(inv => ({
        ...inv,
        created_at: inv.agent_log?.[0]?.timestamp || now,
        updated_at: now,
    }));

    await col.insertMany(docsToInsert as any[]);
    console.log(`\n✅ Seeded ${docsToInsert.length} demo invoices:\n`);

    for (const inv of docsToInsert) {
        const icon = inv.status === 'APPROVED' ? '✅' :
                     inv.status === 'EXCEPTION' ? '🚨' :
                     inv.status === 'PENDING_REVIEW' ? '⏳' : '📄';
        const score = inv.reconciliation?.confidence_score;
        console.log(`   ${icon} ${inv.invoice_number} | ${inv.vendor_name} | $${inv.amount} | ${inv.status}${score != null ? ` (${score}%)` : ''}`);
    }

    await client.close();
    console.log('\n✅ Demo data ready!');
}

main().catch(console.error);
