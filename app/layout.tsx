import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

const siteName = process.env.SITE_NAME || 'PromptVault';

export const metadata: Metadata = {
  title: { default: `${siteName} · 提示词收藏`, template: `%s · ${siteName}` },
  description: '文生图 / 图生图提示词收藏与检索',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="sticky top-0 z-20 border-b border-[#1b233a] bg-[#0b1020]/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#4f7cff] to-[#7a5cff] text-[15px] font-bold text-white">P</span>
              <span className="text-[15px] font-semibold tracking-wide">{siteName}</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-[13px] text-[#a9b6d8]">
              <Link href="/search" className="rounded-lg px-3 py-1.5 hover:bg-[#18203a] hover:text-white">搜索</Link>
              <Link href="/admin" className="rounded-lg px-3 py-1.5 hover:bg-[#18203a] hover:text-white">管理</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-center text-[11.5px] text-[#66739a]">
          PromptVault · 自托管提示词收藏 · 数据保存在你的服务器上
        </footer>
      </body>
    </html>
  );
}
