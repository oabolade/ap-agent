'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import { PipelineStep } from '@/lib/types';

const STEP_ICONS = {
    completed: <Check size={14} strokeWidth={3} />,
    active: <Loader2 size={14} className="animate-spin-slow" />,
    pending: <Circle size={14} />,
};

export default function PipelineTracker() {
    const [steps, setSteps] = useState<PipelineStep[]>([]);
    const [activeInvoice, setActiveInvoice] = useState<{
        vendor_name: string;
        invoice_number: string;
        amount: number;
    } | null>(null);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await fetch('/api/pipeline/status');
                const data = await res.json();
                if (data.success) {
                    setSteps(data.data.steps);
                    setActiveInvoice(data.data.active_invoice);
                }
            } catch (err) {
                console.error('Failed to fetch pipeline status:', err);
            }
        }

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: '4px',
                }}>
                    Pipeline Status
                </h3>
                {activeInvoice && (
                    <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        margin: 0,
                    }}>
                        Processing: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                            {activeInvoice.invoice_number}
                        </span>
                    </p>
                )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0' }}>
                <AnimatePresence>
                    {steps.map((step, idx) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                position: 'relative',
                                paddingBottom: idx < steps.length - 1 ? '24px' : '0',
                            }}
                        >
                            {/* Connector line */}
                            {idx < steps.length - 1 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '11px',
                                        top: '24px',
                                        width: '2px',
                                        height: 'calc(100% - 16px)',
                                        background: step.status === 'completed'
                                            ? 'var(--accent-success)'
                                            : 'var(--border-default)',
                                        opacity: step.status === 'completed' ? 0.4 : 1,
                                    }}
                                />
                            )}

                            {/* Step indicator */}
                            <div
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    background: step.status === 'completed'
                                        ? 'var(--accent-success-dim)'
                                        : step.status === 'active'
                                            ? 'var(--accent-cyan-dim)'
                                            : 'var(--bg-elevated)',
                                    color: step.status === 'completed'
                                        ? 'var(--accent-success)'
                                        : step.status === 'active'
                                            ? 'var(--accent-cyan)'
                                            : 'var(--text-muted)',
                                    border: `2px solid ${step.status === 'completed'
                                            ? 'var(--accent-success)'
                                            : step.status === 'active'
                                                ? 'var(--accent-cyan)'
                                                : 'var(--border-default)'
                                        }`,
                                    boxShadow: step.status === 'active' ? '0 0 12px rgba(0, 212, 255, 0.3)' : 'none',
                                }}
                            >
                                {STEP_ICONS[step.status]}
                            </div>

                            {/* Step content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: step.status === 'active' ? 600 : 400,
                                    color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)',
                                    lineHeight: '24px',
                                }}>
                                    {step.label}
                                </div>
                                {step.timestamp && (
                                    <div style={{
                                        fontSize: '11px',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--text-muted)',
                                        marginTop: '2px',
                                    }}>
                                        {step.status === 'active' ? 'live...' : new Date(step.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {activeInvoice && (
                <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        Current Invoice
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {activeInvoice.vendor_name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-cyan)' }}>
                        ${activeInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            )}
        </div>
    );
}
