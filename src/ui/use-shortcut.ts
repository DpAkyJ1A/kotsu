import { useEffect, useEffectEvent } from 'react';

import { isShortcut } from './shortcut';

export function useShortcut(
  code: string,
  onPress: (event: KeyboardEvent) => void,
) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isShortcut(event, code)) onPress(event);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, []);
}
