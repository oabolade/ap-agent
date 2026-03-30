'use client';

import { Invoice } from '@/lib/types';

export default function MatchVisualizer({ invoice }: { invoice: Invoice }) {
    const hasMatch = invoice.match_result !== null && invoice.match_result !== 'NO_PO';
    const isMatch = invoice.match_result === 'MATCH';

    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
        }}>
            <h3 style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                fontWeight: 600,
                margin: '0 0 20px 0',
            }}>
                3-Way Match Result
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr auto 1fr',
                gap: '0',
                alignItems: 'flex-start',
            }}>
                {/* PO Column */}
                <div style={{
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${hasMatch && isMatch ? 'var(--accent-success)' : hasMatch ? 'var(--accent-error)' : 'var(--border-default)'}`,
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Purchase Order
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
                        {invoice.po_number || '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {invoice.po_amount ? `$${invoice.po_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </div>
                </div>

                {/* Connector */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    padding: '0 8px',
                }}>
                    <div style={{
                        width: '40px',
                        height: '2px',
                        background: hasMatch && isMatch ? 'var(--accent-success)' : hasMatch ? 'var(--accent-error)' : 'var(--border-default)',
                        position: 'relative',
                    }}>
                        <div style={{
                            position: 'absolute',
                            right: '-4px',
                            top: '-3px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: hasMatch && isMatch ? 'var(--accent-success)' : hasMatch ? 'var(--accent-error)' : 'var(--border-default)',
                        }} />
                    </div>
                </div>

                {/* Invoice Column */}
                <div style={{
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${hasMatch && isMatch ? 'var(--accent-success)' : hasMatch ? 'var(--accent-error)' : 'var(--border-default)'}`,
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Invoice
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
                        {invoice.invoice_number}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Connector */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    padding: '0 8px',
                }}>
                    <div style={{
                        width: '40px',
                        height: '2px',
                        background: 'var(--border-default)',
                    }} />
                </div>

                {/* Receipt Column */}
                <div style={{
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    textAlign: 'center',
                    opacity: 0.5,
                }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Receipt
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        —
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)' }}>
                        Not available
                    </div>
                </div>
            </div>

            {/* Delta indicator */}
            {invoice.match_delta !== null && invoice.match_delta > 0 && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'var(--accent-error-dim)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid color-mix(in srgb, var(--accent-error) 30%, transparent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: 'var(--accent-error)',
                    textAlign: 'center',
                }}>
                    ⚠ Discrepancy: ${invoice.match_delta.toFixed(2)} ({invoice.po_amount ? ((invoice.match_delta / invoice.po_amount) * 100).toFixed(1) : '?'}% over PO)
                </div>
            )}

            {isMatch && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'var(--accent-success-dim)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid color-mix(in srgb, var(--accent-success) 30%, transparent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: 'var(--accent-success)',
                    textAlign: 'center',
                }}>
                    ✓ Match confirmed. Amounts are within tolerance.
                </div>
            )}
        </div>
    );
}
