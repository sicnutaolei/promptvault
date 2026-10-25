import { NextResponse } from 'next/server';
import { searchPrompts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const result = searchPrompts({
    q: sp.get('q')?.trim() || undefined,
    type: sp.get('type') || undefined,
    model: sp.get('model') || undefined,
    tag: sp.get('tag') || undefined,
    page: Number(sp.get('page')) || 1,
  });
  return NextResponse.json({ ok: true, ...result });
}
