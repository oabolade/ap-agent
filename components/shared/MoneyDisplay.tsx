'use client';

interface MoneyDisplayProps {
    amount: number;
    currency?: string;
    showCurrency?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function MoneyDisplay({
    amount,
    currency = 'USD',
    showCurrency = false,
    size = 'md',
}: MoneyDisplayProps) {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    const fontSize = size === 'lg' ? '24px' : size === 'sm' ? '13px' : '14px';

    return (
        <span
            style={{
                fontFamily: 'var(--font-mono)',
                fontSize,
                fontWeight: size === 'lg' ? 700 : 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
            }}
        >
            {formatted}
            {showCurrency && (
                <span
                    style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginLeft: '4px',
                        fontWeight: 400,
                    }}
                >
                    {currency}
                </span>
            )}
        </span>
    );
}
