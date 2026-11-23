import Link, { type LinkProps } from 'next/link';
import { useTranslations } from 'next-intl';

type StorageFullBannerProps = { storageHref: LinkProps<string>['href'] };

export function StorageFullBanner({ storageHref }: StorageFullBannerProps) {
  const t = useTranslations('docs.storageFull');

  return (
    <div className="grid gap-1 rounded-lg bg-red px-4 py-3 text-sm text-red-foreground">
      <p className="font-semibold">{t('title')}</p>
      <p>
        {t('hint')}{' '}
        <Link
          href={storageHref}
          className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('link')}
        </Link>
      </p>
    </div>
  );
}
