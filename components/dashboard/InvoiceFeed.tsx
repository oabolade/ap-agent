'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { Invoice } from '@/lib/types';
import StatusBadge from '@/components/shared/StatusBadge';
import MoneyDisplay from '@/components/shared/MoneyDisplay';
import TimestampDisplay from '@/components/shared/TimestampDisplay';
import Link from 'next/link';

export default function InvoiceFeed() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [newIds, setNewIds] = useState<Set<string>>(new Set());

    const fetchInvoices = useCallback(async () => {
        try {
            const res = await fetch('/api/invoices?status=all&limit=50');
            const data = await res.json();
            if (data.success) {
                // Detect newly appeared invoices
                if (invoices.length > 0) {
                    const existingIds = new Set(invoices.map(i => i._id));
                    const fresh = data.data.filter((inv: Invoice) => !existingIds.has(inv._id)).map((inv: Invoice) => inv._id);
                    if (fresh.length > 0) {
                        setNewIds(new Set(fresh));
                        setTimeout(() => setNewIds(new Set()), 600);
                    }
                }
                setInvoices(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        } finally {
            setLoading(false);
        }
    }, [invoices]);

    useEffect(() => {
        fetchInvoices();
        const interval = setInterval(fetchInvoices, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                height: '100%',
            }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Invoice Feed
                </div>
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                        height: '52px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '8px',
                        animation: 'pulse-cyan 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.1}s`,
                        opacity: 0.3,
                    }} />
                ))}
            </div>
        );
    }

    return (
        <div
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <h3 style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    margin: 0,
                }}>
                    Invoice Feed
                </h3>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                }}>
                    {invoices.length} invoices
                </span>
            </div>

            {/* Table header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 40px',
                padding: '10px 20px',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                fontWeight: 600,
                borderBottom: '1px solid var(--border-subtle)',
            }}>
                <div>Vendor</div>
                <div>Invoice #</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
                <div style={{ textAlign: 'center' }}>PO Match</div>
                <div style={{ textAlign: 'center' }}>Status</div>
                <div />
            </div>

            {/* Rows */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <AnimatePresence>
                    {invoices.map((inv) => (
                        <motion.div
                            key={inv._id}
                            initial={newIds.has(inv._id) ? { opacity: 0, backgroundColor: 'var(--accent-cyan-dim)' } : { opacity: 1 }}
                            animate={{ opacity: 1, backgroundColor: 'transparent' }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Main row */}
                            <div
                                onClick={() => setExpandedId(expandedId === inv._id ? null : inv._id)}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 40px',
                                    padding: '14px 20px',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    transition: 'background 0.15s ease',
                                    background: expandedId === inv._id ? 'var(--bg-elevated)' : 'transparent',
                                }}
                                onMouseEnter={e => {
                                    if (expandedId !== inv._id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
                                }}
                                onMouseLeave={e => {
                                    if (expandedId !== inv._id) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {inv.vendor_name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        <TimestampDisplay timestamp={inv.created_at} />
                                    </div>
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {inv.invoice_number}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <MoneyDisplay amount={inv.amount} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    {inv.match_result === 'MATCH' && (
                                        <span style={{ color: 'var(--accent-success)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>✓ MATCH</span>
                                    )}
                                    {inv.match_result === 'MISMATCH' && (
                                        <span style={{ color: 'var(--accent-error)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>✗ MISMATCH</span>
                                    )}
                                    {inv.match_result === 'NO_PO' && (
                                        <span style={{ color: 'var(--accent-warning)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>— NO PO</span>
                                    )}
                                    {!inv.match_result && (
                                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>—</span>
                                    )}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <StatusBadge status={inv.status} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <ChevronRight
                                        size={16}
                                        style={{
                                            color: 'var(--text-muted)',
                                            transform: expandedId === inv._id ? 'rotate(90deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s ease',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {expandedId === inv._id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{
                                            padding: '16px 20px',
                                            background: 'var(--bg-elevated)',
                                            borderBottom: '1px solid var(--border-subtle)',
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>PO Number</div>
                                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>{inv.po_number || '—'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>PO Amount</div>
                                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        {inv.po_amount ? `$${inv.po_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>Delta</div>
                                                    <div style={{
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '13px',
                                                        color: inv.match_delta && inv.match_delta > 0 ? 'var(--accent-error)' : 'var(--accent-success)',
                                                    }}>
                                                        {inv.match_delta !== null ? `$${inv.match_delta.toFixed(2)}` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/invoice/${inv._id}`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '12px',
                                                    color: 'var(--accent-cyan)',
                                                    textDecoration: 'none',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                View full detail <ExternalLink size={12} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
