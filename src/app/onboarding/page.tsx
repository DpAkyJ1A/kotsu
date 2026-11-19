import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { toNextPath } from '@/modules/account';
import { TemplatePicker } from '@/modules/onboarding';
import { isOnboarded } from '@/modules/onboarding/loaders';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('onboarding');
  return { title: t('title') };
}

export default async function OnboardingPage({
  searchParams,
}: PageProps<'/onboarding'>) {
  const next = toNextPath((await searchParams).next);
  if (await isOnboarded()) redirect(next);

  const t = await getTranslations('onboarding');

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="grid w-full max-w-3xl gap-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <TemplatePicker />
      </div>
    </main>
  );
}
