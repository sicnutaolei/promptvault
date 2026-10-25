import { NextResponse } from 'next/server';
import { getCollectionBySlug, getPromptsInCollection } from '@/lib/queries';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) return NextResponse.json({ error: '收藏夹不存在' }, { status: 404 });
  if (!collection.is_public) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '收藏夹不存在' }, { status: 404 });
  }
  const page = Number(new URL(req.url).searchParams.get('page')) || 1;
  return NextResponse.json({ ok: true, collection, ...getPromptsInCollection(collection.id, page) });
}
