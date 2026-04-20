'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Invoice } from '@/lib/types';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfidenceBadge from '@/components/shared/ConfidenceBadge';
import VerificationBadge from '@/components/shared/VerificationBadge';
import MoneyDisplay from '@/components/shared/MoneyDisplay';
import TimestampDisplay from '@/components/shared/TimestampDisplay';
import Link from 'next/link';

type TabId = 'all' | 'flagged';

export default function InvoiceFeed() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [newIds, setNewIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<TabId>('all');

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

    // Filter invoices by tab
    const filteredInvoices = activeTab === 'flagged'
        ? invoices.filter(inv =>
            inv.status === 'EXCEPTION' ||
            inv.status === 'PENDING_REVIEW' ||
            inv.match_result === 'DISCREPANCY'
        )
        : invoices;

    const flaggedCount = invoices.filter(inv =>
        inv.status === 'EXCEPTION' ||
        inv.status === 'PENDING_REVIEW' ||
        inv.match_result === 'DISCREPANCY'
    ).length;

    // Helper to safely extract reconciliation data
    const getRecon = (inv: Invoice) => {
        const r = inv.reconciliation as Record<string, unknown> | undefined;
        return {
            confidence_score: r?.confidence_score as number | undefined,
            status: r?.status as string | undefined,
            discrepancies: r?.discrepancies as Array<Record<string, unknown>> | undefined,
            matched_fields: r?.matched_fields as string[] | undefined,
            recommendation: r?.recommendation as string | undefined,
        };
    };

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
            {/* Header with Tabs */}
            <div style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', gap: '0' }}>
                    <button
                        onClick={() => setActiveTab('all')}
                        style={{
                            padding: '6px 16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            border: 'none',
                            borderBottom: activeTab === 'all' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                            background: 'transparent',
                            color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'color 0.2s, border-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <ShieldCheck size={13} /> All Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('flagged')}
                        style={{
                            padding: '6px 16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            border: 'none',
                            borderBottom: activeTab === 'flagged' ? '2px solid var(--accent-error)' : '2px solid transparent',
                            background: 'transparent',
                            color: activeTab === 'flagged' ? 'var(--accent-error)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'color 0.2s, border-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <ShieldAlert size={13} /> Flagged
                        {flaggedCount > 0 && (
                            <span style={{
                                background: 'var(--accent-error)',
                                color: '#fff',
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '999px',
                                fontWeight: 700,
                                minWidth: '18px',
                                textAlign: 'center',
                            }}>
                                {flaggedCount}
                            </span>
                        )}
                    </button>
                </div>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                }}>
                    {filteredInvoices.length} invoices
                </span>
            </div>

            {/* Table header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.9fr 0.8fr 0.7fr 0.6fr 0.9fr 32px',
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
                <div style={{ textAlign: 'center' }}>Verify</div>
                <div style={{ textAlign: 'center' }}>Score</div>
                <div style={{ textAlign: 'center' }}>Status</div>
                <div />
            </div>

            {/* Rows */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <AnimatePresence>
                    {filteredInvoices.map((inv) => {
                        const recon = getRecon(inv);
                        return (
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
                                        gridTemplateColumns: '1.4fr 0.9fr 0.8fr 0.7fr 0.6fr 0.9fr 32px',
                                        padding: '12px 20px',
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
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {inv.vendor_name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            <TimestampDisplay timestamp={inv.created_at} />
                                        </div>
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {inv.invoice_number}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <MoneyDisplay amount={inv.amount} />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <VerificationBadge
                                            portalVerified={inv.portal_verified}
                                            reconciliationStatus={recon.status || null}
                                        />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <ConfidenceBadge
                                            score={recon.confidence_score}
                                            status={recon.status as 'VERIFIED' | 'PARTIAL' | 'DISCREPANCY' | undefined}
                                        />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <ChevronRight
                                            size={14}
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
                                                {/* Row 1: PO details */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>PO Number</div>
                                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>{inv.po_number || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>PO Match</div>
                                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                                                            {inv.match_result === 'MATCH' && <span style={{ color: 'var(--accent-success)' }}>✓ MATCH</span>}
                                                            {inv.match_result === 'MISMATCH' && <span style={{ color: 'var(--accent-error)' }}>✗ MISMATCH</span>}
                                                            {inv.match_result === 'DISCREPANCY' && <span style={{ color: 'var(--accent-error)' }}>🚩 DISCREPANCY</span>}
                                                            {!inv.match_result && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>Delta</div>
                                                        <div style={{
                                                            fontFamily: 'var(--font-mono)', fontSize: '13px',
                                                            color: inv.match_delta && inv.match_delta > 0 ? 'var(--accent-error)' : 'var(--accent-success)',
                                                        }}>
                                                            {inv.match_delta !== null ? `$${inv.match_delta.toFixed(2)}` : '—'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>Recommendation</div>
                                                        <div style={{
                                                            fontFamily: 'var(--font-mono)', fontSize: '13px',
                                                            color: recon.recommendation === 'AUTO_APPROVE' ? 'var(--accent-success)'
                                                                : recon.recommendation === 'REJECT' ? 'var(--accent-error)'
                                                                : recon.recommendation === 'HUMAN_REVIEW' ? '#f59e0b'
                                                                : 'var(--text-muted)',
                                                        }}>
                                                            {recon.recommendation || '—'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Row 2: Discrepancies (if any) */}
                                                {recon.discrepancies && recon.discrepancies.length > 0 && (
                                                    <div style={{
                                                        background: 'rgba(239,68,68,0.06)',
                                                        border: '1px solid rgba(239,68,68,0.15)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        padding: '10px 14px',
                                                        marginBottom: '12px',
                                                    }}>
                                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-error)', marginBottom: '6px', fontWeight: 600 }}>
                                                            🚩 Discrepancies Detected
                                                        </div>
                                                        {recon.discrepancies.map((d, i) => (
                                                            <div key={i} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                                                {String(d.flag_type)}: email=&quot;{String(d.email_value)}&quot; vs portal=&quot;{String(d.portal_value)}&quot;
                                                                <span style={{ color: d.severity === 'HIGH' ? 'var(--accent-error)' : '#f59e0b', marginLeft: '8px' }}>
                                                                    ({String(d.severity)})
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

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
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

