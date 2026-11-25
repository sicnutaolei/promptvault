import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk } from '@/lib/http';
import { purgeOrphanUploads } from '@/lib/mutations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const removed = purgeOrphanUploads();
  return jsonOk({ removed });
}
