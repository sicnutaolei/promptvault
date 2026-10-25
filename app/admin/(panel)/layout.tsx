import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Shell from '@/components/admin/Shell';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return <Shell username={session.username}>{children}</Shell>;
}
