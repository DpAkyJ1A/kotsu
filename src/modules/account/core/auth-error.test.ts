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
