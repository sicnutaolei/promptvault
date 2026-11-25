import { NextResponse } from 'next/server';
import { listPublicPrompts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const result = listPublicPrompts({
    q: sp.get('q')?.trim() || undefined,
    tag: sp.get('tag') || undefined,
    page: Number(sp.get('page')) || 1,
  });
  return NextResponse.json({ ok: true, ...result });
}