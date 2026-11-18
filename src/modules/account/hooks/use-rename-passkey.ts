import { useTranslations } from 'next-intl';

import { authClient } from '@/lib/auth-client';
import { toast } from '@/ui/toast';

import { authErrorOf } from '../core/auth-error';

export function useRenamePasskey() {
  const t = useTranslations('settings.passkeys');

  return async function renamePasskey(id: string, name: string) {
    const failure = await authErrorOf(
      authClient.passkey.updatePasskey({ id, name }),
    );
    if (failure) toast.error(t('notRenamed'));
    return failure === null;
  };
}
