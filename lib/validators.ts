import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, '新密码至少 8 位').max(200),
});

const relPath = z.string().trim().min(1).max(300).regex(/^(original|thumb)\/[A-Za-z0-9._-]+$/, '非法路径');

export const collectionSchema = z.object({
  name: z.string().trim().min(1, '名称必填').max(120),
  slug: z.string().trim().max(80).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  is_public: z.union([z.boolean(), z.number().int()]).optional(),
  sort_order: z.number().int().min(-9999).max(9999).optional(),
  cover_path: relPath.optional().nullable(),
  cover_thumb_path: relPath.optional().nullable(),
});

export const imageSchema = z.object({
  role: z.enum(['example', 'reference', 'generated']),
  filePath: relPath,
  thumbPath: relPath,
});

export const promptSchema = z.object({
  title: z.string().trim().min(1, '标题必填').max(200),
  type: z.enum(['text2img', 'img2img']),
  positive_prompt: z.string().min(1, '正向提示词必填').max(20000),
  negative_prompt: z.string().max(20000).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  sampler: z.string().max(200).optional().nullable(),
  steps: z.number().int().min(1).max(1000).optional().nullable(),
  cfg_scale: z.number().min(0).max(100).optional().nullable(),
  seed: z.string().max(100).optional().nullable(),
  width: z.number().int().min(1).max(20000).optional().nullable(),
  height: z.number().int().min(1).max(20000).optional().nullable(),
  lora: z.string().max(1000).optional().nullable(),
  source_url: z.string().max(1000).optional().nullable(),
  notes: z.string().max(8000).optional().nullable(),
  visibility: z.enum(['public', 'private']).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  images: z.array(imageSchema).max(20).optional(),
});

export const roleSchema = z.enum(['example', 'reference', 'generated']);
export const promptIdsSchema = z.object({ promptIds: z.array(z.number().int().positive()).max(500) });
export const deleteUploadSchema = z.object({ filePath: relPath, thumbPath: relPath });

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message || '参数不合法';
}
