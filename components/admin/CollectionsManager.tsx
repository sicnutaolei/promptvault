'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CollectionCard } from '@/lib/types';

export default function CollectionsManager() {
  const [items, setItems] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/collections', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '加载失败');
      setItems(data.collections);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function patch(id: number, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/collections/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '更新失败');
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    try {
      await patch(a.id, { sort_order: target * 10 });
      await patch(b.id, { sort_order: index * 10 });
      load();
    } catch (e) { setError(e instanceof Error ? e.message : '排序失败'); }
  }

  async function remove(c: CollectionCard) {
    if (!confirm(`删除收藏夹「${c.name}」？提示词本身不会被删除。`)) return;
    const res = await fetch(`/api/admin/collections/${c.id}`, { method: 'DELETE' });
    if (res.ok) { setMessage('已删除'); load(); }
    else setError('删除失败');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-semibold text-[#2f3a4a]">收藏夹</h1>
          <p className="mt-1 text-[12px] text-[#98a3b3]">仅用于后台整理，不在首页展示。</p>
        </div>
        <Link href="/admin/collections/new" className="pv-btn pv-btn-primary">新建收藏夹</Link>
      </div>
      {message ? <p className="rounded-lg border border-[#cfe9dd] bg-[#f2fbf7] px-3 py-2 text-[12.5px] text-[#3c8b68]">{message}</p> : null}
      {error ? <p className="rounded-lg border border-[#f3d2d8] bg-[#fdf5f6] px-3 py-2 text-[12.5px] text-[#b4546a]">{error}</p> : null}
      {loading ? <p className="text-[13px] text-[#98a3b3]">加载中…</p> : items.length === 0 ? (
        <div className="pv-card p-10 text-center text-[13px] text-[#98a3b3]">还没有收藏夹，先新建一个。</div>
      ) : (
        <div className="space-y-2">
          {items.map((c, index) => (
            <div key={c.id} className="pv-card flex flex-wrap items-center gap-3 p-3.5">
              <div className="min-w-[140px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium text-[#3d4859]">{c.name}</span>
                  <span className="text-[11.5px] text-[#98a3b3]">{c.prompt_count} 条</span>
                </div>
                {c.description ? <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#a3adbb]">{c.description}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => move(index, -1)} disabled={index === 0} className="pv-btn px-2 py-1 text-[11.5px]">↑</button>
                <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="pv-btn px-2 py-1 text-[11.5px]">↓</button>
                <Link href={`/admin/collections/${c.id}/edit`} className="pv-btn px-2 py-1 text-[11.5px]">编辑</Link>
                <button onClick={() => remove(c)} className="pv-btn pv-btn-danger px-2 py-1 text-[11.5px]">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}