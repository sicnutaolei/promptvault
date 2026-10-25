import { searchPrompts, listModels, listTags } from '@/lib/queries';
import PromptCard from '@/components/PromptCard';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; type?: string; model?: string; tag?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const result = searchPrompts({ q: q || undefined, type: sp.type, model: sp.model, tag: sp.tag, page: Number(sp.page) || 1 });
  const models = listModels();
  const tags = listTags().slice(0, 30);
  const hasFilter = Boolean(q || sp.type || sp.model || sp.tag);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">搜索提示词</h1>
          <p className="mt-1 text-[12.5px] text-[#7f8db3]">匹配标题、正向 / 负向提示词与标签，按更新时间排序</p>
        </div>
        <span className="text-[12.5px] text-[#7f8db3]">共 {result.total} 条</span>
      </div>

      <form action="/search" method="get" className="pv-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="pv-label" htmlFor="q">关键词</label>
          <input id="q" name="q" defaultValue={q} placeholder="如：portrait, cinematic, 赛博朋克" className="pv-input" />
        </div>
        <div>
          <label className="pv-label" htmlFor="type">类型</label>
          <select id="type" name="type" defaultValue={sp.type || ''} className="pv-input">
            <option value="">全部</option>
            <option value="text2img">文生图</option>
            <option value="img2img">图生图</option>
          </select>
        </div>
        <div>
          <label className="pv-label" htmlFor="model">模型</label>
          <select id="model" name="model" defaultValue={sp.model || ''} className="pv-input">
            <option value="">全部</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="pv-label" htmlFor="tag">标签</label>
          <select id="tag" name="tag" defaultValue={sp.tag || ''} className="pv-input">
            <option value="">全部</option>
            {tags.map((t) => <option key={t.name} value={t.name}>#{t.name} ({t.count})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="pv-btn pv-btn-primary">搜索</button>
          {hasFilter ? <a href="/search" className="pv-btn pv-btn-ghost">清除条件</a> : null}
        </div>
      </form>

      {result.items.length === 0 ? (
        <div className="pv-card grid place-items-center gap-2 p-14 text-center">
          <p className="text-[15px] font-medium">没有匹配的提示词</p>
          <p className="text-[13px] text-[#8b97b8]">换个关键词，或减少筛选条件试试。</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((p) => <PromptCard key={p.id} prompt={p} />)}
        </div>
      )}
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/search"
        query={{ q: q || undefined, type: sp.type, model: sp.model, tag: sp.tag }}
      />
    </div>
  );
}
