import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { type MouseEvent, type RefObject, useEffect, useRef } from 'react';

import { TOUCH_SCREEN } from '@/ui/use-media-query';

export const DOUBLE_CLICK_WAIT_MS = 300;

type OpenUnlessDoubleClickedOptions<T extends string> = {
  href: Route<T>;
  waitOn: RefObject<HTMLElement | null>;
  onDoubleClick: (event: MouseEvent) => void;
};

export function useOpenUnlessDoubleClicked<T extends string>({
  href,
  waitOn,
  onDoubleClick,
}: OpenUnlessDoubleClickedOptions<T>) {
  const router = useRouter();
  const opening = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(opening.current);
    };
  }, []);

  return function handleClick(event: MouseEvent) {
    if (!shouldWait(event, waitOn.current)) return;
    event.preventDefault();
    if (event.detail < 2) {
      clearTimeout(opening.current);
      opening.current = setTimeout(() => {
        opening.current = undefined;
        router.push(href);
      }, DOUBLE_CLICK_WAIT_MS);
      return;
    }
    if (opening.current === undefined) return;
    clearTimeout(opening.current);
    opening.current = undefined;
    onDoubleClick(event);
  };
}

function shouldWait(event: MouseEvent, waitOn: HTMLElement | null) {
  return (
    isInside(waitOn, event) &&
    !hasModifierKey(event) &&
    !matchMedia(TOUCH_SCREEN).matches
  );
}

function isInside(element: HTMLElement | null, event: MouseEvent) {
  return (
    event.target instanceof Node && element?.contains(event.target) === true
  );
}

function hasModifierKey(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
