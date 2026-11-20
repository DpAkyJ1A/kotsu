import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ShelfHeading } from '@/modules/shelves';
import { loadNavigation } from '@/modules/shelves/loaders';
import { ChevronLeftIcon } from '@/ui/icons';
import { PageHeader } from '@/ui/page-header';

type ShelfParams = PageProps<'/shelves/[shelfId]'>['params'];

async function shelfOf(params: ShelfParams) {
  const { shelfId } = await params;
  const { shelves } = await loadNavigation();
  return shelves.find(({ id }) => id === shelfId) ?? notFound();
}

export async function generateMetadata({
  params,
}: PageProps<'/shelves/[shelfId]'>): Promise<Metadata> {
  const shelf = await shelfOf(params);
  return { title: shelf.name };
}

export default async function ShelfPage({
  params,
}: PageProps<'/shelves/[shelfId]'>) {
  const [shelf, t] = await Promise.all([shelfOf(params), getTranslations()]);

  return (
    <>
      <PageHeader>
        <Link
          href="/shelves"
          aria-label={t('nav.shelves')}
          className="-ml-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden [&>svg]:size-6"
        >
          <ChevronLeftIcon />
        </Link>
        <ShelfHeading shelf={shelf} />
      </PageHeader>
      <div className="grid gap-1 px-6 py-4">
        <p className="font-semibold">{t('shelves.emptyShelf')}</p>
        <p className="text-sm text-muted-foreground">
          {t('shelves.emptyShelfHint')}
        </p>
      </div>
    </>
  );
}
