import { describe, expect, test } from 'vitest';

import { TimeZone } from './time-zone';

describe('TimeZone', () => {
  test.each(['Europe/Kyiv', 'America/New_York', 'UTC'])(
    'takes the IANA name %s',
    (name) => {
      expect(TimeZone.parse(name)).toBe(name);
    },
  );

  test.each([
    ['an unknown name', 'Mars/Olympus_Mons'],
    ['the name a browser gives when it has none', 'Etc/Unknown'],
    ['an empty name', ''],
    ['an offset, which Postgres reads with the sign flipped', '+05:00'],
  ])('refuses %s', (_, name) => {
    expect(TimeZone.safeParse(name).success).toBe(false);
  });
});
