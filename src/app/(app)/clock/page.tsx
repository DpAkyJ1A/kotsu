import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/ui/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('clock') };
}

export default async function ClockPage() {
  const t = await getTranslations('nav');

  return (
    <PageHeader>
      <h1 className="text-2xl font-bold tracking-tight">{t('clock')}</h1>
    </PageHeader>
  );
}
