import Link from 'next/link';
import { mediaUrl } from '@/lib/urls';
import type { PromptTile } from '@/lib/types';

export default function PromptCard({ prompt }: { prompt: PromptTile }) {
  const thumb = mediaUrl(prompt.thumb);
  return (
    <Link
      href={`/p/${prompt.id}`}
      className="group overflow-hidden rounded-2xl border border-[#e9eef4] bg-white transition hover:border-[#d5e2f2] hover:shadow-[0_8px_24px_rgba(31,61,102,0.06)]"
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-[#f2f5f9]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={prompt.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-[12px] text-[#a3adbb]">暂无预览图</div>
        )}
      </div>
      <div className="px-3.5 py-3">
        <h3 className="truncate text-[13px] font-medium text-[#3d4859]">{prompt.title}</h3>
      </div>
    </Link>
  );
}