import { describe, expect, test } from 'vitest';

import { deployment } from './deployment';

const VERCEL_HOSTS = {
  VERCEL_PROJECT_PRODUCTION_URL: 'usekotsu.vercel.app',
  VERCEL_BRANCH_URL: 'kotsu-git-feat-passkeys-dpakyj1as-projects.vercel.app',
};

const NO_PROXIES = { TRUSTED_PROXIES: [] };

describe('deployment', () => {
  test('production passkeys belong to the production domain', () => {
    expect(
      deployment({ VERCEL_ENV: 'production', ...VERCEL_HOSTS, ...NO_PROXIES })
        .rpID,
    ).toBe('usekotsu.vercel.app');
  });

  test('a preview keeps its passkeys on the branch URL, which outlives each push', () => {
    expect(
      deployment({ VERCEL_ENV: 'preview', ...VERCEL_HOSTS, ...NO_PROXIES })
        .rpID,
    ).toBe('kotsu-git-feat-passkeys-dpakyj1as-projects.vercel.app');
  });

  test('outside Vercel passkeys belong to localhost', () => {
    expect(deployment(NO_PROXIES).rpID).toBe('localhost');
    expect(
      deployment({ VERCEL_ENV: 'development', ...VERCEL_HOSTS, ...NO_PROXIES })
        .rpID,
    ).toBe('localhost');
  });

  test('a self-hosted copy answers only on APP_URL and keeps passkeys on its host', () => {
    expect(
      deployment({
        APP_URL: 'https://kotsu.example.com',
        ...VERCEL_HOSTS,
        ...NO_PROXIES,
      }),
    ).toEqual({
      baseURL: 'https://kotsu.example.com',
      rpID: 'kotsu.example.com',
      trustedProxies: [],
    });
  });
});
