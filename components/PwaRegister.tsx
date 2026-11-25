'use client';

import { useEffect } from 'react';

/** 生产环境注册 service worker，满足 Chrome「安装应用」所需条件。 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.warn('[PWA] service worker 注册失败', err);
      });
    };

    register();
  }, []);

  return null;
}
