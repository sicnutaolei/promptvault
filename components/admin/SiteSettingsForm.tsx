'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SiteSettingsForm({ initialSlogan }: { initialSlogan: string }) {
  const router = useRouter();
  const [slogan, setSlogan] = useState(initialSlogan);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!slogan.trim()) { setErr('Slogan 不能为空'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slogan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '保存失败');
      setMsg('已保存，首页立即生效');
      router.refresh();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : '保存失败'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="pv-card space-y-3 p-5">
      <div>
        <h2 className="text-[13px] font-medium text-[#6b7789]">首页 Slogan</h2>
        <p className="mt-1 text-[11.5px] text-[#98a3b3]">显示在首页顶部的一句话。</p>
      </div>
      <input
        className="pv-input"
        value={slogan}
        onChange={(e) => setSlogan(e.target.value)}
        maxLength={200}
        placeholder="发现好用的 AI 绘画提示词"
        aria-label="首页 Slogan"
      />
      {msg ? <p className="rounded-lg border border-[#cfe9dd] bg-[#f2fbf7] px-3 py-2 text-[12.5px] text-[#3c8b68]">{msg}</p> : null}
      {err ? <p className="rounded-lg border border-[#f3d2d8] bg-[#fdf5f6] px-3 py-2 text-[12.5px] text-[#b4546a]">{err}</p> : null}
      <button type="submit" disabled={busy} className="pv-btn pv-btn-primary">{busy ? '保存中…' : '保存 Slogan'}</button>
    </form>
  );
}