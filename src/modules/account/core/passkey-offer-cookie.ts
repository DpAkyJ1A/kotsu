const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const PASSKEY_OFFER_COOKIE = {
  name: 'passkey-offer',
  value: 'answered',
  maxAge: ONE_YEAR_IN_SECONDS,
  httpOnly: true,
  sameSite: 'lax',
} as const;
