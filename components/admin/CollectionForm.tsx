'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { CollectionRow } from '@/lib/types';
import { deleteUpload, uploadImage } from './upload';

export interface PromptOption { id: number; title: string; type: string; visibility: string }

export default function CollectionForm({
  mode, initial, promptOptions = [], selectedIds = [],
}: { mode: 'create' | 'edit'; initial?: CollectionRow; promptOptions?: PromptOption[]; selectedIds?: number[] }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [isPublic, setIsPublic] = useState(initial ? initial.is_public === 1 : true);
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [cover, setCover] = useState<{ path: string; thumb: string } | null>(
    initial?.cover_path ? { path: initial.cover_path, thumb: initial.cover_thumb_path || initial.cover_path } : null,
  );
  const [ids, setIds] = useState<number[]>(selectedIds);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => promptOptions.filter((p) => !filter || p.title.toLowerCase().includes(filter.toLowerCase())),
    [promptOptions, filter],
  );

  async function pickCover(file: File) {
    setBusy(true); setErr('');
    try {
      const up = await uploadImage(file, 'example');
      if (cover) await deleteUpload(cover.path, cover.thumb);
      setCover({ path: up.filePath, thumb: up.thumbPath });
      setMsg('封面上传成功');
    } catch (e) { setErr(e instanceof Error ? e.message : '上传失败'); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function removeCover() {
    if (!cover) return;
    await deleteUpload(cover.path, cover.thumb);
    setCover(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!name.trim()) { setErr('名称必填'); return; }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim() || null,
        description: description.trim() || null,
        is_public: isPublic ? 1 : 0,
        sort_order: Number(sortOrder) || 0,
      };
      if (cover) { body.cover_path = cover.path; body.cover_thumb_path = cover.thumb; }
      const res = await fetch(mode === 'edit' ? `/api/admin/collections/${initial!.id}` : '/api/admin/collections', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '保存失败');
      const id = mode === 'edit' ? initial!.id : data.collection.id;
      if (mode === 'edit') {
        const r2 = await fetch(`/api/admin/collections/${id}/prompts`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promptIds: ids }),
        });
        if (!r2.ok) throw new Error('收藏夹已保存，但提示词关联失败');
      }
      router.push('/admin/collections');
      router.refresh();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : '保存失败'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[20px] font-bold">{mode === 'edit' ? '编辑收藏夹' : '新建收藏夹'}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push('/admin/collections')} className="pv-btn">返回</button>
          <button type="submit" disabled={busy} className="pv-btn pv-btn-primary">{busy ? '保存中…' : '保存'}</button>
        </div>
      </div>
      {msg ? <p className="rounded-lg border border-[#204b3a] bg-[#10241d] px-3 py-2 text-[12.5px] text-[#7ee2b8]">{msg}</p> : null}
      {err ? <p className="rounded-lg border border-[#6b2436] bg-[#3a1520] px-3 py-2 text-[12.5px] text-[#ff9db0]">{err}</p> : null}

      <div className="pv-card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="pv-label" htmlFor="name">名称 *</label>
          <input id="name" className="pv-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="pv-label" htmlFor="slug">Slug（留空自动生成）</label>
          <input id="slug" className="pv-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cyberpunk-portraits" />
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="desc">描述</label>
          <textarea id="desc" className="pv-input min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="pv-label" htmlFor="sort">排序（小的在前）</label>
          <input id="sort" type="number" className="pv-input" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-[13px] text-[#a9b6d8]">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-[#5b8cff]" />
            公开收藏夹（游客可见）
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label">封面</label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-20 w-32 overflow-hidden rounded-lg border border-[#232b45] bg-[#0e1425]">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/media/${cover.thumb}`} alt="封面" className="h-full w-full object-cover" />
              ) : <div className="grid h-full place-items-center text-[11px] text-[#56628a]">无封面</div>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickCover(f); }} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="pv-btn">上传封面</button>
            {cover ? <button type="button" onClick={removeCover} className="pv-btn pv-btn-danger">移除封面</button> : null}
          </div>
        </div>
      </div>
      {mode === 'edit' ? (
        <div className="pv-card p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">收藏夹内容（{ids.length} 条）</h2>
            <input className="pv-input max-w-[220px]" placeholder="过滤标题…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? <p className="text-[12.5px] text-[#8b97b8]">没有提示词。</p> : filtered.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-[#18203a]">
                <input type="checkbox" className="h-4 w-4 accent-[#5b8cff]" checked={ids.includes(p.id)}
                  onChange={(e) => setIds((prev) => e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id))} />
                <span className="flex-1 truncate">{p.title}</span>
                <span className="text-[11px] text-[#66739a]">{p.type === 'text2img' ? '文生图' : '图生图'}{p.visibility === 'private' ? ' · 私有' : ''}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
