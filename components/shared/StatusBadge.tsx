'use client';

import { PipelineStatus } from '@/lib/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    RECEIVED: { label: 'RECEIVED', color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)' },
    EXTRACTING: { label: 'EXTRACTING', color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)' },
    PARSING: { label: 'PARSING', color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)' },
    RECONCILING: { label: 'RECONCILING', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    MATCHING: { label: 'MATCHING', color: 'var(--accent-warning)', bg: 'var(--accent-warning-dim)' },
    APPROVED: { label: 'AUTO-APPROVED', color: 'var(--accent-success)', bg: 'var(--accent-success-dim)' },
    PENDING_REVIEW: { label: 'PENDING REVIEW', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    EXCEPTION: { label: 'EXCEPTION', color: 'var(--accent-error)', bg: 'var(--accent-error-dim)' },
    DISPUTED: { label: 'DISPUTED', color: 'var(--accent-error)', bg: 'var(--accent-error-dim)' },
};

const ACTIVE_STATES = new Set(['EXTRACTING', 'PARSING', 'RECONCILING', 'MATCHING']);

export default function StatusBadge({ status }: { status: PipelineStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.RECEIVED;
    const isActive = ACTIVE_STATES.has(status);

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                color: config.color,
                background: config.bg,
                border: `1px solid ${config.color}`,
                borderColor: `color-mix(in srgb, ${config.color} 30%, transparent)`,
                whiteSpace: 'nowrap',
            }}
        >
            {isActive && (
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: config.color,
                        animation: 'pulse-cyan 1.5s ease-in-out infinite',
                    }}
                />
            )}
            {config.label}
        </span>
    );
}

