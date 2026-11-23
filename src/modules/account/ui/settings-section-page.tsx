import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { ChevronLeftIcon } from '@/ui/icons';
import { PageHeader } from '@/ui/page-header';

import type { Account } from '../core/account';
import type { GoogleLink } from '../core/google-link';
import type { Settings } from '../core/settings';
import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from '../core/settings-sections';
import { SettingsNav, SettingsNavLink } from './settings-nav';
import { SettingsSectionContent } from './settings-section-content';

type SettingsSectionPageProps = {
  section: SettingsSection;
  account: Account;
  settings: Settings;
  googleLink: GoogleLink;
  storage: ReactNode;
};

export function SettingsSectionPage({
  section,
  account,
  settings,
  googleLink,
  storage,
}: SettingsSectionPageProps) {
  const t = useTranslations('settings');

  return (
    <>
      <PageHeader>
        <Link
          href="/settings"
          aria-label={t('backToSettings')}
          className="-ml-1 flex items-center gap-0.5 rounded-md px-1 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden [&>svg]:size-4.5"
        >
          <ChevronLeftIcon />
          {t('title')}
        </Link>
      </PageHeader>
      <div className="md:px-6 md:pb-6">
        <div className="md:mx-auto md:flex md:min-h-140 md:max-w-3xl md:overflow-hidden md:rounded-2xl md:border">
          <SettingsNav
            className="max-md:hidden"
            heading={
              <p className="px-2.5 pt-1 text-base font-bold">{t('title')}</p>
            }
          >
            {SETTINGS_SECTIONS.map((option) => (
              <SettingsNavLink
                key={option}
                section={option}
                isCurrent={option === section}
              />
            ))}
          </SettingsNav>
          <section className="min-w-0 flex-1 px-6 pb-8 md:p-8">
            <header className="mb-6 grid gap-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-xl">
                {t(`sections.${section}.title`)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(`sections.${section}.description`)}
              </p>
            </header>
            <SettingsSectionContent
              section={section}
              account={account}
              settings={settings}
              googleLink={googleLink}
              storage={storage}
            />
          </section>
        </div>
      </div>
    </>
  );
}
