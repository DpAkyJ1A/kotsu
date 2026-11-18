import { updateSettingsAction } from '../actions';
import type { SettingsPatch } from '../core/settings';

export async function saveSettings(patch: SettingsPatch) {
  if (isOffline()) return 'OFFLINE';
  try {
    const result = await updateSettingsAction(patch);
    return result.ok ? null : result.error.code;
  } catch {
    return isOffline() ? 'OFFLINE' : 'INTERNAL';
  }
}

function isOffline() {
  return !navigator.onLine;
}
