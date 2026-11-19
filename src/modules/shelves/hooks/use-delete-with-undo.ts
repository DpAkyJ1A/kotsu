import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { toast } from '@/ui/toast';

import type { Shelf } from '../core/shelf';

const UNDO_DELAY_MS = 5_000;

export function useDeleteWithUndo(deleteNow: (id: string) => void) {
  const t = useTranslations('shelves');
  const [waiting, setWaiting] = useState<ReadonlySet<string>>(new Set());

  function stopWaiting(id: string) {
    setWaiting((ids) => new Set([...ids].filter((other) => other !== id)));
  }

  return {
    waiting,
    delete: (shelf: Shelf) => {
      setWaiting((ids) => new Set([...ids, shelf.id]));
      const toastId = toast(t('deleted', { name: shelf.name }), {
        duration: Infinity,
        action: {
          label: t('undo'),
          onClick: () => {
            clearTimeout(timer);
            stopWaiting(shelf.id);
          },
        },
      });
      const timer = setTimeout(() => {
        toast.dismiss(toastId);
        deleteNow(shelf.id);
        stopWaiting(shelf.id);
      }, UNDO_DELAY_MS);
    },
  };
}
