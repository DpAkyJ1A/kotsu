import 'server-only';

import { Resend } from 'resend';

import { env } from '@/server/env';

const FROM = 'Kotsu <no-reply@kotsu.devazx.com>';

type SignInCode = { email: string; otp: string };

export type SendSignInCode = (code: SignInCode) => Promise<void>;

export const sendSignInCode: SendSignInCode = async ({ email, otp }) => {
  if (!env.RESEND_API_KEY) {
    console.info(`Sign-in code for ${email}: ${otp}`);
    return;
  }

  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: FROM,
    to: email,
    subject: 'Your Kotsu sign-in code',
    text: `Your code is ${otp}. It works for 5 minutes.`,
  });
  if (error) throw new Error(`Resend refused the email: ${error.message}`);
};
