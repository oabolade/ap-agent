#!/usr/bin/env tsx
// ─── AutoAP — Create Demo POs in QuickBooks Sandbox ───────────────
// Creates sample Purchase Orders for the 3-way match demo.
// Usage: npx tsx scripts/seed-qb-pos.ts

import 'dotenv/config';
import { getQBToken, getQBCompanyId, findOrCreateVendor } from '../lib/quickbooks';

const QB_SANDBOX_BASE = 'https://sandbox-quickbooks.api.intuit.com/v3/company';

const DEMO_POS = [
    {
        docNumber: 'PO-4521',
        vendorName: 'Acme Office Supplies',
        amount: 1240.00,
        line: 'Standing desks x2 + Monitor arms x4',
    },
    {
        docNumber: 'PO-4522',
        vendorName: 'CloudHost Pro',
        amount: 850.00,
        line: 'Cloud hosting — Pro tier (monthly)',
    },
    {
        docNumber: 'PO-4523',
        vendorName: 'Design Studio Co',
        amount: 3500.00,
        line: 'Brand refresh — Phase 1 + Logo variations',
    },
];

async function getFirstCustomer(companyId: string, token: string): Promise<{ value: string; name: string }> {
    const q = encodeURIComponent('SELECT Id, DisplayName FROM Customer MAXRESULTS 1');
    const res = await fetch(`${QB_SANDBOX_BASE}/${companyId}/query?query=${q}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const data = await res.json();
    const c = data.QueryResponse?.Customer?.[0];
    if (c) return { value: c.Id, name: c.DisplayName };
    return { value: '1', name: 'Customer' };
}

async function createPurchaseOrder(
    companyId: string,
    po: (typeof DEMO_POS)[0],
    customerRef: { value: string; name: string }
) {
    const token = await getQBToken();
    const vendorRef = await findOrCreateVendor(companyId, po.vendorName);

    // Use "Services" item (id=2) which exists in most QB sandboxes
    const poData = {
        DocNumber: po.docNumber,
        VendorRef: vendorRef,
        APAccountRef: { value: '33', name: 'Accounts Payable (A/P)' },
        Line: [
            {
                Amount: po.amount,
                DetailType: 'ItemBasedExpenseLineDetail',
                Description: po.line,
                ItemBasedExpenseLineDetail: {
                    ItemRef: { value: '15', name: 'Soil' },
                    CustomerRef: customerRef,
                    Qty: 1,
                    UnitPrice: po.amount,
                },
            },
        ],
        TotalAmt: po.amount,
    };

    const response = await fetch(
        `${QB_SANDBOX_BASE}/${companyId}/purchaseorder`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(poData),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        if (errText.includes('Duplicate Document Number')) {
            console.log(`  ⚠️  ${po.docNumber} already exists — skipping`);
            return;
        }
        throw new Error(`QB PO create error: ${response.status} ${errText}`);
    }

    const result = await response.json();
    console.log(`  ✅ ${po.docNumber} — $${po.amount} (${po.vendorName}) → QB ID: ${result.PurchaseOrder.Id}`);
}

async function main() {
    console.log('\n🏗️  AutoAP — Seeding Demo POs in QuickBooks Sandbox');
    console.log('═'.repeat(50));

    const companyId = await getQBCompanyId();
    const token = await getQBToken();
    const customerRef = await getFirstCustomer(companyId, token);
    console.log(`  Company: ${companyId}`);
    console.log(`  Customer: ${customerRef.name} (${customerRef.value})\n`);

    for (const po of DEMO_POS) {
        try {
            await createPurchaseOrder(companyId, po, customerRef);
        } catch (error) {
            console.error(`  ❌ Failed to create ${po.docNumber}:`, error);
        }
    }

    console.log('\n✅ Done! POs are ready for 3-way match testing.\n');
}

main().catch(e => { console.error(e); process.exit(1); });
