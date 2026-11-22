import { useEffect, useState } from 'react';

import { oneLine, titleToSave } from '../core/title-draft';

export const SAVE_AFTER_MS = 800;

export function useTitleDraft(saved: string, save: (title: string) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  const [pendingSave] = useState(createPendingSave);

  useEffect(() => pendingSave.runNow, [pendingSave]);

  return {
    value: draft ?? saved,
    change(value: string) {
      const next = oneLine(value);
      setDraft(next);
      pendingSave.runLater(() => {
        const title = titleToSave(next, saved);
        if (title !== null) save(title);
      });
    },
    finish() {
      pendingSave.runNow();
      setDraft(null);
    },
  };
}

function createPendingSave() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: (() => void) | undefined;

  function runNow() {
    clearTimeout(timer);
    const run = pending;
    pending = undefined;
    run?.();
  }

  return {
    runLater(run: () => void) {
      clearTimeout(timer);
      pending = run;
      timer = setTimeout(runNow, SAVE_AFTER_MS);
    },
    runNow,
  };
}
