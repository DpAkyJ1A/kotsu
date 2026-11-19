import { SIGN_IN_CANCELLED } from './sign-in-paths';

export type GoogleLink =
  | { status: 'off' }
  | { status: 'notConnected' }
  | { status: 'connected'; accountIds: string[] };

export type GoogleLinkError =
  'emailDoesNotMatch' | 'connectFailed' | 'disconnectFailed';

const EMAIL_DOES_NOT_MATCH = 'email_does_not_match';

export function googleLinkErrorOf(
  returnedError: string | null,
): GoogleLinkError | null {
  if (returnedError === null || returnedError === SIGN_IN_CANCELLED) {
    return null;
  }
  return returnedError === EMAIL_DOES_NOT_MATCH
    ? 'emailDoesNotMatch'
    : 'connectFailed';
}

const RETURNED_ERROR_PARAMS = ['error', 'error_description'];

export function withoutReturnedError(address: URL) {
  const search = new URLSearchParams(address.search);
  for (const param of RETURNED_ERROR_PARAMS) search.delete(param);
  const query = search.size > 0 ? `?${search}` : '';
  return `${address.pathname}${query}${address.hash}`;
}
