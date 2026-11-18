import { describe, expect, test } from 'vitest';

import { UpdateSettingsInput } from './settings';

const accepts = (patch: unknown) =>
  UpdateSettingsInput.safeParse(patch).success;

describe('UpdateSettingsInput', () => {
  test.each([
    { theme: 'system' },
    { locale: 'ru' },
    { dayEndsAt: '00:00' },
    { dayEndsAt: '06:00' },
    { weekStart: 'sunday' },
    { timeFormat: 'h12' },
    { theme: 'dark', locale: 'en' },
  ])('accepts %j', (patch) => {
    expect(accepts(patch)).toBe(true);
  });

  test.each([
    ['a day that ends after 06:00', { dayEndsAt: '06:01' }],
    ['a time without minutes', { dayEndsAt: '4' }],
    ['a time with seconds', { dayEndsAt: '04:00:00' }],
    ['a language Kotsu does not speak', { locale: 'de' }],
    ['a setting that does not exist', { fontSize: 'large' }],
    ['the time zone, which only onboarding sets', { timezone: 'UTC' }],
    ['an empty patch', {}],
    ['a patch whose only setting is undefined', { theme: undefined }],
  ])('refuses %s', (_, patch) => {
    expect(accepts(patch)).toBe(false);
  });
});
