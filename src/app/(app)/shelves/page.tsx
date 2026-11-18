import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AccountAvatarMenu } from '@/modules/account';
import { loadAccount, loadSettings } from '@/modules/account/loaders';
import { PageHeader } from '@/ui/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('shelves') };
}

export default async function ShelvesPage() {
  const [t, account, settings] = await Promise.all([
    getTranslations('nav'),
    loadAccount(),
    loadSettings(),
  ]);

  return (
    <PageHeader>
      <h1 className="text-2xl font-bold tracking-tight">{t('shelves')}</h1>
      <AccountAvatarMenu
        account={account}
        settings={settings}
        className="ml-auto md:hidden"
      />
    </PageHeader>
  );
}
