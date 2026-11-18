import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { authClient } from '@/lib/auth-client';
import { toast } from '@/ui/toast';

import { authErrorOf } from '../core/auth-error';

export function useSaveName() {
  const t = useTranslations();
  const router = useRouter();

  return async function saveName(name: string) {
    const failure = await authErrorOf(authClient.updateUser({ name }));
    if (failure) {
      toast.error(t(`auth.errors.${failure}`));
      return;
    }
    toast.success(t('settings.nameSaved'));
    router.refresh();
  };
}
