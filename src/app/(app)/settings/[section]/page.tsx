import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { settingsSectionFrom, SettingsSectionPage } from '@/modules/account';
import { loadAccount, loadSettings } from '@/modules/account/loaders';

type SectionParams = PageProps<'/settings/[section]'>['params'];

async function sectionOf(params: SectionParams) {
  return settingsSectionFrom((await params).section) ?? notFound();
}

export async function generateMetadata({
  params,
}: PageProps<'/settings/[section]'>): Promise<Metadata> {
  const [section, t] = await Promise.all([
    sectionOf(params),
    getTranslations('settings.sections'),
  ]);
  return { title: t(`${section}.title`) };
}

export default async function SettingsSectionRoute({
  params,
}: PageProps<'/settings/[section]'>) {
  const [section, account, settings] = await Promise.all([
    sectionOf(params),
    loadAccount(),
    loadSettings(),
  ]);

  return (
    <SettingsSectionPage
      section={section}
      account={account}
      settings={settings}
    />
  );
}
