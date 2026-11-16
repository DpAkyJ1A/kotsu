import { useTranslations } from 'next-intl';

export default function SignInPage() {
  const t = useTranslations('auth');

  return (
    <main className="grid min-h-dvh place-content-center p-6 text-center">
      <h1 className="text-3xl font-bold">{t('signInTitle')}</h1>
    </main>
  );
}
