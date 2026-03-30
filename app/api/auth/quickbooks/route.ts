// ─── AutoAP — QuickBooks OAuth Redirect ───────────────────────────
// GET /api/auth/quickbooks → redirects to Intuit consent page

import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/quickbooks';

export async function GET() {
    try {
        const authUrl = getAuthorizationUrl();
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('[QB OAuth] Failed to generate auth URL:', error);
        return NextResponse.redirect(
            new URL('/settings?qb_error=config', 'http://localhost:3000')
        );
    }
}
