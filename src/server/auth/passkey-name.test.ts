import { describe, expect, test } from 'vitest';

import { passkeyName } from './passkey-name';

const GOOGLE_PASSWORD_MANAGER = 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4';
const UNKNOWN_AUTHENTICATOR = '00000000-0000-0000-0000-000000000000';

const SAFARI_ON_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';

describe('passkeyName', () => {
  test('names a known password manager by its authenticator id', () => {
    expect(
      passkeyName({
        aaguid: GOOGLE_PASSWORD_MANAGER,
        userAgent: SAFARI_ON_MAC,
      }),
    ).toBe('Google Password Manager');
  });

  test.each([
    ['Safari · Mac', SAFARI_ON_MAC],
    [
      'Safari · iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
    ],
    [
      'Chrome · iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1',
    ],
    [
      'Chrome · Android',
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
    ],
    [
      'Chrome · Windows',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    ],
    [
      'Edge · Mac',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
    ],
    [
      'Firefox · Linux',
      'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
    ],
    [
      'Chrome · ChromeOS',
      'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    ],
  ])(
    'without a known password manager, names the browser and system: %s',
    (name, userAgent) => {
      expect(passkeyName({ aaguid: UNKNOWN_AUTHENTICATOR, userAgent })).toBe(
        name,
      );
    },
  );

  test('keeps whichever half of the device it recognises', () => {
    expect(
      passkeyName({ aaguid: undefined, userAgent: 'SomeBrowser (Windows)' }),
    ).toBe('Windows');
  });

  test('has no name when neither the authenticator nor the device is known', () => {
    expect(passkeyName({ aaguid: undefined, userAgent: 'curl/8.7.1' })).toBe(
      undefined,
    );
    expect(passkeyName({ aaguid: undefined, userAgent: null })).toBe(undefined);
  });
});
