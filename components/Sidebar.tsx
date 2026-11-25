'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function LibraryIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16M12 4v16M17 4v16" />
      <circle cx="7" cy="9" r="2" />
      <circle cx="12" cy="14" r="2" />
      <circle cx="17" cy="8" r="2" />
    </svg>
  );
}

const links = [
  { href: '/', label: '提示词库', icon: LibraryIcon },
  { href: '/admin', label: '后台管理', icon: AdminIcon },
];

export default function Sidebar({ siteName }: { siteName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-30 flex w-full items-center gap-3 border-b border-[#e8edf4] bg-white px-4 py-3 md:fixed md:inset-y-0 md:left-0 md:h-screen md:w-[212px] md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:border-r md:px-3 md:py-6">
      <Link href="/" className="flex items-center gap-2.5 md:px-2 md:pb-6">
        <span className="grid size-8 place-items-center rounded-[10px] bg-[#e8f1fd] text-[15px] font-semibold text-[#3f74c2]">P</span>
        <span className="whitespace-nowrap text-[14px] font-semibold tracking-tight text-[#2f3a4a]">{siteName}</span>
      </Link>
      <nav className="ml-auto flex items-center gap-1 md:ml-0 md:flex-col md:items-stretch md:gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' || pathname.startsWith('/p/') : pathname.startsWith('/admin');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition ${
                active ? 'bg-[#eef5fe] text-[#3f74c2]' : 'text-[#5f6b7c] hover:bg-[#f5f8fc] hover:text-[#2f3a4a]'
              }`}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}