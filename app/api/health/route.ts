import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET() {
  try {
    getDb().prepare('SELECT 1').get();
    return NextResponse.json({ ok: true, db: true });
  } catch {
    return NextResponse.json({ ok: false, db: false }, { status: 500 });
  }
}
