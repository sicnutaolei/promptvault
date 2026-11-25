import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk } from '@/lib/http';
import { collectionIdsSchema, firstError } from '@/lib/validators';
import { reorderCollections } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = collectionIdsSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  if (!reorderCollections(parsed.data.ids)) return jsonError('排序参数与现有收藏夹不一致', 409);
  return jsonOk();
}
