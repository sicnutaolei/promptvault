import { notFound } from 'next/navigation';
import PromptForm from '@/components/admin/PromptForm';
import { getPromptDetail } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const prompt = getPromptDetail(id);
  if (!prompt) notFound();
  return <PromptForm mode="edit" initial={prompt} />;
}
