import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, nowIso } from '@/lib/db';
import { getSession, isSameOrigin } from '@/lib/auth';
import { changePasswordSchema, firstError } from '@/lib/validators';
import { jsonError } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const session = await getSession();
  if (!session) return jsonError('未登录', 401);
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  const db = getDb();
  const row = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(session.uid) as { id: number; password_hash: string } | undefined;
  if (!row) return jsonError('账号不存在', 404);
  const ok = await bcrypt.compare(parsed.data.oldPassword, row.password_hash);
  if (!ok) return jsonError('原密码不正确', 400);
  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.id);
  return NextResponse.json({ ok: true, updated_at: nowIso() });
}
