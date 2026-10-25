import { NextResponse } from 'next/server';
import { getPromptDetail } from '@/lib/queries';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
  const prompt = getPromptDetail(id);
  if (!prompt) return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
  if (!prompt.publiclyVisible) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, prompt });
}
