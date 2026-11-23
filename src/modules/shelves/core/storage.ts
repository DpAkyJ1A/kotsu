import type { PaletteColor } from '@/lib/palette-colors';

import type { Shelf } from './shelf';

export const ITEM_ROW_BYTES = 1_000;

export const LARGEST_LISTED = 5;

const RUNNING_LOW_FROM = 0.8;
const ALMOST_FULL_FROM = 0.95;

export type Storage = {
  usedBytes: number;
  quotaBytes: number | null;
  shelves: (Shelf & { bytes: number })[];
  docs: { id: string; title: string; color: PaletteColor; bytes: number }[];
};

export type StorageLevel = 'calm' | 'low' | 'critical' | 'full';

export function fitsInQuota(bytes: number, quotaBytes: number | null) {
  return quotaBytes === null || bytes <= quotaBytes;
}

export function storageLevelOf(
  usedBytes: number,
  quotaBytes: number,
): StorageLevel {
  if (usedBytes >= quotaBytes) return 'full';
  const share = usedBytes / quotaBytes;
  if (share >= ALMOST_FULL_FROM) return 'critical';
  if (share >= RUNNING_LOW_FROM) return 'low';
  return 'calm';
}

export function freeBytesOf(usedBytes: number, quotaBytes: number) {
  return Math.max(quotaBytes - usedBytes, 0);
}
