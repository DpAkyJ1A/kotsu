import {
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

const OPENS_AFTER_MS = 200;
const CLOSES_AFTER_MS = 200;

export function useOpenOnHover() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  function after(ms: number, then: () => void) {
    clearTimeout(timer.current);
    timer.current = setTimeout(then, ms);
  }

  function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    if (isOpen) {
      clearTimeout(timer.current);
      return;
    }
    after(OPENS_AFTER_MS, () => {
      setIsPinned(false);
      setIsOpen(true);
    });
  }

  function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    if (!isOpen) {
      clearTimeout(timer.current);
      return;
    }
    if (isPinned) return;
    after(CLOSES_AFTER_MS, () => {
      setIsOpen(false);
    });
  }

  function keepTheFocus(event: Event) {
    if (!isPinned) event.preventDefault();
  }

  function countTheTriggerAsInside(event: Event) {
    if (
      event.target instanceof Node &&
      trigger.current?.contains(event.target)
    ) {
      event.preventDefault();
    }
  }

  const hover = {
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
  };

  return {
    root: {
      open: isOpen,
      onOpenChange: (open: boolean) => {
        clearTimeout(timer.current);
        setIsOpen(open);
        if (open) setIsPinned(true);
      },
    },
    trigger: {
      ...hover,
      ref: trigger,
      onClick: (event: MouseEvent) => {
        if (!isOpen || isPinned) return;
        event.preventDefault();
        clearTimeout(timer.current);
        setIsPinned(true);
        content.current?.focus();
      },
    },
    content: {
      ...hover,
      ref: content,
      onOpenAutoFocus: keepTheFocus,
      onCloseAutoFocus: keepTheFocus,
      onInteractOutside: countTheTriggerAsInside,
    },
  };
}
