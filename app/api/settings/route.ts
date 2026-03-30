// ─── AutoAP — Settings API ────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/mongodb';

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error('[Settings API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const updated = await updateSettings(body);
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[Settings API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
