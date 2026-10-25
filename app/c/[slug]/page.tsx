import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCollectionBySlug, getPromptsInCollection } from '@/lib/queries';
import { getSession } from '@/lib/auth';
import { mediaUrl } from '@/lib/urls';
import PromptCard from '@/components/PromptCard';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function CollectionPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const collection = getCollectionBySlug(slug);
  if (!collection) notFound();
  if (!collection.is_public) {
    const session = await getSession();
    if (!session) notFound();
  }
  const result = getPromptsInCollection(collection.id, Number(sp.page) || 1);
  const cover = mediaUrl(collection.cover_path || collection.cover_thumb_path);
  return (
    <div className="space-y-6">
      <section className="pv-card overflow-hidden">
        {cover ? (
          <div className="relative h-[170px] w-full bg-[#0e1425] sm:h-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={collection.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111831] via-transparent" />
          </div>
        ) : null}
        <div className="space-y-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-bold">{collection.name}</h1>
            {!collection.is_public ? <span className="pv-chip border-[#6b2436] text-[#ff9db0]">私有</span> : null}
            <span className="pv-chip">{result.total} 条提示词</span>
          </div>
          {collection.description ? <p className="max-w-3xl whitespace-pre-wrap text-[13px] leading-6 text-[#a9b6d8]">{collection.description}</p> : null}
        </div>
      </section>

      {result.items.length === 0 ? (
        <div className="pv-card grid place-items-center gap-2 p-14 text-center">
          <p className="text-[15px] font-medium">这个收藏夹还是空的</p>
          <p className="text-[13px] text-[#8b97b8]">在后台编辑收藏夹，把提示词加进来。</p>
          <Link href="/admin/collections" className="pv-btn mt-2">去管理</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
        </div>
      )}
      <Pagination page={result.page} totalPages={result.totalPages} basePath={`/c/${collection.slug}`} />
    </div>
  );
}
