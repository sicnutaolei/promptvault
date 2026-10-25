import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/http';
import { listTags } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ ok: true, tags: listTags() });
}
