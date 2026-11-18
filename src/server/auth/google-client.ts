import 'server-only';

import type { Env } from '@/server/env';

export type GoogleClient = { clientId: string; clientSecret: string };

type GoogleEnv = Pick<Env, 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>;

export function googleClient({
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
}: GoogleEnv): GoogleClient | undefined {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return undefined;
  return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET };
}
