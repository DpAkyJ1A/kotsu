import { type RefObject, useState } from 'react';
import { flushSync } from 'react-dom';

import type { Ending } from '../ui/shelf-name-input';

export function useNewShelf(button: RefObject<HTMLButtonElement | null>) {
  const [isCreating, setIsCreating] = useState(false);

  function start() {
    flushSync(() => {
      setIsCreating(true);
    });
  }

  function stop({ restoreFocus }: Ending) {
    flushSync(() => {
      setIsCreating(false);
    });
    if (restoreFocus) button.current?.focus();
  }

  return { isCreating, start, stop };
}
