import { useTranslations } from 'next-intl';

import { toast } from '@/ui/toast';

import type { SettingsPatch } from '../core/settings';
import { saveSettings } from './save-settings';

export function useUpdateSettings() {
  const t = useTranslations('errors');

  return async function updateSettings(patch: SettingsPatch) {
    const failure = await saveSettings(patch);
    if (failure) toast.error(t(failure));
  };
}
