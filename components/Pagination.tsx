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
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
      {page > 1 ? <Link href={href(page - 1)} className="pv-btn px-3 py-1.5 text-[12.5px]">上一页</Link> : null}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 ? <span className="text-[#56628a]">…</span> : null}
          {p === page ? (
            <span className="pv-btn pv-btn-primary px-3 py-1.5 text-[12.5px]">{p}</span>
          ) : (
            <Link href={href(p)} className="pv-btn px-3 py-1.5 text-[12.5px]">{p}</Link>
          )}
        </span>
      ))}
      {page < totalPages ? <Link href={href(page + 1)} className="pv-btn px-3 py-1.5 text-[12.5px]">下一页</Link> : null}
    </div>
  );
}
