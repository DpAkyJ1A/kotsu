import { describe, expect, test } from 'vitest';

import { onboardingPath } from './onboarding-path';

describe('onboardingPath', () => {
  test('carries the page to go on to', () => {
    expect(onboardingPath('/practice?mix=on')).toBe(
      '/onboarding?next=%2Fpractice%3Fmix%3Don',
    );
  });

  test.each([
    ['the home page', '/calendar'],
    ['no page', null],
  ])('leaves it out for %s', (_, next) => {
    expect(onboardingPath(next)).toBe('/onboarding');
  });
});
