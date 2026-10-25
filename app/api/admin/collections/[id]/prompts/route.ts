import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk, parseId } from '@/lib/http';
import { firstError, promptIdsSchema } from '@/lib/validators';
import { getCollectionById } from '@/lib/queries';
import { setCollectionPrompts } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const id = parseId((await params).id);
  if (!id) return jsonError('参数错误', 404);
  if (!getCollectionById(id)) return jsonError('收藏夹不存在', 404);
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = promptIdsSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  setCollectionPrompts(id, parsed.data.promptIds);
  return jsonOk();
}
