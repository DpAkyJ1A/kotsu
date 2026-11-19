import 'server-only';

import { APIError, createAuthMiddleware } from 'better-auth/api';
import * as z from 'zod';

import type { Db } from '@/server/db/client';

import { CODES_PER_EMAIL, countSignInCode } from './count-sign-in-code';

const SEND_CODE_PATH = '/email-otp/send-verification-otp';

const CodeRequest = z.object({
  email: z.email().toLowerCase(),
  type: z.string(),
});

const SIGN_IN_CODES_ONLY = {
  code: 'SIGN_IN_CODES_ONLY',
  message: 'Only sign-in codes are sent',
};

const TOO_MANY_CODES = {
  code: 'TOO_MANY_CODES',
  message: 'Too many codes for this email address',
};

export function limitSignInCodes(db: Db) {
  return createAuthMiddleware(async (ctx) => {
    if (ctx.path !== SEND_CODE_PATH) return;
    const request = CodeRequest.safeParse(ctx.body);
    if (!request.success) return;
    const { email, type } = request.data;
    if (type !== 'sign-in') {
      throw APIError.from('BAD_REQUEST', SIGN_IN_CODES_ONLY);
    }
    if ((await countSignInCode(db, email, new Date())) > CODES_PER_EMAIL) {
      throw APIError.from('TOO_MANY_REQUESTS', TOO_MANY_CODES);
    }
  });
}
