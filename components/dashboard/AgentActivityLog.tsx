'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentLogEntry } from '@/lib/types';

const LEVEL_COLORS: Record<string, string> = {
    info: 'var(--text-secondary)',
    success: 'var(--accent-success)',
    warning: 'var(--accent-warning)',
    error: 'var(--accent-error)',
};

const LEVEL_ICONS: Record<string, string> = {
    info: '→',
    success: '✓',
    warning: '⚠',
    error: '✗',
};

// Map action names to log levels for color-coding
function getLevel(entry: AgentLogEntry): string {
    if (entry.level) return entry.level;
    const action = entry.action;
    if (action.includes('COMPLETE') || action.includes('APPROVED') || action.includes('VERIFIED') || action.includes('CREATED') || action === 'AUTO_APPROVE') return 'success';
    if (action.includes('ERROR') || action.includes('FAILED')) return 'error';
    if (action.includes('FALLBACK') || action.includes('MISS') || action === 'MATCH_FAILED') return 'warning';
    return 'info';
}

export default function AgentActivityLog({
    onStreamUrlChange
}: {
    onStreamUrlChange?: (url: string | null) => void;
}) {
    const [logs, setLogs] = useState<AgentLogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to live SSE stream
        let eventSource: EventSource | null = null;
        try {
            eventSource = new EventSource('/api/agent/stream');

            eventSource.onopen = () => {
                setIsConnected(true);
            };

            eventSource.onmessage = (event) => {
                try {
                    const entry = JSON.parse(event.data) as AgentLogEntry;
                    
                    // Handle streaming triggers without rendering them as text logs
                    if (entry.action === 'STREAMING_START') {
                        onStreamUrlChange?.(entry.detail);
                        return; // Prevent adding to logs
                    }
                    if (entry.action === 'STREAMING_END') {
                        onStreamUrlChange?.(null);
                        return; // Prevent adding to logs
                    }

                    setLogs(prev => {
                        // Deduplicate by timestamp + action
                        const key = `${entry.timestamp}-${entry.action}`;
                        const existing = prev.find(e => `${e.timestamp}-${e.action}` === key);
                        if (existing) return prev;
                        return [...prev, entry];
                    });
                } catch {
                    // Ignore parse errors (e.g. ping comments)
                }
            };

            eventSource.onerror = () => {
                setIsConnected(false);
            };
        } catch {
            // SSE not available
        }

        return () => {
            eventSource?.close();
        };
    }, []);

    // Auto-scroll on new entries
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logs]);

    return (
        <div
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <h3 style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    margin: 0,
                }}>
                    Agent Activity
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isConnected ? 'var(--accent-success)' : 'var(--accent-error)',
                        animation: isConnected ? 'pulse-cyan 2s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Log entries */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    background: '#080c16',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    lineHeight: '1.7',
                }}
            >
                {logs.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '11px' }}>
                        Waiting for agent activity...
                    </div>
                )}
                <AnimatePresence>
                    {logs.map((entry, idx) => {
                        const level = getLevel(entry);
                        const color = LEVEL_COLORS[level] || LEVEL_COLORS.info;
                        const icon = LEVEL_ICONS[level] || LEVEL_ICONS.info;
                        const time = new Date(String(entry.timestamp)).toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        });

                        return (
                            <motion.div
                                key={`${entry.timestamp}-${idx}`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    padding: '3px 0',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{time}</span>
                                <span style={{ color, flexShrink: 0 }}>{icon}</span>
                                <span style={{ color, wordBreak: 'break-word' }}>{entry.detail}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
