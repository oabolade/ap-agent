'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign, Clock, AlertTriangle, Zap } from 'lucide-react';
import { KPIData } from '@/lib/types';

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const duration = 1200;
        const steps = 30;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = Math.min(current + increment, value);
            setDisplay(current);
            if (step >= steps) {
                setDisplay(value);
                clearInterval(timer);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    const formatted = prefix === '$'
        ? `$${display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `${prefix}${Math.round(display).toLocaleString()}${suffix}`;

    return <span>{formatted}</span>;
}

interface KPICardProps {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    delta?: number;
    icon: React.ReactNode;
    accentColor: string;
    glowShadow: string;
}

function KPICard({ title, value, prefix, suffix, delta, icon, accentColor, glowShadow }: KPICardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            }}
            whileHover={{
                boxShadow: glowShadow,
                borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
            }}
        >
            {/* Background glow */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
                    transform: 'translate(30%, -30%)',
                }}
            />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {title}
                </span>
                <div style={{ color: accentColor, opacity: 0.6 }}>
                    {icon}
                </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <AnimatedNumber value={value} prefix={prefix || ''} suffix={suffix || ''} />
            </div>

            {delta !== undefined && (
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: delta >= 0 ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                    {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs yesterday
                </div>
            )}
        </motion.div>
    );
}

export default function KPIStrip({ data }: { data: KPIData }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
            marginBottom: '20px',
        }}>
            <KPICard
                title="Invoices Today"
                value={data.invoicesToday}
                delta={data.invoicesTodayDelta}
                icon={<FileText size={18} />}
                accentColor="var(--accent-cyan)"
                glowShadow="var(--shadow-glow-cyan)"
            />
            <KPICard
                title="Processed (Month)"
                value={data.totalProcessedMonth}
                prefix="$"
                icon={<DollarSign size={18} />}
                accentColor="var(--accent-success)"
                glowShadow="var(--shadow-glow-success)"
            />
            <KPICard
                title="Pending Approvals"
                value={data.pendingApprovals + (data.pendingReviews || 0)}
                icon={<Clock size={18} />}
                accentColor="var(--accent-warning)"
                glowShadow="var(--shadow-glow-warning)"
            />
            <KPICard
                title="Exceptions Flagged"
                value={data.exceptionsFlagged}
                icon={<AlertTriangle size={18} />}
                accentColor={data.exceptionsFlagged > 0 ? 'var(--accent-error)' : 'var(--accent-success)'}
                glowShadow={data.exceptionsFlagged > 0 ? 'var(--shadow-glow-error)' : 'var(--shadow-glow-success)'}
            />
            <KPICard
                title="Time Saved"
                value={data.timeSavedMinutes || 0}
                suffix=" min"
                icon={<Zap size={18} />}
                accentColor="#a78bfa"
                glowShadow="0 0 20px rgba(167, 139, 250, 0.15)"
            />
        </div>
    );
}
