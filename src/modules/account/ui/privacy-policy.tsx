import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { KotsuBee } from '@/ui/kotsu-bee';

const SITE = 'kotsu.devazx.com';
const OPERATOR = 'Oleksii Zvaholskyi';
const CONTACT = 'privacy@devazx.com';
const UPDATED_ON = new Date('2026-11-19');

const MESSAGE_VALUES = {
  name: OPERATOR,
  email: CONTACT,
  strong: (chunks: ReactNode) => (
    <strong className="font-semibold">{chunks}</strong>
  ),
  contact: (chunks: ReactNode) => (
    <a
      href={`mailto:${CONTACT}`}
      className="rounded-xs font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {chunks}
    </a>
  ),
};

const LIST = 'grid list-disc gap-2 pl-5 marker:text-muted-foreground';

export function PrivacyPolicy() {
  const t = useTranslations('privacy');
  const format = useFormatter();

  return (
    <article className="grid gap-10">
      <header className="grid gap-8">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-md text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <KotsuBee size={32} />
          {t('home')}
        </Link>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('updated', {
              date: format.dateTime(UPDATED_ON, 'monthDayYear', {
                timeZone: 'UTC',
              }),
            })}
          </p>
        </div>
        <p>{t('scope', { site: SITE })}</p>
      </header>

      <Section title={t('operator.title')}>
        <p>{t.rich('operator.text', MESSAGE_VALUES)}</p>
      </Section>

      <Section title={t('data.title')}>
        <ul className={LIST}>
          <li>{t.rich('data.account', MESSAGE_VALUES)}</li>
          <li>{t.rich('data.content', MESSAGE_VALUES)}</li>
          <li>{t.rich('data.signIn', MESSAGE_VALUES)}</li>
        </ul>
        <p>{t('data.none')}</p>
      </Section>

      <Section title={t('use.title')}>
        <p>{t('use.purposes')}</p>
        <p>{t('use.basis')}</p>
      </Section>

      <Section title={t('sharing.title')}>
        <p>{t('sharing.intro')}</p>
        <ul className={LIST}>
          <li>{t.rich('sharing.vercel', MESSAGE_VALUES)}</li>
          <li>{t.rich('sharing.neon', MESSAGE_VALUES)}</li>
          <li>{t.rich('sharing.resend', MESSAGE_VALUES)}</li>
          <li>{t.rich('sharing.google', MESSAGE_VALUES)}</li>
        </ul>
        <p>{t('sharing.abroad')}</p>
      </Section>

      <Section title={t('cookies.title')}>
        <p>{t('cookies.intro')}</p>
        <ul className={LIST}>
          <li>{t.rich('cookies.signIn', MESSAGE_VALUES)}</li>
          <li>{t.rich('cookies.choices', MESSAGE_VALUES)}</li>
        </ul>
        <p>{t('cookies.none')}</p>
      </Section>

      <Section title={t('retention.title')}>
        <p>{t('retention.account')}</p>
        <p>{t('retention.signIn')}</p>
      </Section>

      <Section title={t('rights.title')}>
        <p>{t.rich('rights.text', MESSAGE_VALUES)}</p>
        <p>{t('rights.complaint')}</p>
      </Section>

      <Section title={t('deletion.title')}>
        <p>{t.rich('deletion.text', MESSAGE_VALUES)}</p>
      </Section>

      <Section title={t('changes.title')}>
        <p>{t('changes.text')}</p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
