'use client';

import { useEffect, useState } from 'react';
import KPIStrip from '@/components/dashboard/KPIStrip';
import PipelineTracker from '@/components/dashboard/PipelineTracker';
import InvoiceFeed from '@/components/dashboard/InvoiceFeed';
import AgentActivityLog from '@/components/dashboard/AgentActivityLog';
import { KPIData } from '@/lib/types';

export default function DashboardPage() {
    const [kpiData, setKpiData] = useState<KPIData | null>(null);

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
        <div style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}>
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
                <AgentActivityLog />
            </div>
        </div>
    );
}
