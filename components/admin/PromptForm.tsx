'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { PromptDetail, PromptImage } from '@/lib/types';
import { deleteUpload, uploadImage } from './upload';

export type ImageInput = { role: 'example' | 'reference' | 'generated'; filePath: string; thumbPath: string };

const ROLE_LABEL: Record<ImageInput['role'], string> = { example: '示例图', reference: '参考图', generated: '生成结果' };

export default function PromptForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: PromptDetail }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || '');
  const [positive, setPositive] = useState(initial?.positive_prompt || '');
  const [negative, setNegative] = useState(initial?.negative_prompt || '');
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(initial?.visibility || 'public');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [images, setImages] = useState<ImageInput[]>(
    (initial?.images || []).map((i: PromptImage) => ({ role: i.role, filePath: i.file_path, thumbPath: i.thumb_path })),
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const fileRefs = {
    example: useRef<HTMLInputElement>(null),
    reference: useRef<HTMLInputElement>(null),
    generated: useRef<HTMLInputElement>(null),
  };
  // 已在数据库里的图片：移除只改表单，等 PATCH 成功后才由 updatePrompt 删文件。
  const savedPaths = useRef(new Set((initial?.images || []).map((i: PromptImage) => i.file_path)));

  async function addFiles(role: ImageInput['role'], files: FileList) {
    setErr(''); setBusy(true);
    try {
      const added: ImageInput[] = [];
      for (const file of Array.from(files)) {
        const up = await uploadImage(file, role);
        added.push({ role, filePath: up.filePath, thumbPath: up.thumbPath });
      }
      setImages((prev) => [...prev, ...added]);
      setMsg(`已上传 ${added.length} 张${ROLE_LABEL[role]}`);
    } catch (e) { setErr(e instanceof Error ? e.message : '上传失败'); }
    finally {
      setBusy(false);
      const ref = fileRefs[role].current; if (ref) ref.value = '';
    }
  }

  async function removeImage(index: number) {
    const img = images[index];
    if (!img) return;
    setErr('');
    // 本次新上传、尚未入库的图可以立刻删；已有图留到保存成功再删，取消编辑时不会把线上图片弄坏。
    if (!savedPaths.current.has(img.filePath)) {
      try { await deleteUpload(img.filePath, img.thumbPath); } catch { /* 交给孤儿清理 */ }
    } else {
      setMsg('已从表单移除，保存后才会删除原图');
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!title.trim()) { setErr('标题必填'); return; }
    if (!positive.trim()) { setErr('正向提示词必填'); return; }
    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        positive_prompt: positive,
        negative_prompt: negative || null,
        source_url: sourceUrl || null,
        notes: notes || null,
        visibility,
        tags: Array.from(new Set(tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean))),
        images,
      };
      const res = await fetch(mode === 'edit' ? `/api/admin/prompts/${initial!.id}` : '/api/admin/prompts', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '保存失败');
      router.push('/admin/prompts');
      router.refresh();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : '保存失败'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-[860px] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[20px] font-semibold text-[#2f3a4a]">{mode === 'edit' ? '编辑提示词' : '新建提示词'}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push('/admin/prompts')} className="pv-btn">返回</button>
          <button type="submit" disabled={busy} className="pv-btn pv-btn-primary">{busy ? '保存中…' : '保存'}</button>
        </div>
      </div>
      {msg ? <p className="rounded-lg border border-[#cfe9dd] bg-[#f2fbf7] px-3 py-2 text-[12.5px] text-[#3c8b68]">{msg}</p> : null}
      {err ? <p className="rounded-lg border border-[#f3d2d8] bg-[#fdf5f6] px-3 py-2 text-[12.5px] text-[#b4546a]">{err}</p> : null}

      <div className="pv-card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="title">标题 *</label>
          <input id="title" className="pv-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="pv-label" htmlFor="vis">可见性</label>
          <select id="vis" className="pv-input" value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}>
            <option value="public">公开（首页展示）</option>
            <option value="private">私有（仅后台可见）</option>
          </select>
        </div>
        <div>
          <label className="pv-label" htmlFor="tags">标签（逗号分隔）</label>
          <input id="tags" className="pv-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="portrait, cinematic, 赛博朋克" />
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="pos">正向提示词 *</label>
          <textarea id="pos" className="pv-input min-h-[120px]" value={positive} onChange={(e) => setPositive(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="neg">负向提示词</label>
          <textarea id="neg" className="pv-input min-h-[80px]" value={negative} onChange={(e) => setNegative(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="src">来源链接</label>
          <input id="src" className="pv-input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="notes">备注</label>
          <textarea id="notes" className="pv-input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="pv-card space-y-4 p-5">
        <div>
          <h2 className="text-[13px] font-medium text-[#6b7789]">图片（{images.length}）</h2>
          <p className="mt-1 text-[11.5px] text-[#98a3b3]">图片均为可选，不上传也能保存。支持 jpg / png / webp，单张不超过 {process.env.NEXT_PUBLIC_UPLOAD_MAX_MB || '10'} MB。已有图片在保存成功后才会删除原文件。</p>
        </div>
        {(['example', 'reference', 'generated'] as const).map((role) => (
          <div key={role} className="rounded-xl border border-[#ebeff5] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] text-[#5f6b7c]">{ROLE_LABEL[role]}</span>
              <div className="flex gap-2">
                <input ref={fileRefs[role]} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { if (e.target.files?.length) addFiles(role, e.target.files); }} />
                <button type="button" onClick={() => fileRefs[role].current?.click()} disabled={busy} className="pv-btn px-3 py-1 text-[11.5px]">
                  上传{ROLE_LABEL[role]}
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {images.map((img, index) => img.role === role ? (
                <div key={img.filePath} className="group relative overflow-hidden rounded-lg border border-[#ebeff5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/${img.thumbPath}`} alt={ROLE_LABEL[role]} className="aspect-square w-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] text-[#b4546a]">删除</button>
                </div>
              ) : null)}
              {images.every((i) => i.role !== role) ? <p className="text-[11.5px] text-[#a3adbb]">暂无</p> : null}
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}