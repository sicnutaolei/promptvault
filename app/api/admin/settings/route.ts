import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk } from '@/lib/http';
import { firstError, siteSettingsSchema } from '@/lib/validators';
import { getSlogan, setSlogan } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ ok: true, settings: { slogan: getSlogan() } });
}

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  return jsonOk({ settings: { slogan: setSlogan(parsed.data.slogan) } });
}