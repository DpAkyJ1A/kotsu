import { describe, expect, test } from 'vitest';

import {
  SIDEBAR_COOKIE,
  sidebarCookie,
  sidebarStateFrom,
} from './sidebar-cookie';

describe('sidebar cookie', () => {
  test.each(['open', 'closed'] as const)(
    'reads back the %s state it wrote',
    (state) => {
      const [pair = ''] = sidebarCookie(state).split(';');
      const [name, value] = pair.split('=');

      expect(name).toBe(SIDEBAR_COOKIE);
      expect(sidebarStateFrom(value)).toBe(state);
    },
  );

  test.each([
    ['no cookie', undefined],
    ['an unknown value', 'half'],
  ])('opens the sidebar for %s', (_, cookie) => {
    expect(sidebarStateFrom(cookie)).toBe('open');
  });

  test('keeps the choice for a year on every page', () => {
    expect(sidebarCookie('closed')).toBe(
      'sidebar=closed; path=/; max-age=31536000; samesite=lax',
    );
  });
});
