'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/exceptions', label: 'Exceptions' },
    { href: '/settings', label: 'Settings' },
];

export default function NavHeader() {
    const pathname = usePathname();

    // Hide on landing page — it has its own nav
    if (pathname === '/') return null;

    return (
        <header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                height: '52px',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link
                    href="/dashboard"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                    }}
                >
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, var(--accent-cyan), #0088cc)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Activity size={16} color="white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>
                        Auto<span style={{ color: 'var(--accent-cyan)' }}>AP</span>
                    </span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px' }}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    textDecoration: 'none',
                                    transition: 'all 0.15s ease',
                                    fontWeight: isActive ? 600 : 500,
                                    background: isActive ? 'var(--bg-hover)' : 'transparent',
                                }}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a
                    href="https://app.agentops.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        border: '1px solid var(--border-default)',
                        transition: 'all 0.15s ease',
                    }}
                >
                    AgentOps ↗
                </a>
                <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-success))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--bg-base)',
                }}>
                    AP
                </div>
            </div>
        </header>
    );
}
