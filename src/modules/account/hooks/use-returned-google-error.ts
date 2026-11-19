import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { googleLinkErrorOf, withoutReturnedError } from '../core/google-link';

export function useReturnedGoogleError() {
  const searchParams = useSearchParams();
  const [returnedError] = useState(() =>
    googleLinkErrorOf(searchParams.get('error')),
  );
  const hasReturnedError = searchParams.has('error');

  useEffect(() => {
    if (!hasReturnedError) return;
    history.replaceState(
      null,
      '',
      withoutReturnedError(new URL(location.href)),
    );
  }, [hasReturnedError]);

  return returnedError;
}
