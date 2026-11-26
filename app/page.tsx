import Link from 'next/link';
import { listPublicPrompts, listPublicTags } from '@/lib/queries';
import { getSlogan } from '@/lib/settings';
import PromptCard from '@/components/PromptCard';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

const TAG_LIMIT = 24;

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ q?: string; tag?: string; page?: string; tags?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const tag = sp.tag?.trim() || '';
  const showAllTags = sp.tags === 'all';
  const result = listPublicPrompts({ q: q || undefined, tag: tag || undefined, page: Number(sp.page) || 1 });
  const tags = listPublicTags();
  const slogan = getSlogan();

  const allTagNames = tags.map((t) => t.name);
  const visibleTags = showAllTags ? allTagNames : allTagNames.slice(0, TAG_LIMIT);
  if (tag && !visibleTags.includes(tag)) visibleTags.push(tag);
  const canToggleTags = allTagNames.length > TAG_LIMIT;
  const keepAllTags = showAllTags ? { tags: 'all' as const } : undefined;

  const tagHref = (name: string | null, opts?: { tags?: 'all' }) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (name) params.set('tag', name);
    if (opts?.tags === 'all') params.set('tags', 'all');
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] transition ${
      active
        ? 'bg-[#dfecfc] font-medium text-[#2f66b8]'
        : 'border border-[#e4eaf2] bg-white text-[#68758a] hover:border-[#cfdceb] hover:text-[#3f74c2]'
    }`;

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <h1 className="text-[21px] font-semibold leading-snug tracking-tight text-[#303a4a] sm:text-[24px]">{slogan}</h1>

      <form action="/" method="get" className="mt-5 flex max-w-[640px] gap-2">
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        {showAllTags ? <input type="hidden" name="tags" value="all" /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索提示词或标签"
          aria-label="搜索提示词"
          className="pv-input h-11 flex-1"
        />
        <button type="submit" className="pv-btn pv-btn-primary h-11 px-6">搜索</button>
      </form>

      {tags.length ? (
        <div className="mt-4 flex items-center gap-2">
          <div className="pv-hscroll flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
            <Link href={tagHref(null, keepAllTags)} className={chipClass(!tag)}>全部</Link>
            {visibleTags.map((name) => (
              <Link key={name} href={tagHref(name, keepAllTags)} className={chipClass(tag === name)}>
                {name}
              </Link>
            ))}
          </div>
          {canToggleTags ? (
            <Link
              href={showAllTags ? tagHref(tag || null) : tagHref(tag || null, { tags: 'all' })}
              className="shrink-0 rounded-full border border-[#e4eaf2] bg-white px-3 py-1.5 text-[12px] text-[#68758a] transition hover:border-[#cfdceb] hover:text-[#3f74c2]"
            >
              {showAllTags ? '收起' : '更多'}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        {result.items.length === 0 ? (
          <div className="pv-card grid place-items-center gap-1.5 px-6 py-16 text-center">
            <p className="text-[14px] font-medium text-[#3d4859]">没有找到提示词</p>
            <p className="text-[12.5px] text-[#98a3b3]">
              {q || tag ? '换个关键词或筛选条件试试' : '在后台发布第一条公开提示词后，这里就会展示'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {result.items.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
          </div>
        )}
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/"
        query={{ q: q || undefined, tag: tag || undefined, tags: showAllTags ? 'all' : undefined }}
      />
    </div>
  );
}