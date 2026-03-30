'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Clock } from 'lucide-react';
import { Invoice } from '@/lib/types';
import StatusBadge from '@/components/shared/StatusBadge';
import MoneyDisplay from '@/components/shared/MoneyDisplay';
import MatchVisualizer from '@/components/invoice/MatchVisualizer';
import ActionButtons from '@/components/invoice/ActionButtons';
import { TimeHHMMSS } from '@/components/shared/TimestampDisplay';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInvoice() {
            try {
                const res = await fetch(`/api/invoices/${params.id}`);
                const data = await res.json();
                if (data.success) {
                    setInvoice(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch invoice:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchInvoice();
    }, [params.id]);

    if (loading) {
        return (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading invoice...</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--accent-error)', marginBottom: '12px' }}>Invoice not found</div>
                <button onClick={() => router.push('/dashboard')} style={{
                    padding: '8px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px',
                }}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Back button */}
            <button
                onClick={() => router.push('/dashboard')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0',
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '13px', marginBottom: '20px',
                }}
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    marginBottom: '24px', gap: '20px',
                }}
            >
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                        {invoice.vendor_name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{invoice.invoice_number}</span>
                        <span>·</span>
                        <MoneyDisplay amount={invoice.amount} showCurrency size="md" />
                        <span>·</span>
                        <StatusBadge status={invoice.status} />
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
                {/* Left column: Match Visualizer + Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <MatchVisualizer invoice={invoice} />

                    {/* Line Items */}
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', padding: '24px',
                    }}>
                        <h3 style={{
                            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 16px 0',
                        }}>
                            Line Items
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {/* Table header */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 60px 100px',
                                padding: '8px 0', fontSize: '10px', textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600,
                                borderBottom: '1px solid var(--border-subtle)',
                            }}>
                                <div>Description</div>
                                <div style={{ textAlign: 'center' }}>Qty</div>
                                <div style={{ textAlign: 'right' }}>Amount</div>
                            </div>
                            {invoice.line_items.map((item, idx) => (
                                <div key={idx} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 60px 100px',
                                    padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
                                    fontSize: '13px', alignItems: 'center',
                                }}>
                                    <div style={{ color: 'var(--text-primary)' }}>{item.description}</div>
                                    <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{item.qty}</div>
                                    <div style={{ textAlign: 'right' }}><MoneyDisplay amount={item.amount} size="sm" /></div>
                                </div>
                            ))}
                            {/* Total */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 60px 100px',
                                padding: '12px 0', fontSize: '14px', fontWeight: 600,
                            }}>
                                <div style={{ color: 'var(--text-muted)' }}>Total</div>
                                <div />
                                <div style={{ textAlign: 'right' }}><MoneyDisplay amount={invoice.amount} size="md" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Raw Email */}
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', padding: '24px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <FileText size={14} color="var(--text-muted)" />
                            <h3 style={{
                                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: 'var(--text-muted)', fontWeight: 600, margin: 0,
                            }}>
                                Raw Email Body
                            </h3>
                        </div>
                        <div style={{
                            padding: '12px', background: '#080c16', borderRadius: 'var(--radius-sm)',
                            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)',
                            lineHeight: '1.6', whiteSpace: 'pre-wrap',
                        }}>
                            {invoice.raw_email}
                        </div>
                    </div>
                </div>

                {/* Right column: Actions + Agent Log */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Actions */}
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', padding: '24px',
                    }}>
                        <h3 style={{
                            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 16px 0',
                        }}>
                            Actions
                        </h3>
                        <ActionButtons
                            invoiceId={invoice._id}
                            currentStatus={invoice.status}
                            onAction={() => {
                                // Refresh invoice data
                                window.location.reload();
                            }}
                        />
                    </div>

                    {/* TinyFish Portal Verification */}
                    {invoice.portal_verified && (
                        <div style={{
                            background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                            padding: '24px', border: '1px solid color-mix(in srgb, var(--accent-success) 30%, transparent)',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px',
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: 'var(--accent-success)',
                                    boxShadow: '0 0 8px rgba(0, 255, 136, 0.4)',
                                }} />
                                <h3 style={{
                                    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                    color: 'var(--accent-success)', fontWeight: 600, margin: 0,
                                }}>
                                    🐟 Vendor Portal Verified
                                </h3>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                                TinyFish navigated the vendor&apos;s portal and confirmed this invoice.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Portal Invoice #</span>
                                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent-success)' }}>
                                        {invoice.portal_invoice_number}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Portal Amount</span>
                                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--accent-success)' }}>
                                        ${invoice.portal_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Match</span>
                                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-success)', fontWeight: 600 }}>
                                        {invoice.portal_amount === invoice.amount ? '✓ EXACT MATCH' : '⚠ DIFFERS'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoice metadata */}
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', padding: '24px',
                    }}>
                        <h3 style={{
                            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 16px 0',
                        }}>
                            Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Vendor Email', value: invoice.vendor_email },
                                { label: 'Currency', value: invoice.currency },
                                { label: 'Due Date', value: new Date(invoice.due_date).toLocaleDateString() },
                                { label: 'QB Bill ID', value: invoice.qb_bill_id || '—' },
                                { label: 'Payment Date', value: invoice.payment_scheduled_date ? new Date(invoice.payment_scheduled_date).toLocaleDateString() : '—' },
                            ].map((item) => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</span>
                                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Agent Log */}
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', overflow: 'hidden', flex: 1,
                    }}>
                        <div style={{
                            padding: '16px', borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <Clock size={14} color="var(--text-muted)" />
                            <h3 style={{
                                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: 'var(--text-muted)', fontWeight: 600, margin: 0,
                            }}>
                                Agent Decision Log
                            </h3>
                        </div>
                        <div style={{
                            padding: '12px', background: '#080c16', maxHeight: '400px', overflowY: 'auto',
                            fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: '1.8',
                        }}>
                            {invoice.agent_log.map((entry, idx) => {
                                const levelColor = entry.level === 'success' ? 'var(--accent-success)'
                                    : entry.level === 'error' ? 'var(--accent-error)'
                                        : entry.level === 'warning' ? 'var(--accent-warning)'
                                            : 'var(--text-secondary)';
                                const icon = entry.level === 'success' ? '✓'
                                    : entry.level === 'error' ? '✗'
                                        : entry.level === 'warning' ? '⚠'
                                            : '→';
                                return (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', padding: '2px 0' }}>
                                        <TimeHHMMSS timestamp={typeof entry.timestamp === 'string' ? entry.timestamp : new Date().toISOString()} />
                                        <span style={{ color: levelColor }}>{icon}</span>
                                        <span style={{ color: levelColor, wordBreak: 'break-word' }}>{entry.detail}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
