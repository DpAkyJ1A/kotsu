import 'server-only';

import { getAuthenticatorName } from '@better-auth/passkey';

type PasskeyOrigin = {
  aaguid: string | undefined;
  userAgent: string | null | undefined;
};

const BROWSERS = [
  ['Edg', 'Edge'],
  ['OPR/', 'Opera'],
  ['SamsungBrowser/', 'Samsung Internet'],
  ['Firefox/', 'Firefox'],
  ['FxiOS/', 'Firefox'],
  ['CriOS/', 'Chrome'],
  ['Chrome/', 'Chrome'],
  ['Safari/', 'Safari'],
] as const;

const SYSTEMS = [
  ['iPhone', 'iPhone'],
  ['iPad', 'iPad'],
  ['Android', 'Android'],
  ['CrOS', 'ChromeOS'],
  ['Mac OS X', 'Mac'],
  ['Windows', 'Windows'],
  ['Linux', 'Linux'],
] as const;

export function passkeyName({ aaguid, userAgent }: PasskeyOrigin) {
  return getAuthenticatorName(aaguid) ?? deviceName(userAgent ?? '');
}

function deviceName(userAgent: string) {
  const parts = [
    firstFound(BROWSERS, userAgent),
    firstFound(SYSTEMS, userAgent),
  ];
  return parts.filter((part) => part !== undefined).join(' · ') || undefined;
}

function firstFound(
  marks: readonly (readonly [string, string])[],
  userAgent: string,
) {
  return marks.find(([mark]) => userAgent.includes(mark))?.[1];
}
