import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPromptDetail } from '@/lib/queries';
import { getSession } from '@/lib/auth';
import { mediaUrl } from '@/lib/urls';
import CopyButton from '@/components/CopyButton';

export const dynamic = 'force-dynamic';

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const prompt = getPromptDetail(id);
  if (!prompt) notFound();
  if (!prompt.publiclyVisible) {
    const session = await getSession();
    if (!session) notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6">
      <Link href="/" className="text-[12.5px] text-[#98a3b3] transition hover:text-[#3f74c2]">← 提示词库</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2.5">
          <h1 className="text-[23px] font-semibold leading-snug text-[#2f3a4a] sm:text-[26px]">{prompt.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {prompt.visibility === 'private' ? <span className="pv-chip">私有</span> : null}
            {prompt.tags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="pv-chip transition hover:border-[#cfdceb] hover:text-[#3f74c2]">
                {tag}
              </Link>
            ))}
          </div>
        </div>
        <CopyButton text={prompt.positive_prompt} label="复制提示词" className="pv-btn-primary" />
      </header>

      {prompt.images.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {prompt.images.map((img) => (
            <a
              key={img.id}
              href={mediaUrl(img.file_path) || '#'}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-2xl border border-[#e9eef4] bg-[#f2f5f9]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(img.thumb_path) || ''}
                alt={prompt.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:opacity-95"
              />
            </a>
          ))}
        </div>
      ) : null}

      <section className="pv-card p-5 sm:p-6">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2 className="text-[12.5px] font-medium text-[#8a95a6]">正向提示词</h2>
          <CopyButton text={prompt.positive_prompt} className="px-2.5 py-1 text-[11.5px]" />
        </div>
        <p className="pv-prose rounded-xl bg-[#f7f9fc] p-4 text-[13.5px] text-[#3d4859]">{prompt.positive_prompt}</p>

        {prompt.negative_prompt ? (
          <>
            <div className="mb-2.5 mt-5 flex items-center justify-between gap-3">
              <h2 className="text-[12.5px] font-medium text-[#8a95a6]">负向提示词</h2>
              <CopyButton text={prompt.negative_prompt} className="px-2.5 py-1 text-[11.5px]" />
            </div>
            <p className="pv-prose rounded-xl bg-[#f7f9fc] p-4 text-[13.5px] text-[#3d4859]">{prompt.negative_prompt}</p>
          </>
        ) : null}
      </section>

      {prompt.notes || prompt.source_url ? (
        <section className="space-y-2 text-[12.5px] leading-6 text-[#8a95a6]">
          {prompt.notes ? <p className="pv-prose">{prompt.notes}</p> : null}
          {prompt.source_url ? (
            <p className="break-all">
              来源：
              <a href={prompt.source_url} target="_blank" rel="noreferrer nofollow" className="text-[#4f86d6] hover:underline">
                {prompt.source_url}
              </a>
            </p>
          ) : null}
        </section>
      ) : null}

      <p className="text-[11.5px] text-[#a3adbb]">更新于 {new Date(prompt.updated_at).toLocaleString('zh-CN')}</p>
    </div>
  );
}