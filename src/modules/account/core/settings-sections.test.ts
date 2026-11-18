import { describe, expect, test } from 'vitest';

import {
  settingsDialogHref,
  settingsDialogSection,
  settingsSectionFrom,
} from './settings-sections';

describe('settingsSectionFrom', () => {
  test.each(['account', 'appearance'] as const)('knows %s', (section) => {
    expect(settingsSectionFrom(section)).toBe(section);
  });

  test.each([
    ['a section that does not exist yet', 'passkeys'],
    ['another case', 'Account'],
    ['an empty value', ''],
    ['no value', null],
  ])('is null for %s', (_, value) => {
    expect(settingsSectionFrom(value)).toBeNull();
  });
});

describe('settingsDialogSection', () => {
  test('reads the section from the settings parameter', () => {
    expect(
      settingsDialogSection(
        new URLSearchParams('view=week&settings=appearance'),
      ),
    ).toBe('appearance');
  });

  test('is null without the parameter', () => {
    expect(settingsDialogSection(new URLSearchParams('view=week'))).toBeNull();
  });
});

describe('settingsDialogHref', () => {
  test('opens a section over the page and keeps its own parameters', () => {
    expect(
      settingsDialogHref(
        { pathname: '/calendar', search: '?view=week' },
        'account',
      ),
    ).toBe('/calendar?view=week&settings=account');
  });

  test('swaps one section for another', () => {
    expect(
      settingsDialogHref(
        { pathname: '/calendar', search: '?settings=account' },
        'appearance',
      ),
    ).toBe('/calendar?settings=appearance');
  });

  test('closes back to the page as it was', () => {
    expect(
      settingsDialogHref(
        { pathname: '/calendar', search: '?view=week&settings=account' },
        null,
      ),
    ).toBe('/calendar?view=week');
  });

  test('leaves no question mark behind', () => {
    expect(
      settingsDialogHref(
        { pathname: '/shelves', search: '?settings=account' },
        null,
      ),
    ).toBe('/shelves');
  });
});
