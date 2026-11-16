import { getTranslations } from 'next-intl/server';

import { SignOutButton } from '@/modules/account';
import { findCtx } from '@/server/ctx/get-ctx';

export default async function HomePage() {
  const [t, ctx] = await Promise.all([getTranslations('home'), findCtx()]);

  return (
    <main className="grid min-h-dvh place-content-center gap-6 p-6 text-center">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('tagline')}</p>
      </div>
      {ctx && <SignOutButton />}
    </main>
  );
}
