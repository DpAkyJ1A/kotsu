import 'server-only';

import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2';
import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP } from 'better-auth/plugins';

import type { Db } from '@/server/db/client';
import * as schema from '@/server/db/schema/auth';

import { passkeyName } from './passkey-name';
import type { SendSignInCode } from './send-sign-in-code';

const ALLOWED_HOSTS = [
  'localhost:*',
  'kotsu.devazx.com',
  'usekotsu.vercel.app',
  'kotsu-*-dpakyj1as-projects.vercel.app',
];

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
  rpID: string;
};

export function createAuth({ db, secret, sendSignInCode, rpID }: AuthDeps) {
  return betterAuth({
    secret,
    baseURL: { allowedHosts: ALLOWED_HOSTS },
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    advanced: { database: { generateId: 'uuid' } },
    rateLimit: { enabled: true, storage: 'database' },
    disabledPaths: UNUSED_EMAIL_OTP_PATHS,
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
        rpID,
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
