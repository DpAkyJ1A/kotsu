import { authClient } from '@/lib/auth-client';

import { authErrorOf } from '../core/auth-error';
import {
  type GoogleLinkError,
  withoutReturnedError,
} from '../core/google-link';

export async function connectGoogle(): Promise<GoogleLinkError | null> {
  const here = withoutReturnedError(new URL(location.href));
  const failure = await authErrorOf(
    authClient.linkSocial({
      provider: 'google',
      callbackURL: here,
      errorCallbackURL: here,
    }),
  );
  return failure === null ? null : 'connectFailed';
}
