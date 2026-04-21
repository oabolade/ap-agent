import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const DB_NAME = 'autoap';

interface WaitlistGlobal {
  _waitlistClientPromise?: Promise<MongoClient>;
}

const g = globalThis as unknown as WaitlistGlobal;

function getClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('user:pass@')) return null;

  if (!g._waitlistClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      tls: true,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    });
    g._waitlistClientPromise = client.connect();
  }

  return g._waitlistClientPromise;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    const clientPromise = getClientPromise();

    if (clientPromise) {
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection('waitlist');

      await collection.updateOne(
        { email },
        {
          $setOnInsert: {
            email,
            created_at: new Date(),
            source: 'landing',
          },
        },
        { upsert: true }
      );
    } else {
      // No MongoDB — log for now
      console.log(`[Waitlist] Email captured (no DB): ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Waitlist] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
