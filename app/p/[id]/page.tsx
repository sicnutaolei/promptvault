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
  const paramsJson = JSON.stringify({
    model: prompt.model, sampler: prompt.sampler, steps: prompt.steps, cfg_scale: prompt.cfg_scale,
    seed: prompt.seed, width: prompt.width, height: prompt.height, lora: prompt.lora,
  });
  const groups: Record<string, typeof prompt.images> = { example: [], reference: [], generated: [] };
  for (const img of prompt.images) groups[img.role]?.push(img);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#7f8db3]">
        <Link href="/" className="hover:text-white">首页</Link>
        <span>/</span>
        {prompt.collections[0] ? (
          <Link href={`/c/${prompt.collections[0].slug}`} className="hover:text-white">{prompt.collections[0].name}</Link>
        ) : <span>未归类</span>}
        <span>/</span><span className="text-[#a9b6d8]">#{prompt.id}</span>
      </div>

      <section className="pv-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-[23px] font-bold leading-snug">{prompt.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="pv-chip border-[#2f4a86] text-[#9db8ff]">{prompt.type === 'text2img' ? '文生图 text2img' : '图生图 img2img'}</span>
              {prompt.model ? <span className="pv-chip">{prompt.model}</span> : null}
              {prompt.visibility === 'private' ? <span className="pv-chip border-[#6b5a24] text-[#ffd479]">私有</span> : null}
              <span className="text-[11.5px] text-[#66739a]">更新于 {new Date(prompt.updated_at).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          <CopyButton text={paramsJson} label="复制参数 JSON" className="pv-btn-primary" />
        </div>
        {prompt.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`} className="pv-chip hover:text-white">#{tag}</Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="pv-card p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">正向提示词</h2>
          <CopyButton text={prompt.positive_prompt} />
        </div>
        <p className="pv-prose rounded-xl bg-[#0e1425] p-4 text-[13.5px] text-[#d9e2ff]">{prompt.positive_prompt}</p>
        {prompt.negative_prompt ? (
          <>
            <div className="mb-2 mt-4 flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">负向提示词</h2>
              <CopyButton text={prompt.negative_prompt} />
            </div>
            <p className="pv-prose rounded-xl bg-[#0e1425] p-4 text-[13.5px] text-[#d9e2ff]">{prompt.negative_prompt}</p>
          </>
        ) : null}
      </section>

      <section className="pv-card p-5">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">生成参数</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3">
          {([['模型', prompt.model], ['采样器', prompt.sampler], ['步数', prompt.steps], ['CFG', prompt.cfg_scale], ['Seed', prompt.seed], ['尺寸', prompt.width && prompt.height ? `${prompt.width}×${prompt.height}` : null], ['LoRA', prompt.lora]] as [string, string | number | null][])
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-[#1c2440] pb-1.5">
                <span className="text-[#7f8db3]">{k}</span><span className="text-right">{v}</span>
              </div>
            ))}
        </div>
        {prompt.source_url ? (
          <p className="mt-3 break-all text-[12.5px] text-[#8b97b8]">来源：<a className="text-[#8fb0ff] underline decoration-dotted" href={prompt.source_url} target="_blank" rel="noreferrer nofollow">{prompt.source_url}</a></p>
        ) : null}
        {prompt.notes ? <p className="pv-prose mt-3 rounded-xl bg-[#0e1425] p-3 text-[12.5px] text-[#a9b6d8]">{prompt.notes}</p> : null}
      </section>

      {prompt.type === 'img2img' && (groups.reference.length > 0 || groups.generated.length > 0) ? (
        <section className="pv-card p-5">
          <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">参考图</h2>
          <p className="mb-3 text-[12px] leading-6 text-[#7f8db3]">
            参考图版权归原作者所有，此处仅用于说明图生图的输入与风格来源，不作商业用途；如权利人提出异议将立即删除。
          </p>
          <ImageGrid items={groups.reference} />
          {groups.generated.length ? (<><h3 className="mb-2 mt-4 text-[12.5px] text-[#8b97b8]">生成结果</h3><ImageGrid items={groups.generated} /></>) : null}
        </section>
      ) : null}

      {groups.example.length ? (
        <section className="pv-card p-5">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">示例图</h2>
          <ImageGrid items={groups.example} />
        </section>
      ) : null}

      {prompt.type === 'text2img' && groups.generated.length ? (
        <section className="pv-card p-5">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">生成结果</h2>
          <ImageGrid items={groups.generated} />
        </section>
      ) : null}
    </div>
  );
}

function ImageGrid({ items }: { items: { id: number; file_path: string; thumb_path: string }[] }) {
  if (!items.length) return <p className="text-[12.5px] text-[#56628a]">暂无图片</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((img) => (
        <a key={img.id} href={mediaUrl(img.file_path) || '#'} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-[#232b45] bg-[#0e1425]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(img.thumb_path) || ''} alt="图片" loading="lazy" className="h-full w-full object-cover transition group-hover:opacity-90" />
        </a>
      ))}
    </div>
  );
}
