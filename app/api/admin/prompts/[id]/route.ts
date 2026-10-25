import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/auth';
import { guardAdmin, jsonError, jsonOk, parseId } from '@/lib/http';
import { firstError, promptSchema } from '@/lib/validators';
import { getPromptDetail } from '@/lib/queries';
import { deletePrompt, updatePrompt } from '@/lib/mutations';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const id = parseId((await params).id);
  if (!id) return jsonError('提示词不存在', 404);
  const prompt = getPromptDetail(id);
  if (!prompt) return jsonError('提示词不存在', 404);
  return NextResponse.json({ ok: true, prompt });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const id = parseId((await params).id);
  if (!id) return jsonError('提示词不存在', 404);
  const current = getPromptDetail(id);
  if (!current) return jsonError('提示词不存在', 404);
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('请求体必须是 JSON'); }
  const parsed = promptSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error));
  const d = parsed.data;
  const images = d.images !== undefined
    ? d.images
    : current.images.map((i) => ({ role: i.role, filePath: i.file_path, thumbPath: i.thumb_path }));
  const updated = updatePrompt(id, {
    title: d.title ?? current.title,
    type: d.type ?? current.type,
    positive_prompt: d.positive_prompt ?? current.positive_prompt,
    negative_prompt: d.negative_prompt !== undefined ? d.negative_prompt : current.negative_prompt,
    model: d.model !== undefined ? d.model : current.model,
    sampler: d.sampler !== undefined ? d.sampler : current.sampler,
    steps: d.steps !== undefined ? d.steps : current.steps,
    cfg_scale: d.cfg_scale !== undefined ? d.cfg_scale : current.cfg_scale,
    seed: d.seed !== undefined ? d.seed : current.seed,
    width: d.width !== undefined ? d.width : current.width,
    height: d.height !== undefined ? d.height : current.height,
    lora: d.lora !== undefined ? d.lora : current.lora,
    source_url: d.source_url !== undefined ? d.source_url : current.source_url,
    notes: d.notes !== undefined ? d.notes : current.notes,
    visibility: d.visibility ?? current.visibility,
    tags: d.tags !== undefined ? d.tags : current.tags,
    images,
  });
  return jsonOk({ prompt: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError('来源不合法', 403);
  const auth = await guardAdmin();
  if ('response' in auth) return auth.response;
  const id = parseId((await params).id);
  if (!id) return jsonError('提示词不存在', 404);
  if (!deletePrompt(id)) return jsonError('提示词不存在', 404);
  return jsonOk();
}
