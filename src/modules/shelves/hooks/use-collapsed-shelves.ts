import { useState } from 'react';

import { collapsedShelvesCookie } from '../core/collapsed-shelves';
import { useShelves } from './use-shelves';

export function useCollapsedShelves(initial: readonly string[]) {
  const { shelves } = useShelves();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(initial),
  );

  function save(next: ReadonlySet<string>) {
    setCollapsed(next);
    document.cookie = collapsedShelvesCookie(shelves, next);
  }

  function open(id: string) {
    save(new Set([...collapsed].filter((other) => other !== id)));
  }

  return {
    isOpen: (id: string) => !collapsed.has(id),
    open,
    toggle: (id: string) => {
      if (collapsed.has(id)) open(id);
      else save(new Set([...collapsed, id]));
    },
  };
}
