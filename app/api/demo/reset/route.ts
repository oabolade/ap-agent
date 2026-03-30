// ─── AutoAP — Demo Data Seed/Reset API ────────────────────────────
// POST /api/demo/reset — cleans stale test data and optionally seeds demo records.
// DELETE stale = removes invoices with no vendor_name, $0 amount, or "DB Connection Test"

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const DB_NAME = 'autoap';

async function getCollection() {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('user:pass@')) {
        throw new Error('MONGODB_URI not configured');
    }
    const client = await new MongoClient(uri).connect();
    return { col: client.db(DB_NAME).collection('invoices'), client };
}

export async function POST() {
    try {
        const { col, client } = await getCollection();

        // Remove stale test invoices
        const deleteResult = await col.deleteMany({
            $or: [
                { vendor_name: '' },
                { vendor_name: null },
                { vendor_name: 'DB Connection Test' },
                { amount: 0 },
                { amount: null },
            ],
        });

        await client.close();

        return NextResponse.json({
            success: true,
            data: {
                deleted: deleteResult.deletedCount,
                message: `Cleaned ${deleteResult.deletedCount} stale test invoice(s).`,
            },
        });
    } catch (error) {
        console.error('[Demo Reset API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
