'use client';

import { useState } from 'react';

export default function CopyButton({ text, label = '复制', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setDone(true);
      setFailed(false);
      setTimeout(() => setDone(false), 1600);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 1600);
    }
  }

  return (
    <button type="button" onClick={copy} className={`pv-btn px-3 py-1.5 text-[12px] ${className}`}>
      {done ? '已复制 ✓' : failed ? '复制失败' : label}
    </button>
  );
}
