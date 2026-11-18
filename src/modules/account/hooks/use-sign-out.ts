import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { authClient } from '@/lib/auth-client';
import { toast } from '@/ui/toast';

import { authErrorOf } from '../core/auth-error';

export function useSignOut() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      const failure = await authErrorOf(authClient.signOut());
      if (failure) toast.error(t(`errors.${failure}`));
      else router.replace('/sign-in');
    });
  }

  return { signOut, isPending };
}
