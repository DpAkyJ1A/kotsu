import { describe, expect, test } from 'vitest';

import { authErrorOf } from './auth-error';

const failure = (error: { status: number; code?: string }) =>
  Promise.resolve({ error });

describe('authErrorOf', () => {
  test('is null when the request worked', async () => {
    expect(await authErrorOf(Promise.resolve({ error: null }))).toBeNull();
  });

  test.each([
    ['invalidEmail', { status: 400, code: 'INVALID_EMAIL' }],
    ['wrongCode', { status: 400, code: 'INVALID_OTP' }],
    ['expiredCode', { status: 400, code: 'OTP_EXPIRED' }],
    ['tooManyAttempts', { status: 403, code: 'TOO_MANY_ATTEMPTS' }],
    ['tooManyRequests', { status: 429 }],
    ['tooManyCodes', { status: 429, code: 'TOO_MANY_CODES' }],
    ['passkeyFailed', { status: 401, code: 'PASSKEY_NOT_FOUND' }],
    ['passkeyFailed', { status: 401, code: 'AUTHENTICATION_FAILED' }],
    ['passkeyFailed', { status: 400, code: 'CHALLENGE_NOT_FOUND' }],
    [
      'passkeyExists',
      { status: 400, code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' },
    ],
    ['sessionNotFresh', { status: 403, code: 'SESSION_NOT_FRESH' }],
    ['unknown', { status: 400, code: 'AUTH_CANCELLED' }],
    ['unknown', { status: 500 }],
    ['unknown', { status: 400, code: 'SOMETHING_NEW' }],
  ])('names %s', async (name, error) => {
    expect(await authErrorOf(failure(error))).toBe(name);
  });

  test('turns a lost connection into unknown', async () => {
    const offline = Promise.reject(new TypeError('Failed to fetch'));

    expect(await authErrorOf(offline)).toBe('unknown');
  });
});
