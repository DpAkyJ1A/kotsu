import { describe, expect, test } from 'vitest';

import { signInPath } from './sign-in-path';

describe('signInPath', () => {
  test('carries the page to return to', () => {
    expect(signInPath('/calendar?view=week')).toBe(
      '/sign-in?next=%2Fcalendar%3Fview%3Dweek',
    );
  });

  test.each([
    ['the home page', '/calendar'],
    ['no page', null],
  ])('leaves it out for %s', (_, next) => {
    expect(signInPath(next)).toBe('/sign-in');
  });
});
