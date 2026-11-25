'use client';

import { useState } from 'react';

export default function MaintenanceCard() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function purge() {
    if (!confirm('清理 1 小时前上传、且没有任何提示词或收藏夹引用的图片？')) return;
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      const res = await fetch('/api/admin/maintenance/purge-uploads', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '清理失败');
      setMsg(`已清理 ${Number(data.removed) || 0} 个文件`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '清理失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pv-card space-y-3 p-5">
      <div>
        <h2 className="text-[13px] font-medium text-[#6b7789]">维护</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#98a3b3]">
          清理上传后未保存、或已被替换的图片文件。只处理 1 小时前上传、且数据库里没有任何引用的 WebP，正在编辑的上传不受影响。
        </p>
      </div>
      {msg ? <p className="rounded-lg border border-[#cfe9dd] bg-[#f2fbf7] px-3 py-2 text-[12.5px] text-[#3c8b68]">{msg}</p> : null}
      {err ? <p className="rounded-lg border border-[#f3d2d8] bg-[#fdf5f6] px-3 py-2 text-[12.5px] text-[#b4546a]">{err}</p> : null}
      <button type="button" onClick={purge} disabled={busy} className="pv-btn px-3 py-1.5 text-[12px]">
        {busy ? '清理中…' : '清理孤儿图片'}
      </button>
    </div>
  );
}
