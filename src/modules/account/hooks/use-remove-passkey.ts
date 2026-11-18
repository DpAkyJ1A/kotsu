import type { Passkey } from '@better-auth/passkey';
import { useTranslations } from 'next-intl';

import { authClient } from '@/lib/auth-client';
import { toast } from '@/ui/toast';

import { authErrorOf } from '../core/auth-error';
import { signalRemovedPasskey } from './signal-removed-passkey';

type RemovedPasskey = Pick<Passkey, 'id' | 'credentialID'>;

export function useRemovePasskey() {
  const t = useTranslations('settings.passkeys');

  return async function removePasskey({ id, credentialID }: RemovedPasskey) {
    const failure = await authErrorOf(authClient.passkey.deletePasskey({ id }));
    if (failure) {
      toast.error(t('notRemoved'));
      return false;
    }
    void signalRemovedPasskey(credentialID);
    return true;
  };
}
