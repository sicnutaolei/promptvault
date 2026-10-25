import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk } from '@/lib/http';
import { firstError, promptSchema } from '@/lib/validators';
import { listAdminPrompts } from '@/lib/queries';
import { createPrompt } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const sp = new URL(req.url).searchParams;
  return NextResponse.json({
    ok: true,
    ...listAdminPrompts({
      q: sp.get('q')?.trim() || undefined,
      type: sp.get('type') || undefined,
      visibility: sp.get('visibility') || undefined,
      page: Number(sp.get('page')) || 1,
    }),
  });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = promptSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  const prompt = createPrompt(parsed.data);
  return jsonOk({ prompt }, 201);
}
