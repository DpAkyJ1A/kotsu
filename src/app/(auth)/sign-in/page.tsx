import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { signInPath } from '@/lib/sign-in-path';
import {
  EmailForm,
  GoogleSignIn,
  SIGN_IN_CANCELLED,
  toNextPath,
} from '@/modules/account';
import { hasGoogleSignIn } from '@/server/auth/auth';
import { findCtx } from '@/server/ctx/get-ctx';

export default async function SignInPage({
  searchParams,
}: PageProps<'/sign-in'>) {
  const { next: nextParam, error } = await searchParams;
  const next = toNextPath(nextParam);
  if (await findCtx()) redirect(next);
  if (error === SIGN_IN_CANCELLED) redirect(signInPath(next));

  const t = await getTranslations('auth');

  return (
    <>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold">{t('signInTitle')}</h1>
        <p className="text-muted-foreground">{t('signInDescription')}</p>
      </header>
      <div className="grid gap-6">
        {hasGoogleSignIn && (
          <>
            <GoogleSignIn next={next} hasFailed={typeof error === 'string'} />
            <p className="flex items-center gap-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              {t('or')}
            </p>
          </>
        )}
        <EmailForm next={next} />
      </div>
    </>
  );
}
