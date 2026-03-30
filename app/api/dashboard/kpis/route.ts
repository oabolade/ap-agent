// ─── AutoAP — Dashboard KPIs API ──────────────────────────────────
// Computes KPIs from live MongoDB invoice data.

import { NextResponse } from 'next/server';
import { getInvoices } from '@/lib/mongodb';

export async function GET() {
    try {
        const allInvoices = await getInvoices({ limit: 500 });

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart.getTime() - 86400000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Invoices today
        const invoicesToday = allInvoices.filter(inv => {
            const created = new Date(inv.created_at);
            return created >= todayStart;
        }).length;

        // Invoices yesterday (for delta)
        const invoicesYesterday = allInvoices.filter(inv => {
            const created = new Date(inv.created_at);
            return created >= yesterdayStart && created < todayStart;
        }).length;

        // Total processed this month (sum of approved amounts)
        const totalProcessedMonth = allInvoices
            .filter(inv => {
                const created = new Date(inv.created_at);
                return created >= monthStart && inv.status === 'APPROVED';
            })
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Pending approvals (RECEIVED, PARSING, MATCHING)
        const pendingApprovals = allInvoices.filter(inv =>
            ['RECEIVED', 'PARSING', 'MATCHING'].includes(inv.status)
        ).length;

        // Exceptions flagged
        const exceptionsFlagged = allInvoices.filter(inv =>
            inv.status === 'EXCEPTION'
        ).length;

        return NextResponse.json({
            success: true,
            data: {
                invoicesToday,
                invoicesTodayDelta: invoicesToday - invoicesYesterday,
                totalProcessedMonth,
                pendingApprovals,
                exceptionsFlagged,
            },
        });
    } catch (error) {
        console.error('[KPI API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
