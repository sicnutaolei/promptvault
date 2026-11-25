import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[860px] items-center justify-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-[16%] size-[280px] rounded-full bg-[radial-gradient(circle,#bfe9ef_0%,transparent_68%)] opacity-50 blur-2xl" />
        <div className="absolute right-[14%] top-[10%] size-[240px] rounded-full bg-[radial-gradient(circle,#e7c9f2_0%,transparent_70%)] opacity-50 blur-2xl" />
        <div className="absolute bottom-[8%] left-[38%] size-[320px] rounded-full bg-[radial-gradient(circle,#ffd8df_0%,transparent_70%)] opacity-45 blur-3xl" />
      </div>

      <div className="pv-card relative w-full max-w-[600px] overflow-hidden">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#8fe0e8_0%,#a9b8f4_28%,#c9a7e8_52%,#f6b6c9_76%,#ffe3a8_100%)]" />
        <div className="px-7 py-11 text-center sm:px-12 sm:py-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={56} height={56} className="mx-auto size-14 rounded-[16px]" />
          <p className="mt-6 text-[11.5px] font-medium tracking-[0.24em] text-[#98a3b3]">PAGE NOT FOUND</p>
          <h1 className="mt-1.5 text-[64px] font-semibold leading-none tracking-[-0.045em] text-[#2f3a4a] sm:text-[76px]">
            404
          </h1>
          <p className="mt-4 text-[13.5px] leading-6 text-[#5f6b7c]">
            这一页不在库里，可能已被移除，或链接写错了。
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link href="/" className="pv-btn pv-btn-primary px-5">返回提示词库</Link>
            <Link href="/admin" className="pv-btn px-5">进入后台</Link>
          </div>

          <div className="mx-auto mt-9 h-px w-16 bg-[linear-gradient(90deg,#8fe0e8,#c9a7e8,#f6b6c9)]" />
          <p className="mt-4 text-[11.5px] text-[#a3adbb]">{SITE_NAME} · 自托管 AI 绘画提示词库</p>
        </div>
      </div>
    </div>
  );
}
