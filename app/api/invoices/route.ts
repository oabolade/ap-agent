// ─── AutoAP — Invoices List API ───────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { getInvoices } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'all';
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const page = parseInt(searchParams.get('page') || '1', 10);

        const invoices = await getInvoices({ status, limit, page });

        return NextResponse.json({
            success: true,
            data: invoices,
            meta: { total: invoices.length, page, limit },
        });
    } catch (error) {
        console.error('[Invoices API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
