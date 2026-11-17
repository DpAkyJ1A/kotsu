import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { CodeForm, signInPagePath, toNextPath } from '@/modules/account';
import { findCtx } from '@/server/ctx/get-ctx';

export default async function CodePage({
  searchParams,
}: PageProps<'/sign-in/code'>) {
  const { email, next: nextParam } = await searchParams;
  const next = toNextPath(nextParam);
  if (await findCtx()) redirect(next);
  if (typeof email !== 'string' || !email) redirect(signInPagePath(next));

  const t = await getTranslations('auth');

  return (
    <>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold">{t('codeTitle')}</h1>
        <p className="text-muted-foreground">
          {t.rich('codeDescription', {
            email,
            strong: (chunks) => (
              <strong className="font-semibold text-foreground">
                {chunks}
              </strong>
            ),
          })}
        </p>
      </header>
      <CodeForm email={email} next={next} />
    </>
  );
}
