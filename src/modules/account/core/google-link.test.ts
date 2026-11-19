import { describe, expect, test } from 'vitest';

import { googleLinkErrorOf, withoutReturnedError } from './google-link';

describe('googleLinkErrorOf', () => {
  test.each([
    ['no error', null],
    ['a cancel on Google', 'access_denied'],
  ])('says nothing after %s', (_, returnedError) => {
    expect(googleLinkErrorOf(returnedError)).toBeNull();
  });

  test('tells apart a Google account with another email', () => {
    expect(googleLinkErrorOf('email_does_not_match')).toBe('emailDoesNotMatch');
  });

  test.each([
    'unable_to_link_account',
    'account_already_linked_to_different_user',
    'state_mismatch',
  ])('reads %s as a failed connect', (returnedError) => {
    expect(googleLinkErrorOf(returnedError)).toBe('connectFailed');
  });
});

describe('withoutReturnedError', () => {
  test('drops the error Better Auth added and keeps the rest of the address', () => {
    const address = new URL(
      'https://kotsu.devazx.com/calendar?settings=security&error=email_does_not_match&error_description=Nope#top',
    );

    expect(withoutReturnedError(address)).toBe(
      '/calendar?settings=security#top',
    );
  });

  test('leaves no bare question mark behind', () => {
    const address = new URL(
      'https://kotsu.devazx.com/settings/security?error=access_denied',
    );

    expect(withoutReturnedError(address)).toBe('/settings/security');
  });
});
