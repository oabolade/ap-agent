// ─── Metro Utilities Mock Portal ──────────────────────────────────
// Layout: Dated enterprise form-heavy portal (intentionally ugly).
// Archetype: Utility company with base charges, taxes, and fees in <dl> format.

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
    <title>Metro Utilities Inc — Account Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Georgia, serif; background: #f5f5f0; color: #333; min-height: 100vh; }
        .top-bar { background: #003366; color: #fff; padding: 8px 20px; font-size: 11px; display: flex; justify-content: space-between; }
        .header { background: #fff; border-bottom: 3px solid #003366; padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
        .header h1 { font-size: 24px; color: #003366; font-weight: normal; }
        .header img { width: 48px; height: 48px; }
        .nav-bar { background: #e8e8e0; padding: 8px 20px; font-size: 13px; border-bottom: 1px solid #ccc; }
        .nav-bar a { color: #003366; text-decoration: underline; margin-right: 20px; }
        .main { max-width: 700px; margin: 24px auto; padding: 0 20px; }
        fieldset { border: 2px groove #ccc; padding: 16px 20px; margin-bottom: 20px; background: #fff; }
        legend { font-weight: bold; color: #003366; font-size: 14px; padding: 0 8px; }
        .form-row { margin-bottom: 12px; }
        .form-row label { display: block; font-size: 13px; color: #555; margin-bottom: 4px; font-weight: bold; }
        .form-row input { padding: 6px 10px; border: 1px solid #999; font-family: 'Courier New', monospace; font-size: 14px; width: 200px; }
        .form-row button { padding: 6px 20px; background: #003366; color: #fff; border: 1px solid #002244; font-size: 13px; cursor: pointer; font-family: serif; }
        .form-row button:hover { background: #004488; }
        .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; font-size: 13px; margin-bottom: 16px; }
        .invoice-box { background: #fff; border: 1px solid #999; padding: 0; }
        .invoice-title { background: #003366; color: #fff; padding: 10px 16px; font-size: 16px; }
        .invoice-meta { padding: 12px 16px; border-bottom: 1px solid #ddd; font-size: 13px; }
        .invoice-meta span { margin-right: 24px; }
        .invoice-meta strong { color: #003366; }
        dl { padding: 12px 16px; }
        dl dt { float: left; clear: left; width: 300px; font-size: 13px; color: #555; padding: 6px 0; border-bottom: 1px dotted #ccc; }
        dl dd { margin-left: 320px; font-size: 14px; font-weight: bold; padding: 6px 0; border-bottom: 1px dotted #ccc; text-align: right; }
        .total-section { background: #f0f0e8; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #003366; }
        .total-section .label { font-size: 16px; font-weight: bold; color: #003366; }
        .total-section .amount { font-size: 22px; font-weight: bold; color: #003366; }
        .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; padding: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="top-bar">
        <span>Metro Utilities Inc — Authorized Account Portal</span>
        <span>System Status: Online</span>
    </div>
    <div class="header">
        <div style="width:48px;height:48px;background:#003366;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:20px;">MU</div>
        <h1>Metro Utilities Inc</h1>
    </div>
    <div class="nav-bar">
        <a href="#">Home</a>
        <a href="#">My Account</a>
        <a href="#">Billing History</a>
        <a href="#">Contact Support</a>
    </div>
    <div class="main">
        <fieldset>
            <legend>Account / PO Lookup</legend>
            <form action="/vendor-portal/utility-portal" method="GET">
                <div class="form-row">
                    <label for="po-input">Purchase Order Number:</label>
                    <input type="text" id="po-input" name="po" value="${po || ''}" placeholder="PO-4523" />
                    <button type="submit">Search</button>
                </div>
            </form>
        </fieldset>

        ${!po ? '<div class="alert">Please enter your PO or account number above to retrieve your invoice.</div>' : ''}
        ${po && !invoice ? '<div class="alert">⚠ No records found for PO number <strong>' + po + '</strong>. Please verify and try again.</div>' : ''}
        ${invoice ? `
        <div class="invoice-box">
            <div class="invoice-title">Invoice Record — ${invoice.invoice_number}</div>
            <div class="invoice-meta">
                <span><strong>Vendor:</strong> ${invoice.vendor}</span>
                <span><strong>PO:</strong> ${invoice.po_number}</span>
                <span><strong>Date:</strong> ${invoice.date}</span>
                <span><strong>Due:</strong> ${invoice.due_date}</span>
            </div>
            <dl>
                ${invoice.items.map(item => `
                <dt>${item.description}</dt>
                <dd>$${item.total.toFixed(2)}</dd>`).join('')}
            </dl>
            <div class="total-section">
                <span class="label">Total Amount Due</span>
                <span class="amount">$${invoice.total.toFixed(2)}</span>
            </div>
        </div>` : ''}
    </div>
    <div class="footer">
        &copy; 2026 Metro Utilities Inc. All rights reserved. | System v3.2.1
    </div>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
    });
}
