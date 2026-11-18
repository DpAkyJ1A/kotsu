import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SettingsAvatarLink } from '@/modules/account';
import { loadAccount } from '@/modules/account/loaders';
import { PageHeader } from '@/ui/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('shelves') };
}

export default async function ShelvesPage() {
  const [t, account] = await Promise.all([
    getTranslations('nav'),
    loadAccount(),
  ]);

  return (
    <PageHeader>
      <h1 className="text-2xl font-bold tracking-tight">{t('shelves')}</h1>
      <SettingsAvatarLink account={account} className="ml-auto md:hidden" />
    </PageHeader>
  );
}
