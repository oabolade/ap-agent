// ─── AutoAP — Dashboard KPIs API (Phase 2) ───────────────────────
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
        const approvedInvoices = allInvoices.filter(inv => {
            const created = new Date(inv.created_at);
            return created >= monthStart && inv.status === 'APPROVED';
        });
        const totalProcessedMonth = approvedInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Pending approvals (RECEIVED, PARSING, MATCHING, EXTRACTING, RECONCILING)
        const pendingApprovals = allInvoices.filter(inv =>
            ['RECEIVED', 'PARSING', 'MATCHING', 'EXTRACTING', 'RECONCILING'].includes(inv.status)
        ).length;

        // Pending reviews (PENDING_REVIEW status)
        const pendingReviews = allInvoices.filter(inv =>
            inv.status === 'PENDING_REVIEW'
        ).length;

        // Exceptions flagged
        const exceptionsFlagged = allInvoices.filter(inv =>
            inv.status === 'EXCEPTION'
        ).length;

        // Time saved: 25 min per auto-approved invoice (industry avg manual processing time)
        const timeSavedMinutes = approvedInvoices.length * 25;

        // Average confidence score (from invoices with reconciliation data)
        const withConfidence = allInvoices.filter(inv =>
            inv.reconciliation && typeof (inv.reconciliation as Record<string, unknown>).confidence_score === 'number'
        );
        const averageConfidence = withConfidence.length > 0
            ? Math.round(
                withConfidence.reduce((sum, inv) => sum + ((inv.reconciliation as Record<string, unknown>).confidence_score as number), 0) / withConfidence.length
            )
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                invoicesToday,
                invoicesTodayDelta: invoicesToday - invoicesYesterday,
                totalProcessedMonth,
                pendingApprovals,
                pendingReviews,
                exceptionsFlagged,
                timeSavedMinutes,
                averageConfidence,
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

