'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
    invoiceId: string;
    currentStatus: string;
    onAction?: (action: string) => void;
}

export default function ActionButtons({ invoiceId, currentStatus, onAction }: ActionButtonsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [showNote, setShowNote] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    const handleAction = async (action: string) => {
        if (action === 'dispute' || action === 'escalate') {
            setPendingAction(action);
            setShowNote(true);
            return;
        }
        await submitAction(action);
    };

    const submitAction = async (action: string) => {
        setLoading(action);
        try {
            const res = await fetch(`/api/invoices/${invoiceId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, note: noteText || undefined }),
            });
            const data = await res.json();
            if (data.success) {
                onAction?.(action);
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setLoading(null);
            setShowNote(false);
            setNoteText('');
            setPendingAction(null);
        }
    };

    const isTerminal = currentStatus === 'APPROVED' || currentStatus === 'DISPUTED';

    if (isTerminal) {
        return (
            <div style={{
                padding: '12px 16px',
                background: currentStatus === 'APPROVED' ? 'var(--accent-success-dim)' : 'var(--accent-error-dim)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: currentStatus === 'APPROVED' ? 'var(--accent-success)' : 'var(--accent-error)',
                textAlign: 'center',
            }}>
                {currentStatus === 'APPROVED' ? '✓ Invoice approved' : '✗ Invoice disputed'}
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('approve')}
                    disabled={!!loading}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: 'var(--accent-success)',
                        color: 'var(--bg-base)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading && loading !== 'approve' ? 0.5 : 1,
                    }}
                >
                    {loading === 'approve' ? <Loader2 size={16} className="animate-spin-slow" /> : <Check size={16} />}
                    APPROVE
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('dispute')}
                    disabled={!!loading}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: 'transparent',
                        color: 'var(--accent-error)',
                        border: '1px solid var(--accent-error)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading && loading !== 'dispute' ? 0.5 : 1,
                    }}
                >
                    {loading === 'dispute' ? <Loader2 size={16} className="animate-spin-slow" /> : <X size={16} />}
                    DISPUTE
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('escalate')}
                    disabled={!!loading}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: 'transparent',
                        color: 'var(--accent-warning)',
                        border: '1px solid var(--accent-warning)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading && loading !== 'escalate' ? 0.5 : 1,
                    }}
                >
                    {loading === 'escalate' ? <Loader2 size={16} className="animate-spin-slow" /> : <AlertTriangle size={16} />}
                    ESCALATE
                </motion.button>
            </div>

            {/* Note input for dispute/escalate */}
            {showNote && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    style={{ marginTop: '12px', overflow: 'hidden' }}
                >
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={`Reason for ${pendingAction}...`}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            fontFamily: 'var(--font-sans)',
                            resize: 'vertical',
                            minHeight: '60px',
                            outline: 'none',
                        }}
                        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent-cyan)'; }}
                        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border-default)'; }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => { setShowNote(false); setPendingAction(null); }}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => pendingAction && submitAction(pendingAction)}
                            style={{
                                padding: '8px 16px',
                                background: pendingAction === 'dispute' ? 'var(--accent-error)' : 'var(--accent-warning)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--bg-base)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Confirm {pendingAction}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
