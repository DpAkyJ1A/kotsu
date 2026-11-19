import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

import { authErrorOf } from '../core/auth-error';

type DisconnectOutcome = 'disconnected' | 'needsConfirmation' | 'failed';

export function useDisconnectGoogle() {
  const router = useRouter();

  return async function disconnectGoogle(
    accountIds: string[],
  ): Promise<DisconnectOutcome> {
    for (const accountId of accountIds) {
      const failure = await authErrorOf(
        authClient.unlinkAccount({ accountId }),
      );
      if (failure === 'sessionNotFresh') return 'needsConfirmation';
      if (failure) {
        router.refresh();
        return 'failed';
      }
    }
    router.refresh();
    return 'disconnected';
  };
}
