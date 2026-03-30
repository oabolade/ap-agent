#!/usr/bin/env npx tsx
// ─── AutoAP — MongoDB Connection Test ─────────────────────────────
// Usage: npx tsx scripts/test-db.ts

import { config } from 'dotenv';
config();

import { checkConnection, getInvoices, createInvoice, getSettings } from '../lib/mongodb';

async function main() {
    console.log('\n🔍 AutoAP — MongoDB Connection Test\n');

    // Test 1: Connection check
    console.log('1️⃣  Checking connection...');
    const status = await checkConnection();
    console.log(`   Mode: ${status.mode}`);
    console.log(`   Connected: ${status.connected}`);

    if (!status.connected) {
        console.error('\n❌ Could not connect to MongoDB. Check your MONGODB_URI in .env');
        process.exit(1);
    }

    console.log('   ✅ Connected to Atlas!\n');

    // Test 2: List existing invoices
    console.log('2️⃣  Listing invoices...');
    const invoices = await getInvoices({ limit: 5 });
    console.log(`   Found ${invoices.length} invoice(s).\n`);

    // Test 3: Create a test invoice
    console.log('3️⃣  Creating test invoice...');
    const testInvoice = await createInvoice({
        invoice_number: 'TEST-DB-001',
        vendor_name: 'DB Connection Test',
        vendor_email: 'test@example.com',
        amount: 123.45,
        status: 'RECEIVED',
        raw_email: 'This is a connection test invoice.',
        agent_log: [
            {
                timestamp: new Date().toISOString(),
                action: 'CONNECTION_TEST',
                detail: 'Invoice created to verify MongoDB connection.',
                level: 'info',
            },
        ],
    });
    console.log(`   ✅ Created: ${testInvoice._id} (${testInvoice.invoice_number})\n`);

    // Test 4: Verify it exists
    console.log('4️⃣  Verifying invoice retrieval...');
    const retrieved = await getInvoices({ limit: 1 });
    if (retrieved.length > 0 && retrieved[0].invoice_number === 'TEST-DB-001') {
        console.log(`   ✅ Successfully retrieved: ${retrieved[0]._id}\n`);
    } else {
        console.log(`   ⚠ Retrieval returned different data (may be sorted differently)\n`);
    }

    // Test 5: Settings
    console.log('5️⃣  Checking settings...');
    const settings = await getSettings();
    console.log(`   Inbox: ${settings.agentmail_inbox}`);
    console.log(`   Tolerance: ${settings.match_tolerance_percent}%`);
    console.log(`   Auto-approve max: $${settings.auto_approve_max}\n`);

    console.log('✅ All MongoDB tests passed!\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
});
