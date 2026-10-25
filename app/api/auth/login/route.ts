import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { checkLoginRate, clearLoginFailures, clientIp, isSameOrigin, recordLoginFailure, sessionCookieOptions, SESSION_COOKIE, signSession } from '@/lib/auth';
import { firstError, loginSchema } from '@/lib/validators';
import { jsonError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const ip = clientIp(req);
  const limit = checkLoginRate(ip);
  if (limit.blocked) {
    return NextResponse.json({ error: '尝试次数过多，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('请求体必须是 JSON');
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  const row = getDb().prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(parsed.data.username) as
    | { id: number; username: string; password_hash: string }
    | undefined;
  const ok = row ? await bcrypt.compare(parsed.data.password, row.password_hash) : false;
  if (!row || !ok) {
    recordLoginFailure(ip);
    return jsonError('用户名或密码错误', 401);
  }
  clearLoginFailures(ip);
  const token = await signSession({ uid: row.id, username: row.username });
  const res = NextResponse.json({ ok: true, username: row.username });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
