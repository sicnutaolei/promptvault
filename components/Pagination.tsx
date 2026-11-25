import Link from 'next/link';

export default function Pagination({
  page, totalPages, basePath, query = {},
}: { page: number; totalPages: number; basePath: string; query?: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) sp.set(k, v);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
  );
  const base = 'rounded-[10px] px-3.5 py-1.5 text-[12.5px] transition';
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-8">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${base} border border-[#e4eaf2] bg-white text-[#5f6b7c] hover:border-[#cfdceb] hover:text-[#3f74c2]`}>上一页</Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 ? <span className="text-[#a3adbb]">…</span> : null}
          {p === page ? (
            <span className={`${base} bg-[#eaf2fd] font-medium text-[#3f74c2]`}>{p}</span>
          ) : (
            <Link href={href(p)} className={`${base} text-[#68758a] hover:bg-white hover:text-[#3f74c2]`}>{p}</Link>
          )}
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${base} border border-[#e4eaf2] bg-white text-[#5f6b7c] hover:border-[#cfdceb] hover:text-[#3f74c2]`}>下一页</Link>
      ) : null}
    </div>
  );
}