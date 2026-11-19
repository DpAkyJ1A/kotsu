import { startTransition, useOptimistic } from 'react';

import { useActionMutation } from '@/ui/use-action-mutation';

import { updateSettingsAction } from '../actions';
import type { SettingsPatch } from '../core/settings';

export function useOptimisticSetting<Value>(
  saved: Value,
  toPatch: (value: Value) => SettingsPatch,
) {
  const updateSettings = useActionMutation(updateSettingsAction);
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
