import { type MouseEvent, type RefObject, useState } from 'react';
import { flushSync } from 'react-dom';

import type { Ending } from '../ui/name-input';

type Editing = { caret?: number };

type RenamingTargets = {
  link: RefObject<HTMLAnchorElement | null>;
  name: RefObject<HTMLElement | null>;
};

export function useRenaming({ link, name }: RenamingTargets) {
  const [editing, setEditing] = useState<Editing | null>(null);

  function open(next: Editing) {
    flushSync(() => {
      setEditing(next);
    });
  }

  function start() {
    open({});
  }

  function startAtClick(event: MouseEvent) {
    open({ caret: caretIn(name.current, event) });
  }

  function stop({ restoreFocus }: Ending) {
    flushSync(() => {
      setEditing(null);
    });
    if (restoreFocus) link.current?.focus();
  }

  return { editing, start, startAtClick, stop };
}

function caretIn(name: HTMLElement | null, event: MouseEvent) {
  const caret = document.caretPositionFromPoint(event.clientX, event.clientY);
  if (caret && name?.contains(caret.offsetNode)) return caret.offset;
  return name?.textContent.length ?? 0;
}
