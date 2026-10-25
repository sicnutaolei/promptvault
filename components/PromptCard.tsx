import Link from 'next/link';
import { mediaUrl } from '@/lib/urls';
import type { PromptCard as PromptCardType } from '@/lib/types';

export default function PromptCard({ prompt }: { prompt: PromptCardType }) {
  const thumb = mediaUrl(prompt.thumb);
  return (
    <Link href={`/p/${prompt.id}`} className="pv-card group overflow-hidden transition hover:border-[#3a4a7a]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0e1425]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={prompt.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-[12px] text-[#56628a]">无示例图</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] text-[#cfe0ff] backdrop-blur">
          {prompt.type === 'text2img' ? '文生图' : '图生图'}
        </span>
      </div>
      <div className="space-y-2 p-3.5">
        <h3 className="line-clamp-1 text-[14px] font-semibold">{prompt.title}</h3>
        <p className="line-clamp-2 text-[12px] leading-5 text-[#8b97b8]">{prompt.positive_prompt}</p>
        <div className="flex flex-wrap gap-1.5">
          {prompt.model ? <span className="pv-chip">{prompt.model}</span> : null}
          {prompt.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="pv-chip">#{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
