import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk } from '@/lib/http';
import { collectionSchema, firstError } from '@/lib/validators';
import { listAllCollections } from '@/lib/queries';
import { createCollection } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ ok: true, collections: listAllCollections() });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  const collection = createCollection(parsed.data);
  return jsonOk({ collection }, 201);
}
