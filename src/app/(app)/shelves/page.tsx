import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SettingsAvatarLink } from '@/modules/account';
import { loadAccount } from '@/modules/account/loaders';
import { ShelvesScreen } from '@/modules/shelves';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('shelves') };
}

export default async function ShelvesPage() {
  const account = await loadAccount();

  return (
    <ShelvesScreen
      avatar={<SettingsAvatarLink account={account} className="md:hidden" />}
    />
  );
}
