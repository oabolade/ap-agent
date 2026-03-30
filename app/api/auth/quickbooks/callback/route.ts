// ─── AutoAP — QuickBooks OAuth Callback ───────────────────────────
// GET /api/auth/quickbooks/callback → exchanges code for tokens

import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/quickbooks';

export async function GET(req: NextRequest) {
    try {
        const url = req.url;

        // Check for error from Intuit
        const errorParam = req.nextUrl.searchParams.get('error');
        if (errorParam) {
            console.error('[QB OAuth Callback] Error from Intuit:', errorParam);
            return NextResponse.redirect(
                new URL(`/settings?qb_error=${errorParam}`, req.url)
            );
        }

        // Exchange the authorization code for tokens
        const result = await handleOAuthCallback(url);
        console.log('[QB OAuth Callback] Success. Realm:', result.realmId);

        // Redirect back to settings with success indicator
        return NextResponse.redirect(
            new URL(`/settings?qb_connected=true&realm=${result.realmId}`, req.url)
        );
    } catch (error) {
        console.error('[QB OAuth Callback] Token exchange failed:', error);
        return NextResponse.redirect(
            new URL('/settings?qb_error=token_exchange', req.url)
        );
    }
}
