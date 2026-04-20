// ─── Amazon Business Mock Portal ──────────────────────────────────
// Layout: Table-based search results, prominent search bar.
// Archetype: Large e-commerce platform with multi-line-item invoices.

import { NextRequest, NextResponse } from 'next/server';
import { lookupInvoice } from '@/lib/portal-data';

export async function GET(req: NextRequest) {
    const po = new URL(req.url).searchParams.get('po');

    // Build the HTML directly — TinyFish navigates this as a real browser page
    const invoice = po ? lookupInvoice(po) : null;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amazon Business — Invoice Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Amazon Ember', Arial, sans-serif; background: #232f3e; color: #0f1111; min-height: 100vh; }
        .header { background: #131921; padding: 12px 24px; display: flex; align-items: center; gap: 16px; }
        .header h1 { color: #ff9900; font-size: 22px; font-weight: 700; }
        .header span { color: #ccc; font-size: 13px; }
        .search-bar { background: #37475a; padding: 20px 24px; display: flex; gap: 12px; align-items: center; }
        .search-bar label { color: #fff; font-size: 14px; font-weight: 600; white-space: nowrap; }
        .search-bar input { flex: 1; padding: 10px 14px; border: 2px solid #ff9900; border-radius: 4px; font-size: 15px; outline: none; }
        .search-bar input:focus { border-color: #febd69; box-shadow: 0 0 0 3px rgba(255,153,0,0.3); }
        .search-bar button { background: #ff9900; color: #0f1111; border: none; padding: 10px 24px; border-radius: 4px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .search-bar button:hover { background: #febd69; }
        .content { max-width: 900px; margin: 24px auto; padding: 0 24px; }
        .no-result { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 40px; text-align: center; color: #565959; }
        .invoice-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .invoice-header { background: #f0f2f2; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; }
        .invoice-header h2 { font-size: 18px; color: #0f1111; }
        .badge { background: #067d62; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .meta-row { display: flex; gap: 32px; padding: 16px 20px; border-bottom: 1px solid #eee; font-size: 14px; }
        .meta-row dt { color: #565959; }
        .meta-row dd { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f7f8f8; text-align: left; padding: 10px 20px; font-size: 12px; text-transform: uppercase; color: #565959; border-bottom: 2px solid #ddd; }
        td { padding: 12px 20px; border-bottom: 1px solid #eee; font-size: 14px; }
        .amount { text-align: right; }
        .total-row { background: #f0f2f2; }
        .total-row td { font-weight: 700; font-size: 16px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>amazon</h1><span>business</span>
        <span style="margin-left:auto;color:#999;font-size:12px;">Invoice Portal</span>
    </div>
    <form class="search-bar" action="/vendor-portal/amazon-business" method="GET">
        <label for="po-search">Search by PO Number</label>
        <input type="text" id="po-search" name="po" placeholder="e.g. PO-4521" value="${po || ''}" />
        <button type="submit">Search</button>
    </form>
    <div class="content">
        ${!po ? '<div class="no-result">Enter a PO number above to search for invoices.</div>' : ''}
        ${po && !invoice ? '<div class="no-result">No invoice found for PO <strong>' + po + '</strong>.</div>' : ''}
        ${invoice ? `
        <div class="invoice-card">
            <div class="invoice-header">
                <h2>Invoice ${invoice.invoice_number}</h2>
                <span class="badge">${invoice.status}</span>
            </div>
            <div class="meta-row">
                <div><dt>Vendor</dt><dd>${invoice.vendor}</dd></div>
                <div><dt>PO Number</dt><dd>${invoice.po_number}</dd></div>
                <div><dt>Invoice Date</dt><dd>${invoice.date}</dd></div>
                <div><dt>Due Date</dt><dd>${invoice.due_date}</dd></div>
            </div>
            <table>
                <thead><tr><th>Item</th><th>Qty</th><th class="amount">Unit Price</th><th class="amount">Total</th></tr></thead>
                <tbody>
                    ${invoice.items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.qty}</td>
                        <td class="amount">$${item.unit_price.toFixed(2)}</td>
                        <td class="amount">$${item.total.toFixed(2)}</td>
                    </tr>`).join('')}
                    <tr class="total-row">
                        <td colspan="3">Total</td>
                        <td class="amount">$${invoice.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>` : ''}
    </div>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
    });
}
