import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · AI 绘画提示词库`,
    short_name: SITE_NAME,
    description: '自托管 AI 绘画提示词与参数收藏：搜索、标签筛选、一键复制。',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f8fb',
    theme_color: '#f6f8fb',
    lang: 'zh-CN',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
