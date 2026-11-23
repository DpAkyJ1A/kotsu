import { useSyncExternalStore } from 'react';

export const WIDE_SCREEN = '(min-width: 48rem)';
export const TOUCH_SCREEN = '(pointer: coarse)';
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    () => matchMedia(query).matches,
    () => false,
  );
}
