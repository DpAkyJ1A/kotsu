import 'server-only';

import { db } from '@/server/db/client';
import { env } from '@/server/env';

import { createAuth } from './create-auth';
import { sendSignInCode } from './send-sign-in-code';

export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  sendSignInCode,
});
