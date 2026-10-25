'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 429 ? (data.error || '尝试次数过多，请稍后再试') : (data.error || '登录失败'));
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <form onSubmit={submit} className="pv-card space-y-4 p-6">
        <div>
          <h1 className="text-[20px] font-bold">管理员登录</h1>
          <p className="mt-1 text-[12.5px] text-[#8b97b8]">首次启动的管理员密码见容器日志 <code className="text-[#a9b6d8]">docker compose logs app</code></p>
        </div>
        <div>
          <label className="pv-label" htmlFor="u">用户名</label>
          <input id="u" className="pv-input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div>
          <label className="pv-label" htmlFor="p">密码</label>
          <input id="p" type="password" className="pv-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error ? <p className="rounded-lg border border-[#6b2436] bg-[#3a1520] px-3 py-2 text-[12.5px] text-[#ff9db0]">{error}</p> : null}
        <button type="submit" disabled={busy} className="pv-btn pv-btn-primary w-full">{busy ? '登录中…' : '登录'}</button>
      </form>
    </div>
  );
}
