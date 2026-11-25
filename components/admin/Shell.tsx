'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/admin', label: '仪表盘' },
  { href: '/admin/collections', label: '收藏夹' },
  { href: '/admin/prompts', label: '提示词' },
  { href: '/admin/settings', label: '设置' },
];

export default function Shell({ username, children }: { username: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="pv-hscroll flex items-center gap-1 overflow-x-auto rounded-xl border border-[#e8edf4] bg-white p-1">
          {links.map((l) => {
            const active = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition ${
                  active ? 'bg-[#eef5fe] font-medium text-[#3f74c2]' : 'text-[#5f6b7c] hover:bg-[#f5f8fc] hover:text-[#2f3a4a]'
                }`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-[12px] text-[#98a3b3] sm:inline">{username}</span>
          <button type="button" onClick={logout} className="pv-btn px-3 py-1.5 text-[12px]">退出</button>
        </div>
      </div>
      {children}
    </div>
  );
}