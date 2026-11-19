import { afterEach, describe, expect, test, vi } from 'vitest';

const REQUIRED = {
  DATABASE_URL: 'postgres://kotsu:kotsu@localhost:5433/kotsu',
  BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters',
};

async function loadEnv(variables: Record<string, string>) {
  for (const [name, value] of Object.entries({ ...REQUIRED, ...variables })) {
    vi.stubEnv(name, value);
  }
  vi.resetModules();
  const { env } = await import('./env');
  return env;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('env', () => {
  test('an empty variable counts as unset', async () => {
    const env = await loadEnv({
      APP_URL: '',
      RESEND_API_KEY: '',
      EMAIL_FROM: '',
      SIGN_IN_CODES_IN_LOG: '',
      TRUSTED_PROXIES: '',
    });

    expect(env.APP_URL).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env).toMatchObject({
      EMAIL_FROM: 'Kotsu <no-reply@kotsu.devazx.com>',
      SIGN_IN_CODES_IN_LOG: false,
      TRUSTED_PROXIES: [],
    });
  });

  test('APP_URL keeps only the origin', async () => {
    const env = await loadEnv({ APP_URL: 'https://kotsu.example.com/app/' });

    expect(env.APP_URL).toBe('https://kotsu.example.com');
  });

  test('TRUSTED_PROXIES takes addresses and ranges separated by commas', async () => {
    const env = await loadEnv({
      TRUSTED_PROXIES: '10.0.0.0/8, 192.0.2.1,fd00::/8',
    });

    expect(env.TRUSTED_PROXIES).toEqual([
      '10.0.0.0/8',
      '192.0.2.1',
      'fd00::/8',
    ]);
  });

  test('SIGN_IN_CODES_IN_LOG reads true and false', async () => {
    expect(
      (await loadEnv({ SIGN_IN_CODES_IN_LOG: 'true' })).SIGN_IN_CODES_IN_LOG,
    ).toBe(true);
    expect(
      (await loadEnv({ SIGN_IN_CODES_IN_LOG: 'false' })).SIGN_IN_CODES_IN_LOG,
    ).toBe(false);
  });

  test.for([
    { name: 'TRUSTED_PROXIES', value: 'proxy.example.com' },
    { name: 'APP_URL', value: 'kotsu.example.com' },
    { name: 'SIGN_IN_CODES_IN_LOG', value: 'sure' },
  ])(
    'refuses $name=$value and names the variable, not its value',
    async ({ name, value }) => {
      const loading = loadEnv({ [name]: value });

      await expect(loading).rejects.toThrow(name);
      await expect(loading).rejects.not.toThrow(value);
    },
  );
});
