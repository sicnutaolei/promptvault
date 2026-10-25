import { NextResponse } from 'next/server';
import { getSession } from './auth';
import type { SessionPayload } from './auth';

export function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

/** Returns the admin session, or a 401 response to return directly. */
export async function guardAdmin(): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) return { response: jsonError('未登录', 401) };
  return { session };
}

export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
