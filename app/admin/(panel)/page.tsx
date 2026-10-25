import Link from 'next/link';
import { dashboardStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const stats = dashboardStats();
  const cards = [
    ['收藏夹', stats.collections, `公开 ${stats.publicCollections}`],
    ['提示词', stats.prompts, `图片 ${stats.images}`],
    ['标签', stats.tags, '自动去重'],
  ] as const;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(([label, value, hint]) => (
          <div key={label} className="pv-card p-5">
            <p className="text-[12px] uppercase tracking-wider text-[#7f8db3]">{label}</p>
            <p className="mt-2 text-[30px] font-bold leading-none">{value}</p>
            <p className="mt-2 text-[12px] text-[#66739a]">{hint}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/collections/new" className="pv-btn pv-btn-primary">新建收藏夹</Link>
        <Link href="/admin/prompts/new" className="pv-btn">新建提示词</Link>
        <Link href="/" className="pv-btn pv-btn-ghost">查看站点</Link>
      </div>
      <section className="pv-card p-5">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">最近更新</h2>
        {stats.recent.length === 0 ? <p className="text-[13px] text-[#8b97b8]">还没有提示词。</p> : (
          <ul className="divide-y divide-[#1c2440]">
            {stats.recent.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
                <Link href={`/admin/prompts/${p.id}/edit`} className="hover:text-white">{p.title}</Link>
                <span className="text-[11.5px] text-[#66739a]">
                  {p.type === 'text2img' ? '文生图' : '图生图'} · {p.visibility === 'public' ? '公开' : '私有'} · {new Date(p.updated_at).toLocaleString('zh-CN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
