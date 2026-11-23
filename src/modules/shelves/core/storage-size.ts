const UNITS = [
  { unit: 'gigabyte', bytes: 1_000_000_000 },
  { unit: 'megabyte', bytes: 1_000_000 },
] as const;

const FRACTION_DIGITS_BELOW = 10;

export type StorageSize = {
  value: number;
  unit: 'kilobyte' | 'megabyte' | 'gigabyte';
  fractionDigits: 0 | 1;
};

export function storageSizeOf(bytes: number): StorageSize {
  const { unit, bytes: unitBytes } = UNITS.find(
    (candidate) => bytes >= candidate.bytes,
  ) ?? { unit: 'kilobyte', bytes: 1_000 };
  const value = bytes / unitBytes;
  return {
    value,
    unit,
    fractionDigits: value < FRACTION_DIGITS_BELOW ? 1 : 0,
  };
}
