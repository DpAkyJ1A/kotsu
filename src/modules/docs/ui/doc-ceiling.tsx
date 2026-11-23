import { useTranslations } from 'next-intl';

import { useFormatSize } from '@/modules/shelves';

import { LARGEST_DOC_BYTES } from '../core/save-limits';

export function DocCeiling() {
  const t = useTranslations('docs');
  const formatSize = useFormatSize();

  return (
    <p className="text-xs text-muted-foreground">
      {t('ceiling', { largest: formatSize(LARGEST_DOC_BYTES) })}
    </p>
  );
}
