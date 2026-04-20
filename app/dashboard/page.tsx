'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KPIStrip from '@/components/dashboard/KPIStrip';
import PipelineTracker from '@/components/dashboard/PipelineTracker';
import InvoiceFeed from '@/components/dashboard/InvoiceFeed';
import AgentActivityLog from '@/components/dashboard/AgentActivityLog';
import { KPIData } from '@/lib/types';

export default function DashboardPage() {
    const [kpiData, setKpiData] = useState<KPIData | null>(null);
    const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);

    useEffect(() => {
        async function fetchKPIs() {
            try {
                const res = await fetch('/api/dashboard/kpis');
                const data = await res.json();
                if (data.success) {
                    setKpiData(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch KPIs:', err);
            }
        }

        fetchKPIs();
        const interval = setInterval(fetchKPIs, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
            {/* KPI Strip */}
            {kpiData && <KPIStrip data={kpiData} />}

            {/* 3-Column Dashboard */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr 320px',
                    gap: '16px',
                    height: 'calc(100vh - 200px)',
                    minHeight: '500px',
                }}
            >
                {/* Left: Pipeline Status */}
                <PipelineTracker />

                {/* Center: Invoice Feed */}
                <InvoiceFeed />

                {/* Right: Agent Activity Log */}
                <AgentActivityLog onStreamUrlChange={setActiveStreamUrl} />
            </div>

            {/* Live Agent Video Overlay */}
            <AnimatePresence>
                {activeStreamUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: 'absolute',
                            top: '110px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 'calc(100% - 640px)', // Fits centered between the sidebars roughly
                            minWidth: '700px',
                            height: 'calc(100vh - 240px)',
                            minHeight: '460px',
                            background: 'rgba(8, 12, 22, 0.95)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 240, 255, 0.1)',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header Bar */}
                        <div style={{
                            padding: '12px 20px',
                            borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(0,0,0,0.3)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: 'var(--accent-primary)',
                                    animation: 'pulse-cyan 2s ease-in-out infinite'
                                }} />
                                <span style={{ color: 'white', fontWeight: 500, letterSpacing: '0.02em', fontSize: '13px' }}>
                                    TinyFish Agent — Live View
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                AUTOAP PORTAL VERIFICATION
                            </span>
                        </div>
                        
                        {/* Iframe Container */}
                        <div style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
                            <iframe 
                                src={activeStreamUrl} 
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="fullscreen"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
