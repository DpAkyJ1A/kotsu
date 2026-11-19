import 'server-only';

import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP } from 'better-auth/plugins';

import { signInPath } from '@/lib/sign-in-path';
import type { Db } from '@/server/db/client';
import * as schema from '@/server/db/schema/auth';

import { deleteExpiredSignInRows } from './delete-expired-sign-in-rows';
import type { Deployment } from './deployment';
import type { GoogleClient } from './google-client';
import { passkeyName } from './passkey-name';
import type { SendSignInCode } from './send-sign-in-code';

const CODE_LIFETIME_MINUTES = 5;

const UNUSED_EMAIL_OTP_PATHS = [
  '/email-otp/check-verification-otp',
  '/email-otp/verify-email',
  '/email-otp/request-password-reset',
  '/forget-password/email-otp',
  '/email-otp/reset-password',
  '/email-otp/request-email-change',
  '/email-otp/change-email',
];

type AuthDeps = {
  db: Db;
  secret: string;
  sendSignInCode: SendSignInCode;
  deployment: Deployment;
  google: GoogleClient | undefined;
};

export function createAuth({
  db,
  secret,
  sendSignInCode,
  deployment,
  google,
}: AuthDeps) {
  return betterAuth({
    secret,
    baseURL: deployment.baseURL,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    advanced: {
      disableOriginCheck: false,
      database: { generateId: 'uuid' },
      ipAddress: { trustedProxies: deployment.trustedProxies },
    },
    rateLimit: { enabled: true, storage: 'database' },
    disabledPaths: UNUSED_EMAIL_OTP_PATHS,
    onAPIError: { errorURL: signInPath(null) },
    socialProviders: google
      ? { google: { ...google, prompt: 'select_account' } }
      : {},
    account: {
      encryptOAuthTokens: true,
      accountLinking: { allowUnlinkingAll: true },
    },
    databaseHooks: {
      user: {
        create: { before: (newUser) => Promise.resolve(newUser.emailVerified) },
      },
      session: {
        create: {
          after: () =>
            deleteExpiredSignInRows(db, new Date()).catch((error: unknown) => {
              console.error(error);
            }),
        },
      },
    },
    plugins: [
      emailOTP({
        expiresIn: CODE_LIFETIME_MINUTES * 60,
        storeOTP: 'encrypted',
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type !== 'sign-in') return;
          await sendSignInCode({
            email,
            otp,
            minutesValid: CODE_LIFETIME_MINUTES,
          });
        },
      }),
      passkey({
        rpID: deployment.rpID,
        rpName: 'Kotsu',
        registration: {
          afterVerification: ({ ctx, verification }) => {
            const name = passkeyName({
              aaguid: verification.registrationInfo?.aaguid,
              userAgent: ctx.headers?.get('user-agent'),
            });
            return name === undefined ? undefined : { name };
          },
        },
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
