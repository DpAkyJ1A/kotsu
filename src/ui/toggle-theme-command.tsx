'use client';

import { useTranslations } from 'next-intl';

import { CommandPaletteItem } from './command-palette';
import { ContrastIcon } from './icons';
import { type Theme, themeCookie, themeFrom } from './theme-cookie';

export function ToggleThemeCommand() {
  const t = useTranslations('ui');

  return (
    <CommandPaletteItem keywords={[t('themeKeywords')]} onSelect={toggleTheme}>
      <ContrastIcon />
      {t('toggleTheme')}
    </CommandPaletteItem>
  );
}

function toggleTheme() {
  const root = document.documentElement;
  const theme = shownTheme(root) === 'dark' ? 'light' : 'dark';
  root.dataset.theme = theme;
  finishTransitions();
  document.cookie = themeCookie(theme);
}

function finishTransitions() {
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
}

function shownTheme(root: HTMLElement): Theme {
  const systemTheme = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  return themeFrom(root.dataset.theme) ?? systemTheme;
}
