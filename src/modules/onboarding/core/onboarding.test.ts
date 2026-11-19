import { describe, expect, test } from 'vitest';

import { CompleteOnboardingInput } from './onboarding';

describe('CompleteOnboardingInput', () => {
  test('keeps the time zone the browser sent', () => {
    expect(
      CompleteOnboardingInput.parse({
        templateId: 'language',
        timezone: 'Europe/Madrid',
      }),
    ).toEqual({ templateId: 'language', timezone: 'Europe/Madrid' });
  });

  test('starts with UTC when the server does not know the time zone', () => {
    expect(
      CompleteOnboardingInput.parse({
        templateId: 'blank',
        timezone: 'Etc/Unknown',
      }),
    ).toEqual({ templateId: 'blank', timezone: 'UTC' });
  });

  test('refuses a template that does not exist', () => {
    expect(
      CompleteOnboardingInput.safeParse({
        templateId: 'cooking',
        timezone: 'UTC',
      }).success,
    ).toBe(false);
  });
});
