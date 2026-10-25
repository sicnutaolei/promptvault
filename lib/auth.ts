import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getSessionSecret } from './db';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = { uid: number; username: string };

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ uid: payload.uid, username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (typeof payload.uid !== 'number' || typeof payload.username !== 'string') return null;
    return { uid: payload.uid, username: payload.username };
  } catch {
    return null;
  }
}

/** Read the current admin session from cookies (server components + route handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  return getSession();
}

/** Basic CSRF guard: when an Origin header is present it must match this host. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

type Attempt = { fails: number; resetAt: number };
const globalForLimit = globalThis as unknown as { __pvAttempts?: Map<string, Attempt> };
const attempts: Map<string, Attempt> = globalForLimit.__pvAttempts || new Map();
globalForLimit.__pvAttempts = attempts;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;

export function checkLoginRate(ip: string): { blocked: boolean; retryAfter: number } {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt <= now) return { blocked: false, retryAfter: 0 };
  if (rec.fails >= MAX_FAILS) {
    return { blocked: true, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
  }
  return { blocked: false, retryAfter: 0 };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt <= now) {
    attempts.set(ip, { fails: 1, resetAt: now + WINDOW_MS });
    return;
  }
  rec.fails += 1;
  if (attempts.size > 5000) {
    for (const [key, value] of attempts) if (value.resetAt <= now) attempts.delete(key);
  }
}

export function clearLoginFailures(ip: string): void {
  attempts.delete(ip);
}
