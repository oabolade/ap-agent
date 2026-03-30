'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Invoice } from '@/lib/types';
import StatusBadge from '@/components/shared/StatusBadge';
import MoneyDisplay from '@/components/shared/MoneyDisplay';
import TimestampDisplay from '@/components/shared/TimestampDisplay';
import ActionButtons from '@/components/invoice/ActionButtons';
import Link from 'next/link';

export default function ExceptionsPage() {
    const [exceptions, setExceptions] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExceptions = async () => {
        try {
            const res = await fetch('/api/invoices?status=EXCEPTION');
            const data = await res.json();
            if (data.success) {
                setExceptions(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch exceptions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExceptions();
    }, []);

    function getDiscrepancyType(inv: Invoice): string {
        if (inv.match_result === 'NO_PO') return 'No PO Number';
        if (inv.match_result === 'MISMATCH') return 'Amount Mismatch';
        if (inv.amount > 10000) return 'Over Auto-Approve Limit';
        return 'Pipeline Error';
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        Exception Queue
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        Invoices requiring human review and decision
                    </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', background: exceptions.length > 0 ? 'var(--accent-error-dim)' : 'var(--accent-success-dim)',
                    borderRadius: 'var(--radius-md)', border: `1px solid color-mix(in srgb, ${exceptions.length > 0 ? 'var(--accent-error)' : 'var(--accent-success)'} 30%, transparent)`,
                }}>
                    <AlertTriangle size={16} color={exceptions.length > 0 ? 'var(--accent-error)' : 'var(--accent-success)'} />
                    <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600,
                        color: exceptions.length > 0 ? 'var(--accent-error)' : 'var(--accent-success)',
                    }}>
                        {exceptions.length} exception{exceptions.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ height: '180px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', opacity: 0.3, animation: 'pulse-cyan 1.5s ease-in-out infinite' }} />
                    ))}
                </div>
            ) : exceptions.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-success)', marginBottom: '4px' }}>All clear</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No exceptions require your attention.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {exceptions.map((inv, idx) => (
                        <motion.div
                            key={inv._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                padding: '24px',
                                borderLeft: '3px solid var(--accent-error)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                            {inv.vendor_name}
                                        </h3>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</span>
                                        <span>·</span>
                                        <TimestampDisplay timestamp={inv.created_at} />
                                    </div>
                                </div>
                                <Link
                                    href={`/invoice/${inv._id}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontSize: '12px', color: 'var(--accent-cyan)', textDecoration: 'none',
                                    }}
                                >
                                    Detail <ExternalLink size={12} />
                                </Link>
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                gap: '16px', marginBottom: '16px',
                                padding: '14px 16px', background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-sm)',
                            }}>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        Discrepancy Type
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-error)' }}>
                                        {getDiscrepancyType(inv)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        Invoice Amount
                                    </div>
                                    <MoneyDisplay amount={inv.amount} size="md" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        PO Amount
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        {inv.po_amount ? `$${inv.po_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        Delta
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600,
                                        color: inv.match_delta && inv.match_delta > 0 ? 'var(--accent-error)' : 'var(--text-secondary)',
                                    }}>
                                        {inv.match_delta !== null ? `$${inv.match_delta.toFixed(2)}` : '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Recommended action */}
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                <strong style={{ color: 'var(--text-secondary)' }}>Agent recommendation:</strong>{' '}
                                {inv.match_result === 'NO_PO'
                                    ? 'Create a PO in QuickBooks and resubmit, or approve without PO.'
                                    : inv.match_result === 'MISMATCH'
                                        ? 'Contact vendor to resolve amount discrepancy, or approve with override.'
                                        : 'Manually approve — amount exceeds auto-approve threshold.'}
                            </div>

                            <ActionButtons
                                invoiceId={inv._id}
                                currentStatus={inv.status}
                                onAction={() => fetchExceptions()}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
