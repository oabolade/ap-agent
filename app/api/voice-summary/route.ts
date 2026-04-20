// ─── AutoAP — Daily Voice Summary API ─────────────────────────────
// GET /api/voice-summary — Generates and returns an audio MP3 of the daily AP summary.
// Called on-demand when the user clicks the play button on the dashboard.

import { NextResponse } from 'next/server';
import { generateDailySummary, DailyStats } from '@/lib/elevenlabs';
import { MongoClient } from 'mongodb';

async function getDailyStats(): Promise<DailyStats> {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('user:pass@')) {
        // Return demo stats if no DB
        return {
            invoiceCount: 5,
            vendorCount: 3,
            totalAmount: 6080.00,
            exceptionCount: 1,
            averageConfidence: 92,
            timeSavedMinutes: 125,
        };
    }

    const client = new MongoClient(uri);
    await client.connect();
    const col = client.db('autoap').collection('invoices');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

    const invoices = await col.find({
        created_at: { $gte: startOfDay, $lte: endOfDay },
    }).toArray();

    const vendors = new Set(invoices.map(i => i.vendor_name).filter(Boolean));
    const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const exceptions = invoices.filter(i => i.status === 'EXCEPTION').length;
    const withConfidence = invoices.filter(i => i.reconciliation?.confidence_score != null);
    const avgConfidence = withConfidence.length > 0
        ? Math.round(withConfidence.reduce((sum, i) => sum + i.reconciliation.confidence_score, 0) / withConfidence.length)
        : 0;

    await client.close();

    return {
        invoiceCount: invoices.length || 5, // Fallback for demo
        vendorCount: vendors.size || 3,
        totalAmount: totalAmount || 6080.00,
        exceptionCount: exceptions,
        averageConfidence: avgConfidence || 92,
        timeSavedMinutes: (invoices.length || 5) * 25,
    };
}

export async function GET() {
    try {
        const stats = await getDailyStats();
        const audioBuffer = await generateDailySummary(stats);

        return new NextResponse(audioBuffer as any, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'inline; filename="autoap-daily-summary.mp3"',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error('[Voice Summary]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
