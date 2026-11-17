import 'server-only';

import { getTranslations } from 'next-intl/server';
import { Resend } from 'resend';

import { env } from '@/server/env';

const FROM = 'Kotsu <no-reply@kotsu.devazx.com>';

type SignInCode = { email: string; otp: string; minutesValid: number };

export type SendSignInCode = (code: SignInCode) => Promise<void>;

export const sendSignInCode: SendSignInCode = async (code) => {
  if (env.RESEND_API_KEY) {
    await emailCode(env.RESEND_API_KEY, code);
    return;
  }
  if (env.NODE_ENV !== 'development') {
    throw new Error('RESEND_API_KEY is not set, so the code cannot be emailed');
  }
  console.info(`Sign-in code for ${code.email}: ${code.otp}`);
};

async function emailCode(
  apiKey: string,
  { email, otp, minutesValid }: SignInCode,
) {
  const t = await getTranslations('email.signInCode');
  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: t('subject', { code: otp }),
    text: t('text', { code: otp, minutes: minutesValid }),
  });
  if (error) throw new Error(`Resend refused the email: ${error.message}`);
}
