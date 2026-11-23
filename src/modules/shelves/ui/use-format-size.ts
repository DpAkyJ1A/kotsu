import { useFormatter } from 'next-intl';

import { storageSizeOf } from '../core/storage-size';

export function useFormatSize() {
  const format = useFormatter();

  return (bytes: number) => {
    const { value, unit, fractionDigits } = storageSizeOf(bytes);
    return format.number(value, {
      style: 'unit',
      unit,
      maximumFractionDigits: fractionDigits,
    });
  };
}
