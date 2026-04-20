// ─── CloudHost Pro (SaaS) Mock Portal ─────────────────────────────
// Layout: Modern card-based SaaS billing portal.
// Archetype: Single recurring subscription line item.

import { NextRequest, NextResponse } from 'next/server';
import { lookupInvoice } from '@/lib/portal-data';

export async function GET(req: NextRequest) {
    const po = new URL(req.url).searchParams.get('po');
    const invoice = po ? lookupInvoice(po) : null;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudHost Pro — Billing</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #e0e0e0; min-height: 100vh; }
        .nav { padding: 16px 32px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .nav .logo { font-size: 20px; font-weight: 700; color: #00d4ff; }
        .nav .tag { font-size: 11px; background: rgba(0,212,255,0.15); color: #00d4ff; padding: 2px 8px; border-radius: 10px; }
        .search-section { max-width: 520px; margin: 48px auto 0; text-align: center; }
        .search-section h2 { font-size: 28px; font-weight: 300; margin-bottom: 8px; }
        .search-section p { color: #888; font-size: 14px; margin-bottom: 24px; }
        .search-form { display: flex; gap: 8px; }
        .search-form input { flex: 1; padding: 12px 16px; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; background: rgba(255,255,255,0.05); color: #fff; font-size: 15px; outline: none; transition: border-color 0.2s; }
        .search-form input:focus { border-color: #00d4ff; }
        .search-form button { background: linear-gradient(135deg, #00d4ff, #0099cc); color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform 0.15s; }
        .search-form button:hover { transform: scale(1.02); }
        .result-area { max-width: 520px; margin: 32px auto; }
        .empty { text-align: center; color: #666; padding: 40px; }
        .invoice-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; backdrop-filter: blur(8px); }
        .card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
        .card-header h3 { font-size: 18px; font-weight: 600; color: #fff; }
        .status-pill { background: rgba(0,212,255,0.15); color: #00d4ff; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .card-body { padding: 0 24px 24px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .meta-item span { display: block; }
        .meta-item .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
        .meta-item .value { font-size: 15px; font-weight: 500; color: #fff; }
        .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 20px 0; }
        .line-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .line-item .desc { color: #ccc; }
        .line-item .amt { color: #fff; font-weight: 500; }
        .total-line { display: flex; justify-content: space-between; padding: 16px 0 0; border-top: 1px solid rgba(255,255,255,0.15); margin-top: 8px; }
        .total-line .label { font-size: 16px; font-weight: 600; color: #fff; }
        .total-line .amt { font-size: 24px; font-weight: 700; color: #00d4ff; }
        .period { font-size: 12px; color: #888; margin-top: 4px; }
    </style>
</head>
<body>
    <div class="nav">
        <span class="logo">CloudHost</span><span class="tag">PRO</span>
        <span style="margin-left:auto;font-size:12px;color:#666;">Billing Portal</span>
    </div>
    <div class="search-section">
        <h2>Find Invoice</h2>
        <p>Enter your PO or invoice number to view billing details</p>
        <form class="search-form" action="/vendor-portal/saas-billing" method="GET">
            <input type="text" name="po" placeholder="PO-4522" value="${po || ''}" />
            <button type="submit">Look Up</button>
        </form>
    </div>
    <div class="result-area">
        ${!po ? '<div class="empty">Your invoice details will appear here.</div>' : ''}
        ${po && !invoice ? '<div class="empty">No invoice found for <strong>' + po + '</strong></div>' : ''}
        ${invoice ? `
        <div class="invoice-card">
            <div class="card-header">
                <h3>${invoice.invoice_number}</h3>
                <span class="status-pill">${invoice.status}</span>
            </div>
            <div class="card-body">
                <div class="meta-grid">
                    <div class="meta-item"><span class="label">Vendor</span><span class="value">${invoice.vendor}</span></div>
                    <div class="meta-item"><span class="label">PO Number</span><span class="value">${invoice.po_number}</span></div>
                    <div class="meta-item"><span class="label">Invoice Date</span><span class="value">${invoice.date}</span></div>
                    <div class="meta-item"><span class="label">Due Date</span><span class="value">${invoice.due_date}</span></div>
                </div>
                <div class="divider"></div>
                <p class="period">Billing Period: ${invoice.date} — ${invoice.due_date}</p>
                ${invoice.items.map(item => `
                <div class="line-item">
                    <span class="desc">${item.description}</span>
                    <span class="amt">$${item.total.toFixed(2)}</span>
                </div>`).join('')}
                <div class="total-line">
                    <span class="label">Total Due</span>
                    <span class="amt">$${invoice.total.toFixed(2)}</span>
                </div>
            </div>
        </div>` : ''}
    </div>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
    });
}
