// ─── AutoAP — Vendor Seed Script ──────────────────────────────────
// Seeds the MongoDB `vendors` collection with 3 vendor archetypes.
// Run: npx tsx scripts/seed-vendors.ts

import { config } from 'dotenv';
config({ path: '.env' });

import { MongoClient } from 'mongodb';

const DB_NAME = 'autoap';

interface VendorDoc {
    vendor_id: string;
    vendor_name: string;
    vendor_type: 'PLATFORM' | 'SAAS' | 'UTILITY';
    portal_url: string;
    logo_url: string;
    navigation_hint: string;
    active: boolean;
    created_at: Date;
}

// Portal URLs use the same ngrok tunnel — different Next.js routes
const BASE_URL = process.env.VENDOR_PORTAL_URL?.replace(/\/vendor-portal.*/, '') || 'http://localhost:3000';

const VENDORS: VendorDoc[] = [
    {
        vendor_id: 'amazon-business',
        vendor_name: 'Amazon Business',
        vendor_type: 'PLATFORM',
        portal_url: `${BASE_URL}/vendor-portal/amazon-business`,
        logo_url: '/logos/amazon.svg',
        navigation_hint: 'This is a large e-commerce platform portal with a table-based layout. Look for a search bar labeled "Search by PO Number" at the top of the page. Results appear in a table with columns: Item, Qty, Unit Price, Total.',
        active: true,
        created_at: new Date(),
    },
    {
        vendor_id: 'saas-billing',
        vendor_name: 'CloudHost Pro',
        vendor_type: 'SAAS',
        portal_url: `${BASE_URL}/vendor-portal/saas-billing`,
        logo_url: '/logos/saas.svg',
        navigation_hint: 'This is a modern SaaS billing portal with a card-based layout. Look for a search field labeled "Find Invoice". Results render as styled cards showing subscription period and recurring charges.',
        active: true,
        created_at: new Date(),
    },
    {
        vendor_id: 'utility-portal',
        vendor_name: 'Metro Utilities Inc',
        vendor_type: 'UTILITY',
        portal_url: `${BASE_URL}/vendor-portal/utility-portal`,
        logo_url: '/logos/utility.svg',
        navigation_hint: 'This is a traditional enterprise utility portal with a form-heavy layout. Look for a field labeled "Account / PO Lookup". Results display in a definition list format with base charges, taxes, and fees broken out.',
        active: true,
        created_at: new Date(),
    },
];

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(DB_NAME);
    const col = db.collection('vendors');

    // Drop existing vendors and reseed
    await col.deleteMany({});
    console.log('🧹 Cleared existing vendors');

    await col.insertMany(VENDORS);
    console.log(`✅ Seeded ${VENDORS.length} vendors:`);

    for (const v of VENDORS) {
        console.log(`   • ${v.vendor_id} (${v.vendor_type}) → ${v.portal_url}`);
    }

    // Create index on vendor_id for fast lookups
    await col.createIndex({ vendor_id: 1 }, { unique: true });
    console.log('📇 Created unique index on vendor_id');

    await client.close();
}

main().catch(console.error);
