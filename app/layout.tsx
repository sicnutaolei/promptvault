import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

const siteName = process.env.SITE_NAME || 'PromptVault';

export const metadata: Metadata = {
  title: { default: `${siteName} · 提示词库`, template: `%s · ${siteName}` },
  description: 'AI 绘画提示词与图片收藏',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Sidebar siteName={siteName} />
        <main className="min-h-screen px-4 py-6 md:ml-[212px] md:px-8 md:py-8 lg:px-10">
          {children}
        </main>
      </body>
    </html>
  );
}