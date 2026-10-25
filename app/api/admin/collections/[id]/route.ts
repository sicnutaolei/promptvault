import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk, parseId } from '@/lib/http';
import { collectionSchema, firstError } from '@/lib/validators';
import { collectionPromptIds, getCollectionById } from '@/lib/queries';
import { deleteCollection, updateCollection } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const id = parseId((await params).id);
  if (!id) return jsonError('参数错误', 404);
  const collection = getCollectionById(id);
  if (!collection) return jsonError('收藏夹不存在', 404);
  return NextResponse.json({ ok: true, collection, promptIds: collectionPromptIds(id) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const id = parseId((await params).id);
  if (!id) return jsonError('参数错误', 404);
  const current = getCollectionById(id);
  if (!current) return jsonError('收藏夹不存在', 404);
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = collectionSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  const d = parsed.data;
  const updated = updateCollection(id, {
    name: d.name ?? current.name,
    slug: d.slug !== undefined ? d.slug : current.slug,
    description: d.description !== undefined ? d.description : current.description,
    is_public: d.is_public !== undefined ? d.is_public : current.is_public,
    sort_order: d.sort_order !== undefined ? d.sort_order : current.sort_order,
    cover_path: d.cover_path !== undefined ? d.cover_path : undefined,
    cover_thumb_path: d.cover_thumb_path !== undefined ? d.cover_thumb_path : undefined,
  });
  return jsonOk({ collection: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const id = parseId((await params).id);
  if (!id) return jsonError('参数错误', 404);
  if (!deleteCollection(id)) return jsonError('收藏夹不存在', 404);
  return jsonOk();
}
