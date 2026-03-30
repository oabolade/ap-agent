// ─── Mock Vendor Portal — API ─────────────────────────────────────
// Returns invoice data for the mock "Acme Office Supplies" vendor portal.
// Used by TinyFish to demonstrate web agent navigation.

import { NextRequest, NextResponse } from 'next/server';

// Simulated vendor invoice database
const VENDOR_INVOICES: Record<string, {
    invoice_number: string;
    po_number: string;
    vendor: string;
    date: string;
    due_date: string;
    status: string;
    items: Array<{ description: string; qty: number; unit_price: number; total: number }>;
    subtotal: number;
    tax: number;
    total: number;
}> = {
    'INV-2026-042': {
        invoice_number: 'INV-2026-042',
        po_number: 'PO-4521',
        vendor: 'Acme Office Supplies',
        date: '2026-03-09',
        due_date: '2026-04-08',
        status: 'Pending',
        items: [
            { description: 'Standing Desk — Electric, 60"', qty: 2, unit_price: 249.00, total: 498.00 },
            { description: 'Monitor Arm — Dual, Gas Spring', qty: 4, unit_price: 89.50, total: 358.00 },
            { description: 'Cable Management Kit', qty: 4, unit_price: 24.50, total: 98.00 },
            { description: 'Ergonomic Keyboard Tray', qty: 2, unit_price: 143.00, total: 286.00 },
        ],
        subtotal: 1240.00,
        tax: 0,
        total: 1240.00,
    },
    'INV-2026-043': {
        invoice_number: 'INV-2026-043',
        po_number: 'PO-4522',
        vendor: 'CloudHost Pro',
        date: '2026-03-01',
        due_date: '2026-03-31',
        status: 'Pending',
        items: [
            { description: 'Cloud Hosting — Pro Tier (Monthly)', qty: 1, unit_price: 650.00, total: 650.00 },
            { description: 'SSL Certificate — Wildcard', qty: 1, unit_price: 120.00, total: 120.00 },
            { description: 'CDN Bandwidth (500GB)', qty: 1, unit_price: 80.00, total: 80.00 },
        ],
        subtotal: 850.00,
        tax: 0,
        total: 850.00,
    },
    'INV-2026-044': {
        invoice_number: 'INV-2026-044',
        po_number: 'PO-4523',
        vendor: 'Design Studio Co',
        date: '2026-02-28',
        due_date: '2026-03-30',
        status: 'Pending',
        items: [
            { description: 'Brand Refresh — Phase 1', qty: 1, unit_price: 2500.00, total: 2500.00 },
            { description: 'Logo Variation Pack (6 variants)', qty: 1, unit_price: 750.00, total: 750.00 },
            { description: 'Brand Guidelines Document', qty: 1, unit_price: 250.00, total: 250.00 },
        ],
        subtotal: 3500.00,
        tax: 0,
        total: 3500.00,
    },
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const invoiceNumber = searchParams.get('invoice');
    const poNumber = searchParams.get('po');

    if (invoiceNumber) {
        const inv = VENDOR_INVOICES[invoiceNumber.toUpperCase()];
        if (inv) {
            return NextResponse.json({ success: true, invoice: inv });
        }
        return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (poNumber) {
        const inv = Object.values(VENDOR_INVOICES).find(
            i => i.po_number.toUpperCase() === poNumber.toUpperCase()
        );
        if (inv) {
            return NextResponse.json({ success: true, invoice: inv });
        }
        return NextResponse.json({ success: false, error: 'No invoice found for this PO' }, { status: 404 });
    }

    // Return all invoices
    return NextResponse.json({
        success: true,
        invoices: Object.values(VENDOR_INVOICES),
    });
}
