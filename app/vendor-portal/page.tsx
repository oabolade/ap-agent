'use client';

import { useState } from 'react';

interface InvoiceItem {
    description: string;
    qty: number;
    unit_price: number;
    total: number;
}

interface Invoice {
    invoice_number: string;
    po_number: string;
    vendor: string;
    date: string;
    due_date: string;
    status: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
}

export default function VendorPortalPage() {
    const [searchType, setSearchType] = useState<'invoice' | 'po'>('invoice');
    const [searchValue, setSearchValue] = useState('');
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInvoice(null);

        try {
            const param = searchType === 'invoice' ? 'invoice' : 'po';
            const res = await fetch(`/api/vendor-portal?${param}=${encodeURIComponent(searchValue)}`);
            const data = await res.json();

            if (data.success) {
                setInvoice(data.invoice);
            } else {
                setError(data.error || 'Not found');
            }
        } catch {
            setError('Failed to look up invoice');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'white',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ea580c',
                    }}>A</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                            Acme Office Supplies
                        </h1>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                            Vendor Invoice Portal
                        </p>
                    </div>
                </div>
                <nav style={{ display: 'flex', gap: '24px' }}>
                    {['Dashboard', 'Invoices', 'Orders', 'Support'].map(item => (
                        <a key={item} href="#" style={{
                            color: 'rgba(255,255,255,0.9)',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >{item}</a>
                    ))}
                </nav>
            </header>

            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
                {/* Search Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '32px',
                }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 700, color: 'white' }}>
                        📄 Invoice Lookup
                    </h2>
                    <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                        Search by Invoice Number or Purchase Order Number
                    </p>

                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                        <div style={{ flex: '0 0 auto' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Search By
                            </label>
                            <select
                                id="search-type"
                                value={searchType}
                                onChange={e => setSearchType(e.target.value as 'invoice' | 'po')}
                                style={{
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="invoice" style={{ background: '#1e293b' }}>Invoice #</option>
                                <option value="po" style={{ background: '#1e293b' }}>PO #</option>
                            </select>
                        </div>

                        <div style={{ flex: '1' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {searchType === 'invoice' ? 'Invoice Number' : 'Purchase Order Number'}
                            </label>
                            <input
                                id="search-input"
                                type="text"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                placeholder={searchType === 'invoice' ? 'e.g. INV-2026-042' : 'e.g. PO-4521'}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <button
                            id="search-button"
                            type="submit"
                            disabled={loading || !searchValue}
                            style={{
                                padding: '12px 28px',
                                background: loading ? '#475569' : 'linear-gradient(135deg, #f97316, #ea580c)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading ? 'wait' : 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                            }}
                        >
                            {loading ? '⏳ Searching...' : '🔍 Search'}
                        </button>
                    </form>

                    {error && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px',
                            color: '#fca5a5',
                            fontSize: '14px',
                        }}>
                            ❌ {error}
                        </div>
                    )}
                </div>

                {/* Invoice Result */}
                {invoice && (
                    <div id="invoice-result" style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                    }}>
                        {/* Invoice Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.05) 100%)',
                            padding: '24px 32px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                        }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                    Invoice
                                </div>
                                <h3 id="invoice-number" style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'white' }}>
                                    {invoice.invoice_number}
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                                    From: <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{invoice.vendor}</strong>
                                </p>
                            </div>
                            <div style={{
                                padding: '6px 16px',
                                background: invoice.status === 'Paid' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(250, 204, 21, 0.2)',
                                border: `1px solid ${invoice.status === 'Paid' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(250, 204, 21, 0.4)'}`,
                                borderRadius: '20px',
                                color: invoice.status === 'Paid' ? '#86efac' : '#fde68a',
                                fontSize: '13px',
                                fontWeight: 600,
                            }}>
                                {invoice.status === 'Paid' ? '✅' : '⏳'} {invoice.status}
                            </div>
                        </div>

                        {/* Invoice Meta */}
                        <div style={{
                            padding: '20px 32px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                        }}>
                            {[
                                { label: 'PO Number', value: invoice.po_number, id: 'po-number' },
                                { label: 'Invoice Date', value: invoice.date, id: 'invoice-date' },
                                { label: 'Due Date', value: invoice.due_date, id: 'due-date' },
                                { label: 'Total Amount', value: `$${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, id: 'total-amount' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                                        {item.label}
                                    </div>
                                    <div id={item.id} style={{ fontSize: '16px', fontWeight: 600, color: item.label === 'Total Amount' ? '#f97316' : 'white' }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Line Items Table */}
                        <div style={{ padding: '24px 32px' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Line Items
                            </h4>
                            <table id="line-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                                            <th key={h} style={{
                                                padding: '10px 12px',
                                                textAlign: h === 'Description' ? 'left' : 'right',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'rgba(255,255,255,0.4)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{item.description}</td>
                                            <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', textAlign: 'right' }}>{item.qty}</td>
                                            <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', textAlign: 'right' }}>${item.unit_price.toFixed(2)}</td>
                                            <td style={{ padding: '12px', color: 'white', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>${item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div style={{
                                marginTop: '16px',
                                borderTop: '2px solid rgba(249, 115, 22, 0.3)',
                                paddingTop: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '8px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Subtotal:</span>
                                    <span style={{ color: 'white', fontSize: '14px' }}>${invoice.subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Tax:</span>
                                    <span style={{ color: 'white', fontSize: '14px' }}>${invoice.tax.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: '#f97316', fontSize: '16px', fontWeight: 700 }}>Total:</span>
                                    <span id="grand-total" style={{ color: '#f97316', fontSize: '16px', fontWeight: 700 }}>${invoice.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Reference */}
                {!invoice && !error && (
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '32px',
                    }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                            📋 Recent Invoices
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    {['Invoice #', 'PO #', 'Vendor', 'Date', 'Amount', 'Status'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 12px',
                                            textAlign: h === 'Amount' ? 'right' : 'left',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: 'rgba(255,255,255,0.4)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { inv: 'INV-2026-042', po: 'PO-4521', vendor: 'Acme Office Supplies', date: '2026-03-09', amount: '$1,240.00', status: 'Pending' },
                                    { inv: 'INV-2026-043', po: 'PO-4522', vendor: 'CloudHost Pro', date: '2026-03-01', amount: '$850.00', status: 'Pending' },
                                    { inv: 'INV-2026-044', po: 'PO-4523', vendor: 'Design Studio Co', date: '2026-02-28', amount: '$3,500.00', status: 'Pending' },
                                ].map((row, i) => (
                                    <tr key={i}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        onClick={() => { setSearchType('invoice'); setSearchValue(row.inv); }}
                                    >
                                        <td style={{ padding: '12px', color: '#f97316', fontSize: '14px', fontWeight: 600 }}>{row.inv}</td>
                                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{row.po}</td>
                                        <td style={{ padding: '12px', color: 'white', fontSize: '14px' }}>{row.vendor}</td>
                                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{row.date}</td>
                                        <td style={{ padding: '12px', color: 'white', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{row.amount}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                background: 'rgba(250, 204, 21, 0.15)',
                                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                                borderRadius: '12px',
                                                color: '#fde68a',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                            }}>⏳ {row.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer style={{
                padding: '24px 32px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px',
            }}>
                © 2026 Acme Office Supplies — Vendor Portal v2.1 • All inquiries: ap@acmeoffice.com
            </footer>
        </div>
    );
}
