'use client';

/**
 * ConfidenceBadge — Shows dual-source reconciliation confidence score.
 * Color-coded: green ≥ 95%, amber 70-94%, red < 70%.
 * Shows "Single Source" dimly when no portal data was available.
 */
export default function ConfidenceBadge({ score, status }: {
    score?: number | null;
    status?: 'VERIFIED' | 'PARTIAL' | 'DISCREPANCY' | null;
}) {
    if (score == null) {
        return (
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                opacity: 0.5,
            }}>
                —
            </span>
        );
    }

    const color = score >= 95
        ? 'var(--accent-success)'
        : score >= 70
            ? '#f59e0b'
            : 'var(--accent-error)';

    const bgColor = score >= 95
        ? 'var(--accent-success-dim)'
        : score >= 70
            ? 'rgba(245,158,11,0.1)'
            : 'var(--accent-error-dim)';

    const icon = score >= 95 ? '✓' : score >= 70 ? '◐' : '✗';

    return (
        <span
            title={status ? `Reconciliation: ${status}` : undefined}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color,
                background: bgColor,
                border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                whiteSpace: 'nowrap',
            }}
        >
            <span style={{ fontSize: '10px' }}>{icon}</span>
            {score}%
        </span>
    );
}
