import { notFound } from 'next/navigation';
import CollectionForm from '@/components/admin/CollectionForm';
import { collectionPromptIds, getCollectionById, listPromptPicker } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const collection = getCollectionById(id);
  if (!collection) notFound();
  return (
    <CollectionForm
      mode="edit"
      initial={collection}
      promptOptions={listPromptPicker()}
      selectedIds={collectionPromptIds(id)}
    />
  );
}
