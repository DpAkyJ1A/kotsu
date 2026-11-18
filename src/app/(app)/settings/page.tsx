import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SettingsList } from '@/modules/account';
import { loadAccount, loadSettings } from '@/modules/account/loaders';
import { PageHeader } from '@/ui/page-header';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings');
  return { title: t('title') };
}

export default async function SettingsPage() {
  const [t, account, settings] = await Promise.all([
    getTranslations('settings'),
    loadAccount(),
    loadSettings(),
  ]);

  return (
    <>
      <PageHeader>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
      </PageHeader>
      <SettingsList account={account} settings={settings} />
    </>
  );
}
