import { describe, expect, test } from 'vitest';

import { relyingPartyId } from './relying-party-id';

const VERCEL_HOSTS = {
  VERCEL_PROJECT_PRODUCTION_URL: 'usekotsu.vercel.app',
  VERCEL_BRANCH_URL: 'kotsu-git-feat-passkeys-dpakyj1as-projects.vercel.app',
};

describe('relyingPartyId', () => {
  test('production passkeys belong to the production domain', () => {
    expect(relyingPartyId({ VERCEL_ENV: 'production', ...VERCEL_HOSTS })).toBe(
      'usekotsu.vercel.app',
    );
  });

  test('a preview keeps its passkeys on the branch URL, which outlives each push', () => {
    expect(relyingPartyId({ VERCEL_ENV: 'preview', ...VERCEL_HOSTS })).toBe(
      'kotsu-git-feat-passkeys-dpakyj1as-projects.vercel.app',
    );
  });

  test('outside Vercel passkeys belong to localhost', () => {
    expect(relyingPartyId({})).toBe('localhost');
    expect(relyingPartyId({ VERCEL_ENV: 'development', ...VERCEL_HOSTS })).toBe(
      'localhost',
    );
  });
});
