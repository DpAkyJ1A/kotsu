import { describe, expect, test } from 'vitest';

import { googleClient } from './google-client';

describe('googleClient', () => {
  test('is on when both Google keys are set', () => {
    expect(
      googleClient({
        GOOGLE_CLIENT_ID: 'id.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'secret',
      }),
    ).toEqual({
      clientId: 'id.apps.googleusercontent.com',
      clientSecret: 'secret',
    });
  });

  test.for([
    {},
    { GOOGLE_CLIENT_ID: 'id.apps.googleusercontent.com' },
    { GOOGLE_CLIENT_SECRET: 'secret' },
    { GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' },
  ])(
    'is off without both keys, as on a preview or a self-hosted copy: %o',
    (keys) => {
      expect(googleClient(keys)).toBeUndefined();
    },
  );
});
