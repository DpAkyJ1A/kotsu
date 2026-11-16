import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { EmailForm, toNextPath } from '@/modules/account';
import { findCtx } from '@/server/ctx/get-ctx';

export default async function SignInPage({
  searchParams,
}: PageProps<'/sign-in'>) {
  const next = toNextPath((await searchParams).next);
  if (await findCtx()) redirect(next);

  const t = await getTranslations('auth');

  return (
    <>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold">{t('signInTitle')}</h1>
        <p className="text-muted-foreground">{t('signInDescription')}</p>
      </header>
      <EmailForm next={next} />
    </>
  );
}
