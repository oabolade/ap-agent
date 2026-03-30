// ─── AutoAP — Single Invoice API ──────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { getInvoice } from '@/lib/mongodb';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const invoice = await getInvoice(id);

        if (!invoice) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: invoice });
    } catch (error) {
        console.error('[Invoice Detail API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
