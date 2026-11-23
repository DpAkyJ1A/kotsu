import Link from 'next/link';
import { useTranslations } from 'next-intl';

import type { PaletteColor } from '@/lib/palette-colors';

import { docPath } from '../core/doc-path';
import { shelfPath } from '../core/shelf-path';
import { ITEM_ROW_BYTES, type Storage } from '../core/storage';
import { ShelfDot } from './shelf-dot';
import { StorageGauge } from './storage-gauge';
import { useFormatSize } from './use-format-size';

type StorageUsageProps = { storage: Storage };

export function StorageUsage({ storage }: StorageUsageProps) {
  const t = useTranslations('shelves.storage');
  const formatSize = useFormatSize();
  const { usedBytes, quotaBytes, shelves, docs } = storage;

  return (
    <div className="flex flex-col gap-8">
      {quotaBytes === null ? (
        <div className="grid gap-1">
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {t('used', { used: formatSize(usedBytes) })}
          </p>
          <p className="text-sm text-muted-foreground">{t('noLimit')}</p>
        </div>
      ) : (
        <StorageGauge usedBytes={usedBytes} quotaBytes={quotaBytes} />
      )}
      {shelves.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          <LargestList
            heading={t('largestShelves')}
            rows={shelves.map(({ id, name, color, bytes }) => ({
              id,
              href: shelfPath(id),
              name,
              color,
              bytes,
            }))}
          />
          {docs.length > 0 && (
            <LargestList
              heading={t('largestDocs')}
              rows={docs.map(({ id, title, color, bytes }) => ({
                id,
                href: docPath(id),
                name: title,
                color,
                bytes,
              }))}
            />
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">
        {t('rowCost', { size: formatSize(ITEM_ROW_BYTES) })}
      </p>
    </div>
  );
}

type Row = {
  id: string;
  href: ReturnType<typeof shelfPath | typeof docPath>;
  name: string;
  color: PaletteColor;
  bytes: number;
};

type LargestListProps = { heading: string; rows: Row[] };

function LargestList({ heading, rows }: LargestListProps) {
  const formatSize = useFormatSize();

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{heading}</h3>
      <ul className="flex flex-col gap-px">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={row.href}
              className="-mx-2.5 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ShelfDot color={row.color} />
              <span className="min-w-0 flex-1 truncate">{row.name}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatSize(row.bytes)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
