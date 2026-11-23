import { describe, expect, test } from 'vitest';

import { fitsInQuota, freeBytesOf, storageLevelOf } from './storage';

const QUOTA = 100_000_000;

describe('fitsInQuota', () => {
  test('lets a write reach the quota but not pass it', () => {
    expect(fitsInQuota(QUOTA, QUOTA)).toBe(true);
    expect(fitsInQuota(QUOTA + 1, QUOTA)).toBe(false);
  });

  test('lets everything in where there is no quota', () => {
    expect(fitsInQuota(Number.MAX_SAFE_INTEGER, null)).toBe(true);
  });
});

describe('storageLevelOf', () => {
  test('stays calm below 80 %', () => {
    expect(storageLevelOf(0, QUOTA)).toBe('calm');
    expect(storageLevelOf(79_999_999, QUOTA)).toBe('calm');
  });

  test('runs low from 80 % and is almost full from 95 %', () => {
    expect(storageLevelOf(80_000_000, QUOTA)).toBe('low');
    expect(storageLevelOf(94_999_999, QUOTA)).toBe('low');
    expect(storageLevelOf(95_000_000, QUOTA)).toBe('critical');
  });

  test('is full once the quota is reached, as nothing can grow then, and past it after a lower quota', () => {
    expect(storageLevelOf(QUOTA - 1, QUOTA)).toBe('critical');
    expect(storageLevelOf(QUOTA, QUOTA)).toBe('full');
    expect(storageLevelOf(QUOTA * 2, QUOTA)).toBe('full');
    expect(storageLevelOf(0, 0)).toBe('full');
  });
});

describe('freeBytesOf', () => {
  test('is what is left, and never less than nothing', () => {
    expect(freeBytesOf(68_000_000, QUOTA)).toBe(32_000_000);
    expect(freeBytesOf(QUOTA * 2, QUOTA)).toBe(0);
  });
});
