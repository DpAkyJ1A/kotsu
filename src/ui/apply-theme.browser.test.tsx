import { afterEach, beforeEach, expect, test } from 'vitest';

import { BACKGROUND } from '@/lib/theme-color';

import { applyTheme } from './apply-theme';

const LIGHT_SYSTEM = '(prefers-color-scheme: light)';
const DARK_SYSTEM = '(prefers-color-scheme: dark)';

beforeEach(() => {
  for (const media of [LIGHT_SYSTEM, DARK_SYSTEM]) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.media = media;
    meta.content = BACKGROUND.light;
    document.head.append(meta);
  }
});

afterEach(() => {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.remove();
  });
  delete document.documentElement.dataset.theme;
});

function windowColor(media: string) {
  return document
    .querySelector(`meta[name="theme-color"][media="${media}"]`)
    ?.getAttribute('content');
}

test('paints the window dark with the page, whatever the system', () => {
  applyTheme('dark');

  expect(windowColor(LIGHT_SYSTEM)).toBe(BACKGROUND.dark);
  expect(windowColor(DARK_SYSTEM)).toBe(BACKGROUND.dark);
});

test('hands the window colour back to the system with the auto theme', () => {
  applyTheme('dark');
  applyTheme('system');

  expect(windowColor(LIGHT_SYSTEM)).toBe(BACKGROUND.light);
  expect(windowColor(DARK_SYSTEM)).toBe(BACKGROUND.dark);
});
