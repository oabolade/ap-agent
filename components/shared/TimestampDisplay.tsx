'use client';

import { useState, useEffect } from 'react';

function getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAbsoluteTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

export default function TimestampDisplay({ timestamp }: { timestamp: string }) {
    const [relative, setRelative] = useState(getRelativeTime(timestamp));

    useEffect(() => {
        const interval = setInterval(() => {
            setRelative(getRelativeTime(timestamp));
        }, 10000);
        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <span
            title={getAbsoluteTime(timestamp)}
            style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'default',
            }}
        >
            {relative}
        </span>
    );
}

export function TimeHHMMSS({ timestamp }: { timestamp: string }) {
    const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <span
            style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-muted)',
            }}
        >
            {time}
        </span>
    );
}
