import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk } from '@/lib/http';
import { firstError, roleSchema, deleteUploadSchema } from '@/lib/validators';
import { ORIGINAL_DIR, THUMB_DIR } from '@/lib/db';
import { unlinkUpload } from '@/lib/media';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 10);
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError('请求必须是 multipart/form-data');
  }
  const file = form.get('file');
  if (!(file instanceof File)) return jsonError('缺少文件字段 file');
  if (file.size > MAX_MB * 1024 * 1024) return jsonError(`图片不能超过 ${MAX_MB} MB`, 413);
  if (file.type === 'image/svg+xml') return jsonError('不支持 SVG', 400);
  if (!ALLOWED.has(file.type)) return jsonError('仅支持 jpg / png / webp', 400);
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.svg')) return jsonError('不支持 SVG', 400);
  const roleParsed = roleSchema.safeParse(form.get('role') || 'example');
  if (!roleParsed.success) return jsonError(firstError(roleParsed.error));
  const buffer = Buffer.from(await file.arrayBuffer());
  const uuid = crypto.randomUUID();
  const originalRel = `original/${uuid}.webp`;
  const thumbRel = `thumb/${uuid}.webp`;
  fs.mkdirSync(ORIGINAL_DIR, { recursive: true });
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  try {
    const input = sharp(buffer, { failOn: 'error' }).rotate();
    const meta = await input.metadata();
    if (!meta.width || !meta.height) throw new Error('empty image');
    await input.clone().webp({ quality: 90 }).toFile(path.join(ORIGINAL_DIR, `${uuid}.webp`));
    await input.clone().resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(THUMB_DIR, `${uuid}.webp`));
  } catch {
    unlinkUpload(originalRel);
    unlinkUpload(thumbRel);
    return jsonError('无法解析的图片文件', 400);
  }
  return jsonOk({ role: roleParsed.data, filePath: originalRel, thumbPath: thumbRel, url: `/media/${originalRel}` });
}

export async function DELETE(req: Request) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = deleteUploadSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  unlinkUpload(parsed.data.filePath);
  unlinkUpload(parsed.data.thumbPath);
  return jsonOk();
}
