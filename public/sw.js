/* PromptVault service worker：让站点可被 Chrome 安装为 PWA，并提供离线兜底。 */
const VERSION = 'v2';
const SHELL_CACHE = `pv-shell-${VERSION}`;
const ASSET_CACHE = `pv-assets-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/logo.png',
  '/icon.png',
  '/pwa-192.png',
  '/pwa-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('pv-') && key !== SHELL_CACHE && key !== ASSET_CACHE)
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

const ASSET_RE = /\.(?:css|js|mjs|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/i;

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(ASSET_CACHE);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/')) return;

  // 页面导航：网络优先，断网时回离线页；后台不接管。
  if (request.mode === 'navigate') {
    if (url.pathname.startsWith('/admin')) return;
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        return new Response('<!doctype html><meta charset="utf-8"><title>离线</title><p style="font:16px system-ui;padding:32px">当前离线，网络恢复后请刷新。</p>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    })());
    return;
  }

  // 构建产物与静态资源：缓存优先。
  if (url.pathname.startsWith('/_next/static/') || ASSET_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
