import { useSyncExternalStore } from 'react';

import { themeColors } from '@/lib/theme-color';
import { themeAttribute, themeFrom } from '@/lib/theme-cookie';
import type { Theme } from '@/lib/user-settings';

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const applied = themeAttribute(theme);
  if (applied) root.dataset.theme = applied;
  else delete root.dataset.theme;
  paintWindow(theme);
  finishTransitions();
}

function paintWindow(theme: Theme) {
  for (const { media, color } of themeColors(theme)) {
    document
      .querySelector(`meta[name="theme-color"][media="${media}"]`)
      ?.setAttribute('content', color);
  }
}

export function appliedTheme() {
  return themeFrom(document.documentElement.dataset.theme);
}

export function useAppliedTheme(savedTheme: Theme) {
  return useSyncExternalStore(onThemeChange, appliedTheme, () => savedTheme);
}

export function visibleTheme() {
  const applied = appliedTheme();
  if (applied !== 'system') return applied;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function onThemeChange(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributeFilter: ['data-theme'],
  });
  return () => {
    observer.disconnect();
  };
}

function finishTransitions() {
  for (const animation of document.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
}
