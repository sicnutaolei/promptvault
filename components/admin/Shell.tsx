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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] ${active ? 'bg-[#26324f] text-white' : 'text-[#a9b6d8] hover:bg-[#18203a] hover:text-white'}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <span className="hidden text-[12px] text-[#66739a] sm:inline">{username}</span>
        <button type="button" onClick={logout} className="pv-btn px-3 py-1.5 text-[12px]">退出</button>
      </div>
      {children}
    </div>
  );
}
