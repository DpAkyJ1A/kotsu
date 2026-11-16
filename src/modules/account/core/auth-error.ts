export type AuthError =
  | 'invalidEmail'
  | 'wrongCode'
  | 'expiredCode'
  | 'tooManyAttempts'
  | 'tooManyRequests'
  | 'unknown';

type FailedRequest = { status: number; code?: string | undefined };

type AuthResult = { error: FailedRequest | null };

const TOO_MANY_REQUESTS = 429;

const ERROR_BY_CODE: Partial<Record<string, AuthError>> = {
  INVALID_EMAIL: 'invalidEmail',
  INVALID_OTP: 'wrongCode',
  OTP_EXPIRED: 'expiredCode',
  TOO_MANY_ATTEMPTS: 'tooManyAttempts',
};

export async function authErrorOf(
  request: Promise<AuthResult>,
): Promise<AuthError | null> {
  try {
    const { error } = await request;
    return error && toAuthError(error);
  } catch {
    return 'unknown';
  }
}

function toAuthError({ status, code = '' }: FailedRequest): AuthError {
  if (status === TOO_MANY_REQUESTS) return 'tooManyRequests';
  return ERROR_BY_CODE[code] ?? 'unknown';
}
