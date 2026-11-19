import 'server-only';

import { db } from '@/server/db/client';
import { env } from '@/server/env';

import { createAuth } from './create-auth';
import { deployment } from './deployment';
import { googleClient } from './google-client';
import { sendSignInCode } from './send-sign-in-code';

const google = googleClient(env);

export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  sendSignInCode,
  deployment: deployment(env),
  google,
});

export const hasGoogleSignIn = google !== undefined;
