'use client';

/**
 * VerificationBadge — Shows whether invoice was verified by dual sources.
 * "✓✓ Dual" = both Fireworks + Portal agreed
 * "✓ Email" = only Fireworks data available
 * "◐ Partial" = both sources present but disagree
 * "✗ Failed" = reconciliation rejected
 */
export default function VerificationBadge({ portalVerified, reconciliationStatus }: {
    portalVerified?: boolean;
    reconciliationStatus?: string | null;
}) {
    let label: string;
    let color: string;
    let icon: string;

    if (reconciliationStatus === 'VERIFIED') {
        label = 'Dual';
        color = 'var(--accent-success)';
        icon = '✓✓';
    } else if (reconciliationStatus === 'PARTIAL') {
        label = 'Partial';
        color = '#f59e0b';
        icon = '◐';
    } else if (reconciliationStatus === 'DISCREPANCY') {
        label = 'Failed';
        color = 'var(--accent-error)';
        icon = '✗';
    } else if (portalVerified) {
        label = 'Dual';
        color = 'var(--accent-success)';
        icon = '✓✓';
    } else {
        label = 'Email';
        color = 'var(--text-muted)';
        icon = '✓';
    }

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            color,
        }}>
            <span style={{ fontSize: '10px' }}>{icon}</span>
            {label}
        </span>
    );
}
