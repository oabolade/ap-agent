// ─── AutoAP — MongoDB Connection + Helpers ────────────────────────
// Uses the real MongoDB driver when MONGODB_URI is set.
// Falls back to in-memory mock data otherwise.

import { MongoClient, Db, Collection } from 'mongodb';
import { Invoice, Settings } from './types';
import { MOCK_INVOICES, MOCK_SETTINGS } from './mock-data';

// ─── Connection Singleton ─────────────────────────────────────────
// In Next.js, modules get re-evaluated on hot-reload in dev mode.
// We cache the client promise on `globalThis` to avoid opening
// multiple connections during development.

const DB_NAME = 'autoap';

interface MongoGlobal {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoUri?: string;
}

const g = globalThis as unknown as MongoGlobal;

function getMongoUri(): string | null {
    // Read lazily so env vars loaded by Next.js / dotenv are available
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('user:pass@')) return null;
    return uri;
}

function getClientPromise(): Promise<MongoClient> | null {
    const uri = getMongoUri();
    if (!uri) return null; // Not configured — fall back to mocks

    // If URI changed (e.g. .env hot-reload), drop the old connection
    if (g._mongoUri && g._mongoUri !== uri) {
        g._mongoClientPromise = undefined;
    }

    if (!g._mongoClientPromise) {
        g._mongoUri = uri;
        const client = new MongoClient(uri, {
            maxPoolSize: 10,
            minPoolSize: 2,
            tls: true,
            serverSelectionTimeoutMS: 10000,
            retryWrites: true,
        });
        g._mongoClientPromise = client.connect();
        console.log('[MongoDB] Connecting to Atlas...');
    }

    return g._mongoClientPromise;
}

// ─── Database + Collection Accessors ──────────────────────────────
async function getDb(): Promise<Db | null> {
    const clientPromise = getClientPromise();
    if (!clientPromise) return null;
    const client = await clientPromise;
    return client.db(DB_NAME);
}

async function invoicesCol(): Promise<Collection<Invoice> | null> {
    const db = await getDb();
    return db ? (db.collection('invoices') as unknown as Collection<Invoice>) : null;
}

async function settingsCol(): Promise<Collection<Settings> | null> {
    const db = await getDb();
    return db ? (db.collection('settings') as unknown as Collection<Settings>) : null;
}

function isUsingMocks(): boolean {
    return !getClientPromise();
}

// ─── Mock State (fallback) ────────────────────────────────────────
let mockInvoices = [...MOCK_INVOICES];
let mockSettings = { ...MOCK_SETTINGS };

// ─── Ensure Indexes (run once on first connection) ────────────────
let indexesCreated = false;
async function ensureIndexes() {
    if (indexesCreated) return;
    const col = await invoicesCol();
    if (!col) return;

    await col.createIndex({ status: 1 });
    await col.createIndex({ created_at: -1 });
    await col.createIndex({ vendor_email: 1 });

    indexesCreated = true;
    console.log('[MongoDB] Indexes created on invoices collection.');
}

// ─── Invoice Helpers ──────────────────────────────────────────────

export async function getInvoices(params?: {
    status?: string;
    limit?: number;
    page?: number;
}): Promise<Invoice[]> {
    if (isUsingMocks()) {
        let filtered = [...mockInvoices];
        if (params?.status && params.status !== 'all') {
            filtered = filtered.filter(inv => inv.status === params.status);
        }
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const limit = params?.limit || 50;
        const page = params?.page || 1;
        const start = (page - 1) * limit;
        return filtered.slice(start, start + limit);
    }

    await ensureIndexes();
    const col = (await invoicesCol())!;
    const filter: Record<string, unknown> = {};
    if (params?.status && params.status !== 'all') {
        filter.status = params.status;
    }
    const limit = params?.limit || 50;
    const page = params?.page || 1;
    const skip = (page - 1) * limit;

    return col
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray() as unknown as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
    if (isUsingMocks()) {
        return mockInvoices.find(inv => inv._id === id) || null;
    }

    const col = (await invoicesCol())!;
    return col.findOne({ _id: id as unknown as Invoice['_id'] }) as unknown as Invoice | null;
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    const newInvoice: Invoice = {
        _id: `inv-${Date.now()}`,
        invoice_number: '',
        vendor_name: '',
        vendor_email: '',
        amount: 0,
        currency: 'USD',
        due_date: new Date().toISOString(),
        line_items: [],
        po_number: null,
        po_amount: null,
        match_result: null,
        match_delta: null,
        status: 'RECEIVED',
        qb_bill_id: null,
        payment_scheduled_date: null,
        agent_log: [],
        raw_email: '',
        raw_pdf_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...invoice,
    };

    if (isUsingMocks()) {
        mockInvoices.unshift(newInvoice);
        return newInvoice;
    }

    const col = (await invoicesCol())!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col.insertOne(newInvoice as any);
    console.log(`[MongoDB] Invoice created: ${newInvoice._id}`);
    return newInvoice;
}

export async function updateInvoice(
    id: string,
    update: Partial<Invoice> & Record<string, unknown>
): Promise<Invoice | null> {
    if (isUsingMocks()) {
        const idx = mockInvoices.findIndex(inv => inv._id === id);
        if (idx === -1) return null;
        mockInvoices[idx] = {
            ...mockInvoices[idx],
            ...update,
            updated_at: new Date().toISOString(),
        } as Invoice;
        return mockInvoices[idx];
    }

    const col = (await invoicesCol())!;
    const result = await col.findOneAndUpdate(
        { _id: id as unknown as Invoice['_id'] },
        {
            $set: {
                ...update,
                updated_at: new Date().toISOString(),
            },
        },
        { returnDocument: 'after' }
    );

    return result as unknown as Invoice | null;
}

// ─── Settings Helpers ─────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
    if (isUsingMocks()) {
        return { ...mockSettings };
    }

    const col = (await settingsCol())!;
    const doc = await col.findOne({ _id: 'global' as unknown as Settings['_id'] });
    if (!doc) {
        // Seed default settings on first access
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await col.insertOne(MOCK_SETTINGS as any);
        console.log('[MongoDB] Default settings seeded.');
        return { ...MOCK_SETTINGS };
    }
    return doc as unknown as Settings;
}

export async function updateSettings(update: Partial<Settings>): Promise<Settings> {
    if (isUsingMocks()) {
        mockSettings = { ...mockSettings, ...update };
        return mockSettings;
    }

    const col = (await settingsCol())!;
    const result = await col.findOneAndUpdate(
        { _id: 'global' as unknown as Settings['_id'] },
        { $set: update },
        { returnDocument: 'after', upsert: true }
    );

    return result as unknown as Settings;
}

// ─── Health Check ─────────────────────────────────────────────────
export async function checkConnection(): Promise<{ connected: boolean; mode: string }> {
    if (isUsingMocks()) {
        return { connected: false, mode: 'mock' };
    }

    try {
        const db = await getDb();
        if (!db) return { connected: false, mode: 'mock' };
        await db.command({ ping: 1 });
        return { connected: true, mode: 'atlas' };
    } catch {
        return { connected: false, mode: 'error' };
    }
}
