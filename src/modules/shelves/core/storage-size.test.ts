import { describe, expect, test } from 'vitest';

import { storageSizeOf } from './storage-size';

describe('storageSizeOf', () => {
  test('counts in kilobytes below a megabyte, of a thousand bytes each', () => {
    expect(storageSizeOf(0)).toEqual({
      value: 0,
      unit: 'kilobyte',
      fractionDigits: 1,
    });
    expect(storageSizeOf(512_000)).toEqual({
      value: 512,
      unit: 'kilobyte',
      fractionDigits: 0,
    });
  });

  test('counts in megabytes from a million bytes and in gigabytes from a billion', () => {
    expect(storageSizeOf(1_000_000)).toMatchObject({
      value: 1,
      unit: 'megabyte',
    });
    expect(storageSizeOf(68_000_000)).toMatchObject({
      value: 68,
      unit: 'megabyte',
    });
    expect(storageSizeOf(2_500_000_000)).toMatchObject({
      value: 2.5,
      unit: 'gigabyte',
    });
  });

  test('shows one decimal only below ten of its unit', () => {
    expect(storageSizeOf(9_900_000).fractionDigits).toBe(1);
    expect(storageSizeOf(10_000_000).fractionDigits).toBe(0);
    expect(storageSizeOf(1_500).fractionDigits).toBe(1);
  });
});
