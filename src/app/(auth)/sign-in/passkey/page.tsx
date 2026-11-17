import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PasskeyOffer, signInPagePath, toNextPath } from '@/modules/account';
import { answerPasskeyOffer } from '@/modules/account/actions';
import { isPasskeyOfferAnswered } from '@/modules/account/loaders';
import { findCtx } from '@/server/ctx/get-ctx';

export default async function PasskeyPage({
  searchParams,
}: PageProps<'/sign-in/passkey'>) {
  const next = toNextPath((await searchParams).next);
  if (!(await findCtx())) redirect(signInPagePath(next));
  if (await isPasskeyOfferAnswered()) redirect(next);

  const t = await getTranslations('auth');

  return (
    <>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold">{t('passkeyTitle')}</h1>
        <p className="text-muted-foreground">{t('passkeyDescription')}</p>
      </header>
      <PasskeyOffer onAnswer={answerPasskeyOffer.bind(null, next)} />
    </>
  );
}
