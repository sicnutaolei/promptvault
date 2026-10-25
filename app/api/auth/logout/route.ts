import { NextResponse } from 'next/server';
import { isSameOrigin, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { jsonError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
