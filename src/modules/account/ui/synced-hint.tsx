'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { IconButton } from '@/ui/icon-button';
import { InfoIcon } from '@/ui/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';

export function SyncedHint() {
  const t = useTranslations('settings.passkeys');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <IconButton
          label={t('aboutSynced')}
          size="sm"
          className="relative ml-1 size-4 rounded-full align-top text-muted-foreground after:absolute after:-inset-1 hover:bg-transparent hover:text-foreground"
          onClick={(event) => {
            event.preventDefault();
            setIsOpen(true);
          }}
        >
          <InfoIcon />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>{t('syncedHint')}</TooltipContent>
    </Tooltip>
  );
}
