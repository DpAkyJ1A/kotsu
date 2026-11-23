'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/ui/dialog';
import { useShortcut } from '@/ui/use-shortcut';

import type { Account } from '../core/account';
import type { GoogleLink } from '../core/google-link';
import type { Settings } from '../core/settings';
import { SETTINGS_SECTIONS } from '../core/settings-sections';
import {
  openSettingsDialog,
  showSettingsSection,
} from '../hooks/settings-history';
import { useSettingsDialog } from '../hooks/use-settings-dialog';
import { SettingsNav, SettingsNavButton } from './settings-nav';
import { SettingsSectionContent } from './settings-section-content';

type SettingsDialogProps = {
  account: Account;
  settings: Settings;
  googleLink: GoogleLink;
  storage: ReactNode;
};

export function SettingsDialog({
  account,
  settings,
  googleLink,
  storage,
}: SettingsDialogProps) {
  const t = useTranslations('settings');
  const { section, close } = useSettingsDialog();
  const [lastSection, setLastSection] = useState(section ?? 'account');
  if (section !== null && section !== lastSection) setLastSection(section);
  const shownSection = section ?? lastSection;

  useShortcut('Comma', (event) => {
    event.preventDefault();
    if (section === null) openSettingsDialog('account');
  });

  return (
    <Dialog
      open={section !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-3xl gap-0 p-0 md:h-140 md:flex-row"
      >
        <SettingsNav
          heading={
            <DialogTitle className="px-2.5 pt-1 text-base">
              {t('title')}
            </DialogTitle>
          }
        >
          {SETTINGS_SECTIONS.map((option) => (
            <SettingsNavButton
              key={option}
              section={option}
              isCurrent={option === shownSection}
              onClick={() => {
                showSettingsSection(option);
              }}
            />
          ))}
        </SettingsNav>
        <section className="min-w-0 flex-1 p-6 md:overflow-y-auto md:p-8">
          <header className="mb-6 grid gap-1">
            <h2 className="text-xl font-bold tracking-tight">
              {t(`sections.${shownSection}.title`)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(`sections.${shownSection}.description`)}
            </p>
          </header>
          <SettingsSectionContent
            section={shownSection}
            account={account}
            settings={settings}
            googleLink={googleLink}
            storage={storage}
          />
        </section>
      </DialogContent>
    </Dialog>
  );
}
