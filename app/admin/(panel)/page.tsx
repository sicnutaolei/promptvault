import Link from 'next/link';
import { dashboardStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const stats = dashboardStats();
  const cards = [
    ['提示词', stats.prompts, `公开 ${stats.publicPrompts} · 图片 ${stats.images}`],
    ['收藏夹', stats.collections, '仅在后台使用'],
    ['标签', stats.tags, '自动去重'],
  ] as const;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(([label, value, hint]) => (
          <div key={label} className="pv-card p-5">
            <p className="text-[12px] text-[#8a95a6]">{label}</p>
            <p className="mt-2 text-[28px] font-semibold leading-none text-[#2f3a4a]">{value}</p>
            <p className="mt-2 text-[11.5px] text-[#98a3b3]">{hint}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/prompts/new" className="pv-btn pv-btn-primary">新建提示词</Link>
        <Link href="/admin/collections/new" className="pv-btn">新建收藏夹</Link>
        <Link href="/" className="pv-btn pv-btn-ghost">查看站点</Link>
      </div>
      <section className="pv-card p-5">
        <h2 className="mb-2 text-[13px] font-medium text-[#6b7789]">最近更新</h2>
        {stats.recent.length === 0 ? <p className="text-[13px] text-[#98a3b3]">还没有提示词。</p> : (
          <ul className="divide-y divide-[#eef2f7]">
            {stats.recent.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                <Link href={`/admin/prompts/${p.id}/edit`} className="text-[#3d4859] hover:text-[#3f74c2]">{p.title}</Link>
                <span className="text-[11.5px] text-[#98a3b3]">
                  {p.visibility === 'public' ? '公开' : '私有'} · {new Date(p.updated_at).toLocaleString('zh-CN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}