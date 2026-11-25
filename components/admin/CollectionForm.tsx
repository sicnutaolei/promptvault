'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { CollectionRow } from '@/lib/types';

export interface PromptOption { id: number; title: string; visibility: string }

export default function CollectionForm({
  mode, initial, promptOptions = [], selectedIds = [],
}: { mode: 'create' | 'edit'; initial?: CollectionRow; promptOptions?: PromptOption[]; selectedIds?: number[] }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [ids, setIds] = useState<number[]>(selectedIds);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const filtered = useMemo(
    () => promptOptions.filter((p) => !filter || p.title.toLowerCase().includes(filter.toLowerCase())),
    [promptOptions, filter],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!name.trim()) { setErr('名称必填'); return; }
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        sort_order: Number(sortOrder) || 0,
      };
      const res = await fetch(mode === 'edit' ? `/api/admin/collections/${initial!.id}` : '/api/admin/collections', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '保存失败');
      if (mode === 'edit') {
        const r2 = await fetch(`/api/admin/collections/${initial!.id}/prompts`, {
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
    <form onSubmit={submit} className="mx-auto max-w-[760px] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[20px] font-semibold text-[#2f3a4a]">{mode === 'edit' ? '编辑收藏夹' : '新建收藏夹'}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push('/admin/collections')} className="pv-btn">返回</button>
          <button type="submit" disabled={busy} className="pv-btn pv-btn-primary">{busy ? '保存中…' : '保存'}</button>
        </div>
      </div>
      {err ? <p className="rounded-lg border border-[#f3d2d8] bg-[#fdf5f6] px-3 py-2 text-[12.5px] text-[#b4546a]">{err}</p> : null}

      <div className="pv-card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="pv-label" htmlFor="name">名称 *</label>
          <input id="name" className="pv-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="pv-label" htmlFor="sort">排序（小的在前）</label>
          <input id="sort" type="number" className="pv-input" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">
          <label className="pv-label" htmlFor="desc">备注</label>
          <textarea id="desc" className="pv-input min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="pv-card p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13px] font-medium text-[#6b7789]">收藏夹内容（{ids.length} 条）</h2>
            <input className="pv-input max-w-[220px]" placeholder="过滤标题…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="max-h-[340px] space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? <p className="text-[12.5px] text-[#98a3b3]">没有提示词。</p> : filtered.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-[#f5f8fc]">
                <input type="checkbox" className="h-4 w-4 accent-[#4f86d6]" checked={ids.includes(p.id)}
                  onChange={(e) => setIds((prev) => e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id))} />
                <span className="flex-1 truncate">{p.title}</span>
                {p.visibility === 'private' ? <span className="text-[11px] text-[#a67c2e]">私有</span> : null}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-[#98a3b3]">创建后可在编辑页把提示词加入收藏夹。</p>
      )}
    </form>
  );
}