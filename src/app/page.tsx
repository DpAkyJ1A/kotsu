import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className="grid min-h-dvh place-content-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('tagline')}</p>
    </main>
  );
}
