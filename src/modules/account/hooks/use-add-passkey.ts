import { useTranslations } from 'next-intl';

import { authClient } from '@/lib/auth-client';
import { toast } from '@/ui/toast';

import { authErrorOf } from '../core/auth-error';

type AddPasskeyOutcome = 'added' | 'notAdded' | 'needsConfirmation';

export function useAddPasskey() {
  const t = useTranslations();

  return async function addPasskey(): Promise<AddPasskeyOutcome> {
    const failure = await authErrorOf(authClient.passkey.addPasskey());
    if (failure === 'sessionNotFresh') return 'needsConfirmation';
    if (failure === null) {
      toast.success(t('settings.passkeys.passkeyAdded'));
      return 'added';
    }
    toast.error(
      t(
        failure === 'passkeyExists'
          ? 'auth.errors.passkeyExists'
          : 'settings.passkeys.notAdded',
      ),
    );
    return 'notAdded';
  };
}
