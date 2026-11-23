import { afterEach, describe, expect, test, vi } from 'vitest';

const REQUIRED = {
  DATABASE_URL: 'postgres://kotsu:kotsu@localhost:5433/kotsu',
  BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters',
};

async function loadQuota(variables: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries({ ...REQUIRED, ...variables })) {
    vi.stubEnv(name, value);
  }
  vi.resetModules();
  const { storageQuotaOf } = await import('./storage-quota');
  return storageQuotaOf;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('storageQuotaOf', () => {
  test('takes the default from STORAGE_QUOTA_MB in megabytes of a million bytes', async () => {
    const storageQuotaOf = await loadQuota({ STORAGE_QUOTA_MB: '50' });

    expect(storageQuotaOf({ storageQuotaBytes: null })).toBe(50_000_000);
  });

  test("puts the user's own quota before the default", async () => {
    const storageQuotaOf = await loadQuota({ STORAGE_QUOTA_MB: '50' });

    expect(storageQuotaOf({ storageQuotaBytes: 200_000_000 })).toBe(
      200_000_000,
    );
    expect(storageQuotaOf({ storageQuotaBytes: 0 })).toBe(0);
  });

  test('has no limit when STORAGE_QUOTA_MB is unset or empty, as on a server of your own, whatever the machine running the tests has set', async () => {
    expect(
      (await loadQuota({ STORAGE_QUOTA_MB: undefined }))({
        storageQuotaBytes: null,
      }),
    ).toBeNull();
    expect(
      (await loadQuota({ STORAGE_QUOTA_MB: '' }))({ storageQuotaBytes: null }),
    ).toBeNull();
  });

  test('refuses a STORAGE_QUOTA_MB that is not a whole number above zero', async () => {
    for (const value of ['0', '-5', '1.5', 'lots']) {
      await expect(loadQuota({ STORAGE_QUOTA_MB: value })).rejects.toThrow(
        /STORAGE_QUOTA_MB/,
      );
    }
  });
});
