import 'server-only';

import { getTranslations } from 'next-intl/server';
import { Resend } from 'resend';

import { env } from '@/server/env';

type SignInCode = { email: string; otp: string; minutesValid: number };

type ResendSender = { apiKey: string; from: string };

export type SendSignInCode = (code: SignInCode) => Promise<void>;

export const sendSignInCode: SendSignInCode = async (code) => {
  if (env.RESEND_API_KEY) {
    await emailCode({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM }, code);
    return;
  }
  const logsCodes = env.NODE_ENV === 'development' || env.SIGN_IN_CODES_IN_LOG;
  if (!logsCodes) {
    throw new Error(
      'Neither RESEND_API_KEY nor SIGN_IN_CODES_IN_LOG is set, so the code has nowhere to go',
    );
  }
  console.info(`Sign-in code for ${code.email}: ${code.otp}`);
};

async function emailCode(
  { apiKey, from }: ResendSender,
  { email, otp, minutesValid }: SignInCode,
) {
  const t = await getTranslations('email.signInCode');
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: email,
    subject: t('subject', { code: otp }),
    text: t('text', { code: otp, minutes: minutesValid }),
  });
  if (error) throw new Error(`Resend refused the email: ${error.message}`);
}
