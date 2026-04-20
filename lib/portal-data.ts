// ─── AutoAP — Mock Vendor Portal Data ─────────────────────────────
// Shared invoice data used by all 3 mock vendor portal pages.
// Each portal renders this data in a different HTML layout.

export interface MockInvoice {
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
}

// Keyed by PO number for quick lookup by TinyFish
export const PORTAL_INVOICES: Record<string, MockInvoice> = {
    'PO-4521': {
        invoice_number: 'AMZ-2025-00441',
        po_number: 'PO-4521',
        vendor: 'Amazon Business',
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
    'PO-4522': {
        invoice_number: 'SB-2025-8821',
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
    'PO-4523': {
        invoice_number: 'UTIL-2025-112',
        po_number: 'PO-4523',
        vendor: 'Metro Utilities Inc',
        date: '2026-02-28',
        due_date: '2026-03-30',
        status: 'Pending',
        items: [
            { description: 'Commercial Electricity — Base Rate', qty: 1, unit_price: 2200.00, total: 2200.00 },
            { description: 'Peak Demand Surcharge', qty: 1, unit_price: 580.00, total: 580.00 },
            { description: 'Municipal Tax & Fees', qty: 1, unit_price: 420.00, total: 420.00 },
            { description: 'Renewable Energy Credit', qty: 1, unit_price: 300.00, total: 300.00 },
        ],
        subtotal: 3500.00,
        tax: 0,
        total: 3500.00,
    },
    // Fraud demo case — different amount than email claims
    'PO-4519': {
        invoice_number: 'AMZ-2025-00389',
        po_number: 'PO-4519',
        vendor: 'Amazon Business',
        date: '2026-03-05',
        due_date: '2026-04-04',
        status: 'Pending',
        items: [
            { description: 'Office Chair — Executive Mesh', qty: 4, unit_price: 310.00, total: 1240.00 },
        ],
        subtotal: 1240.00,
        tax: 0,
        total: 1240.00, // Email will claim $1500 — fraud flag!
    },
};

/**
 * Flexible PO lookup — tries exact match, PO- prefix, and stripped prefix.
 * Handles cases where Fireworks extracts "4519" but portal keys are "PO-4519".
 */
export function lookupInvoice(poQuery: string): MockInvoice | null {
    const q = poQuery.trim().toUpperCase();
    // Try exact match
    if (PORTAL_INVOICES[q]) return PORTAL_INVOICES[q];
    // Try with PO- prefix
    if (PORTAL_INVOICES[`PO-${q}`]) return PORTAL_INVOICES[`PO-${q}`];
    // Try stripping PO- prefix
    const stripped = q.replace(/^PO-?/, '');
    if (stripped !== q && PORTAL_INVOICES[stripped]) return PORTAL_INVOICES[stripped];
    return null;
}

