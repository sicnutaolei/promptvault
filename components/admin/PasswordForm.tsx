'use client';

import { useState } from 'react';

export default function PasswordForm() {
  const [oldPassword, setOld] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (newPassword.length < 8) { setErr('新密码至少 8 位'); return; }
    if (newPassword !== confirmPassword) { setErr('两次输入的新密码不一致'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '修改失败');
      setMsg('密码已修改，下次登录请使用新密码');
      setOld(''); setNew(''); setConfirm('');
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : '修改失败'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="pv-card space-y-3 p-5">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8b97b8]">修改密码</h2>
      <div><label className="pv-label" htmlFor="old">当前密码</label><input id="old" type="password" className="pv-input" value={oldPassword} onChange={(e) => setOld(e.target.value)} required /></div>
      <div><label className="pv-label" htmlFor="new">新密码（至少 8 位）</label><input id="new" type="password" className="pv-input" value={newPassword} onChange={(e) => setNew(e.target.value)} required /></div>
      <div><label className="pv-label" htmlFor="confirm">确认新密码</label><input id="confirm" type="password" className="pv-input" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} required /></div>
      {msg ? <p className="rounded-lg border border-[#204b3a] bg-[#10241d] px-3 py-2 text-[12.5px] text-[#7ee2b8]">{msg}</p> : null}
      {err ? <p className="rounded-lg border border-[#6b2436] bg-[#3a1520] px-3 py-2 text-[12.5px] text-[#ff9db0]">{err}</p> : null}
      <button type="submit" disabled={busy} className="pv-btn pv-btn-primary">{busy ? '提交中…' : '修改密码'}</button>
    </form>
  );
}
