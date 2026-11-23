import { cn } from 'cn';
import { useTranslations } from 'next-intl';

import {
  freeBytesOf,
  type StorageLevel,
  storageLevelOf,
} from '../core/storage';
import { useFormatSize } from './use-format-size';

const ARC = 'M 12 112 A 100 100 0 0 1 212 112';

const ARC_TONE: Record<StorageLevel, string> = {
  calm: 'stroke-primary',
  low: 'stroke-amber-foreground',
  critical: 'stroke-destructive',
  full: 'stroke-destructive',
};

const TEXT_TONE: Record<StorageLevel, string> = {
  calm: 'text-muted-foreground',
  low: 'font-semibold text-amber-foreground',
  critical: 'font-semibold text-destructive',
  full: 'font-semibold text-destructive',
};

type StorageGaugeProps = { usedBytes: number; quotaBytes: number };

export function StorageGauge({ usedBytes, quotaBytes }: StorageGaugeProps) {
  const t = useTranslations('shelves.storage');
  const formatSize = useFormatSize();
  const level = storageLevelOf(usedBytes, quotaBytes);
  const shownBytes = Math.min(usedBytes, quotaBytes);
  const percent = quotaBytes === 0 ? 100 : (shownBytes / quotaBytes) * 100;
  const used = formatSize(usedBytes);
  const quota = formatSize(quotaBytes);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="meter"
        aria-label={t('meter')}
        aria-valuemin={0}
        aria-valuemax={quotaBytes}
        aria-valuenow={shownBytes}
        aria-valuetext={t('usedOf', { used, quota })}
        className="relative w-full max-w-56"
      >
        <svg viewBox="0 0 224 124" aria-hidden className="w-full">
          <path
            d={ARC}
            pathLength={100}
            fill="none"
            strokeWidth={16}
            strokeLinecap="round"
            className="stroke-muted"
          />
          {percent > 0 && (
            <path
              d={ARC}
              pathLength={100}
              fill="none"
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={[percent, 100].join(' ')}
              className={ARC_TONE[level]}
            />
          )}
        </svg>
        <p className="absolute inset-x-0 bottom-0 grid justify-items-center">
          <span className="text-2xl font-bold tracking-tight tabular-nums">
            {used}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('ofQuota', { quota })}
          </span>
        </p>
      </div>
      <p className={cn('text-sm', TEXT_TONE[level])}>
        {t(`level.${level}`, {
          free: formatSize(freeBytesOf(usedBytes, quotaBytes)),
        })}
      </p>
    </div>
  );
}
