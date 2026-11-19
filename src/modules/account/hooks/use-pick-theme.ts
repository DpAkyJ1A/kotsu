import { useTranslations } from 'next-intl';

import { runAction } from '@/lib/run-action';
import type { Theme } from '@/lib/user-settings';
import { appliedTheme, applyTheme } from '@/ui/apply-theme';
import { toast } from '@/ui/toast';

import { updateSettingsAction } from '../actions';

export function usePickTheme() {
  const t = useTranslations('errors');

  async function saveTheme(theme: Theme) {
    const failure = await runAction(updateSettingsAction, { theme });
    if (failure === 'OFFLINE') saveOnceOnline(theme);
    else if (failure) toast.error(t(failure));
  }

  function saveOnceOnline(theme: Theme) {
    window.addEventListener(
      'online',
      () => {
        if (appliedTheme() === theme) void saveTheme(theme);
      },
      { once: true },
    );
  }

  return async function pickTheme(theme: Theme) {
    applyTheme(theme);
    await saveTheme(theme);
  };
}
