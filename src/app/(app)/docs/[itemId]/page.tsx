import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DocEditor } from '@/modules/docs';
import { loadDoc } from '@/modules/docs/loaders';
import { DocBreadcrumb } from '@/modules/shelves';
import { loadNavigation } from '@/modules/shelves/loaders';

async function placeOf(itemId: string) {
  const { shelves, items } = await loadNavigation();
  const item =
    items.find(({ id, kind }) => id === itemId && kind === 'doc') ?? notFound();
  const shelf = shelves.find(({ id }) => id === item.shelfId) ?? notFound();
  return { item, shelf };
}

export async function generateMetadata({
  params,
}: PageProps<'/docs/[itemId]'>): Promise<Metadata> {
  const { item } = await placeOf((await params).itemId);
  return { title: item.title };
}

export default async function DocPage({ params }: PageProps<'/docs/[itemId]'>) {
  const { itemId } = await params;
  const [{ item, shelf }, doc] = await Promise.all([
    placeOf(itemId),
    loadDoc(itemId),
  ]);

  return (
    <DocEditor
      key={doc.id}
      doc={doc}
      title={item.title}
      breadcrumb={<DocBreadcrumb doc={item} shelf={shelf} />}
    />
  );
}
