import type { Metadata, Viewport } from 'next';
import Sidebar from '@/components/Sidebar';
import PwaRegister from '@/components/PwaRegister';
import { SITE_NAME, siteUrl } from '@/lib/site';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${SITE_NAME} · 提示词库`, template: `%s · ${SITE_NAME}` },
    description: '自托管 AI 绘画提示词与参数收藏：搜索、标签筛选、一键复制。',
    applicationName: SITE_NAME,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: SITE_NAME,
    },
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: '/',
      siteName: SITE_NAME,
      title: `${SITE_NAME} · AI 绘画提示词库`,
      description: '自托管 AI 绘画提示词库：搜索、标签筛选、一键复制提示词与参数。',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} · AI 绘画提示词库`,
      description: '自托管 AI 绘画提示词库：搜索、标签筛选、一键复制提示词与参数。',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#f6f8fb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Sidebar siteName={SITE_NAME} />
        <main className="min-h-screen px-4 py-6 md:ml-[212px] md:px-8 md:py-8 lg:px-10">
          {children}
        </main>
        <PwaRegister />
      </body>
    </html>
  );
}
