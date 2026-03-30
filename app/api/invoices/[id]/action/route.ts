// ─── AutoAP — Invoice Action API ──────────────────────────────────
// POST: { action: 'approve' | 'dispute' | 'escalate', note?: string }

import { NextRequest, NextResponse } from 'next/server';
import { getInvoice, updateInvoice } from '@/lib/mongodb';
import { logToAxiom } from '@/lib/observability';
import { PipelineStatus } from '@/lib/types';

const ACTION_MAP: Record<string, PipelineStatus> = {
    approve: 'APPROVED',
    dispute: 'DISPUTED',
    escalate: 'EXCEPTION',
};

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { action, note } = body as { action: string; note?: string };

        if (!action || !ACTION_MAP[action]) {
            return NextResponse.json(
                { success: false, error: 'Invalid action. Must be: approve, dispute, or escalate' },
                { status: 400 }
            );
        }

        const invoice = await getInvoice(id);
        if (!invoice) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        const newStatus = ACTION_MAP[action];
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'MANUAL_ACTION',
            detail: `${action.toUpperCase()} by user.${note ? ` Note: "${note}"` : ''}`,
            level: 'info' as const,
        };

        const updated = await updateInvoice(id, {
            status: newStatus,
            agent_log: [...(invoice.agent_log || []), logEntry],
        });

        await logToAxiom({
            invoiceId: id,
            action: 'MANUAL_ACTION',
            detail: `${action} — ${note || 'no note'}`,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[Invoice Action API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
