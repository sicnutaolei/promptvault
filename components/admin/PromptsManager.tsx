'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Paged, PromptCard } from '@/lib/types';
import { mediaUrl } from '@/lib/urls';

type Data = Paged<PromptCard>;

export default function PromptsManager() {
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState('');
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (visibility) sp.set('visibility', visibility);
    sp.set('page', String(page));
    const res = await fetch(`/api/admin/prompts?${sp.toString()}`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(json.error || '加载失败'); return; }
    setErr('');
    setData(json as Data);
  }, [q, visibility, page]);

  useEffect(() => { load(); }, [load]);

  async function remove(p: PromptCard) {
    if (!confirm(`删除提示词「${p.title}」？关联图片文件会一起删除。`)) return;
    const res = await fetch(`/api/admin/prompts/${p.id}`, { method: 'DELETE' });
    if (res.ok) load();
    else setErr('删除失败');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[20px] font-semibold text-[#2f3a4a]">提示词</h1>
        <Link href="/admin/prompts/new" className="pv-btn pv-btn-primary">新建提示词</Link>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="pv-card grid gap-3 p-4 sm:grid-cols-4">
        <input className="pv-input sm:col-span-2" placeholder="标题 / 提示词关键词" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="pv-input" value={visibility} onChange={(e) => { setVisibility(e.target.value); setPage(1); }}>
          <option value="">全部可见性</option><option value="public">公开</option><option value="private">私有</option>
        </select>
        <button type="submit" className="pv-btn">筛选</button>
      </form>
      {err ? <p className="rounded-lg border border-[#f3d2d8] bg-[#fdf5f6] px-3 py-2 text-[12.5px] text-[#b4546a]">{err}</p> : null}
      {!data ? <p className="text-[13px] text-[#98a3b3]">加载中…</p> : data.items.length === 0 ? (
        <div className="pv-card p-10 text-center text-[13px] text-[#98a3b3]">没有匹配的提示词。</div>
      ) : (
        <div className="space-y-2">
          {data.items.map((p) => (
            <div key={p.id} className="pv-card flex flex-wrap items-center gap-3 p-3">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f2f5f9]">
                {p.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(p.thumb) || ''} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-[160px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-medium text-[#3d4859]">{p.title}</span>
                  <span className={`pv-chip ${p.visibility === 'public' ? 'border-[#cfe9dd] text-[#3c8b68]' : 'border-[#f0e2c4] text-[#a67c2e]'}`}>
                    {p.visibility === 'public' ? '公开' : '私有'}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#a3adbb]">{p.positive_prompt}</p>
              </div>
              <div className="flex gap-1.5">
                <Link href={`/p/${p.id}`} className="pv-btn px-2 py-1 text-[11.5px]">查看</Link>
                <Link href={`/admin/prompts/${p.id}/edit`} className="pv-btn px-2 py-1 text-[11.5px]">编辑</Link>
                <button onClick={() => remove(p)} className="pv-btn pv-btn-danger px-2 py-1 text-[11.5px]">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={data.page <= 1} onClick={() => setPage(data.page - 1)} className="pv-btn px-3 py-1.5 text-[12px]">上一页</button>
          <span className="text-[12px] text-[#98a3b3]">{data.page} / {data.totalPages}（共 {data.total} 条）</span>
          <button disabled={data.page >= data.totalPages} onClick={() => setPage(data.page + 1)} className="pv-btn px-3 py-1.5 text-[12px]">下一页</button>
        </div>
      ) : null}
    </div>
  );
}