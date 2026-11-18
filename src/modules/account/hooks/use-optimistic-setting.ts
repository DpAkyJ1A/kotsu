import { startTransition, useOptimistic } from 'react';

import type { SettingsPatch } from '../core/settings';
import { useUpdateSettings } from './use-update-settings';

export function useOptimisticSetting<Value>(
  saved: Value,
  toPatch: (value: Value) => SettingsPatch,
) {
  const updateSettings = useUpdateSettings();
  const [shown, setShown] = useOptimistic(saved);

  function pick(value: Value) {
    if (value === shown) return;
    startTransition(async () => {
      setShown(value);
      await updateSettings(toPatch(value));
    });
  }

  return { shown, pick };
}
