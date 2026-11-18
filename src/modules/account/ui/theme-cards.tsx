'use client';

import { useTranslations } from 'next-intl';
import { startTransition } from 'react';

import { type Theme, THEMES } from '@/lib/user-settings';
import { useAppliedTheme } from '@/ui/apply-theme';
import { RadioCard, RadioCards } from '@/ui/radio-cards';

import { usePickTheme } from '../hooks/use-pick-theme';

type ThemeCardsProps = { theme: Theme };

export function ThemeCards({ theme }: ThemeCardsProps) {
  const t = useTranslations('settings');
  const pickTheme = usePickTheme();
  const shownTheme = useAppliedTheme(theme);

  function handlePick(picked: Theme) {
    startTransition(async () => {
      await pickTheme(picked);
    });
  }

  return (
    <RadioCards aria-label={t('theme')} value={shownTheme}>
      {THEMES.map((option) => (
        <RadioCard
          key={option}
          value={option}
          picture={<ThemePicture theme={option} />}
          onClick={() => {
            handlePick(option);
          }}
        >
          {t(option)}
        </RadioCard>
      ))}
    </RadioCards>
  );
}

function ThemePicture({ theme }: { theme: Theme }) {
  if (theme !== 'system') return <AppSketch theme={theme} />;
  return (
    <span className="grid size-full grid-cols-2">
      <AppSketch theme="light" />
      <AppSketch theme="dark" />
    </span>
  );
}

function AppSketch({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <span data-theme={theme} className="flex size-full bg-background">
      <span className="w-1/4 shrink-0 border-r bg-sidebar" />
      <span className="grid flex-1 content-start gap-1.5 p-2">
        <span className="h-1.5 w-4/5 rounded-full bg-blue" />
        <span className="h-1.5 rounded-full bg-violet" />
        <span className="h-1.5 w-3/5 rounded-full bg-amber" />
      </span>
    </span>
  );
}
