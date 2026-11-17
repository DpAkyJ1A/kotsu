import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  authClient,
  browserSupportsWebAuthnAutofill,
  WebAuthnAbortService,
} from '@/lib/auth-client';

import { type AuthError, authErrorOf } from '../core/auth-error';

const ERRORS_WORTH_SHOWING: readonly AuthError[] = [
  'passkeyFailed',
  'tooManyRequests',
];

export function usePasskeyAutofill(next: Route) {
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    let ignore = false;

    async function signInWithAutofill() {
      const canAutofill = await browserSupportsWebAuthnAutofill();
      if (!canAutofill || ignore) return;
      finish(await authErrorOf(authClient.signIn.passkey({ autoFill: true })));
    }

    function finish(failure: AuthError | null) {
      if (ignore) return;
      if (!failure) router.replace(next);
      else if (ERRORS_WORTH_SHOWING.includes(failure)) setError(failure);
    }

    void signInWithAutofill();
    return () => {
      ignore = true;
      WebAuthnAbortService.cancelCeremony();
    };
  }, [next, router]);

  return error;
}
