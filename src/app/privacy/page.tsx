import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PrivacyPolicy } from '@/modules/account';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return { title: t('title') };
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 md:py-16">
      <PrivacyPolicy />
    </main>
  );
}
