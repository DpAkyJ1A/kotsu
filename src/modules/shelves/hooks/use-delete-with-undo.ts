import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { toast } from '@/ui/toast';

const UNDO_DELAY_MS = 5_000;

export function useDeleteWithUndo(deleteNow: (id: string) => void) {
  const t = useTranslations('shelves');
  const [waiting, setWaiting] = useState<ReadonlySet<string>>(new Set());

  function stopWaiting(id: string) {
    setWaiting((ids) => new Set([...ids].filter((other) => other !== id)));
  }

  return {
    waiting,
    delete: (id: string, deletedMessage: string) => {
      setWaiting((ids) => new Set([...ids, id]));
      const toastId = toast(deletedMessage, {
        duration: Infinity,
        action: {
          label: t('undo'),
          onClick: () => {
            clearTimeout(timer);
            stopWaiting(id);
          },
        },
      });
      const timer = setTimeout(() => {
        toast.dismiss(toastId);
        deleteNow(id);
        stopWaiting(id);
      }, UNDO_DELAY_MS);
    },
  };
}
