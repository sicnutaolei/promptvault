import { NextResponse } from 'next/server';
import { listPublicCollections } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, collections: listPublicCollections() });
}
