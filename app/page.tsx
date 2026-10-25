import Link from 'next/link';
import { listPublicCollections } from '@/lib/queries';
import { mediaUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const collections = listPublicCollections();
  const siteName = process.env.SITE_NAME || 'PromptVault';
  return (
    <div className="space-y-8">
      <section className="pv-card overflow-hidden p-7">
        <p className="text-[12px] uppercase tracking-[0.22em] text-[#7f8db3]">Prompt Library</p>
        <h1 className="mt-2 text-[30px] font-bold leading-tight sm:text-[38px]">
          把好用的 <span className="pv-grad-text">提示词</span> 收进自己的库
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[#a9b6d8]">
          {siteName} 收集文生图 / 图生图的提示词、参数与示例图，按收藏夹整理，支持全文搜索与一键复制。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/search" className="pv-btn pv-btn-primary">开始浏览</Link>
          <Link href="/admin" className="pv-btn">进入管理</Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[16px] font-semibold">公开收藏夹</h2>
          <span className="text-[12px] text-[#7f8db3]">{collections.length} 个</span>
        </div>
        {collections.length === 0 ? (
          <div className="pv-card grid place-items-center gap-2 p-14 text-center">
            <p className="text-[15px] font-medium">还没有公开收藏夹</p>
            <p className="text-[13px] text-[#8b97b8]">登录后台创建第一个收藏夹，并把它设为公开。</p>
            <Link href="/admin/collections/new" className="pv-btn pv-btn-primary mt-2">新建收藏夹</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => {
              const cover = mediaUrl(c.cover_thumb_path || c.cover_path);
              return (
                <Link key={c.id} href={`/c/${c.slug}`} className="pv-card group overflow-hidden transition hover:border-[#3a4a7a]">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0e1425]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={c.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center text-[12px] text-[#56628a]">无封面</div>
                    )}
                  </div>
                  <div className="space-y-1 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-[15px] font-semibold">{c.name}</h3>
                      <span className="pv-chip shrink-0">{c.prompt_count} 条</span>
                    </div>
                    <p className="line-clamp-2 text-[12.5px] leading-6 text-[#8b97b8]">{c.description || '暂无描述'}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
