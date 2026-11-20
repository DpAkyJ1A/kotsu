import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { shelfPath } from '@/modules/shelves';
import { loadNavigation } from '@/modules/shelves/loaders';
import { ChevronLeftIcon } from '@/ui/icons';
import { PageHeader } from '@/ui/page-header';

type DocParams = PageProps<'/docs/[itemId]'>['params'];

async function docOf(params: DocParams) {
  const { itemId } = await params;
  const { shelves, items } = await loadNavigation();
  const doc =
    items.find(({ id, kind }) => id === itemId && kind === 'doc') ?? notFound();
  const shelf = shelves.find(({ id }) => id === doc.shelfId) ?? notFound();
  return { doc, shelf };
}

export async function generateMetadata({
  params,
}: PageProps<'/docs/[itemId]'>): Promise<Metadata> {
  const { doc } = await docOf(params);
  return { title: doc.title };
}

export default async function DocPage({ params }: PageProps<'/docs/[itemId]'>) {
  const { doc, shelf } = await docOf(params);

  return (
    <PageHeader>
      <Link
        href={shelfPath(shelf.id)}
        aria-label={shelf.name}
        className="-ml-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden [&>svg]:size-6"
      >
        <ChevronLeftIcon />
      </Link>
      <h1 className="truncate text-2xl font-bold tracking-tight">
        {doc.title}
      </h1>
    </PageHeader>
  );
}
