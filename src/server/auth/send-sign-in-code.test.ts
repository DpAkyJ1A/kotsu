import { afterEach, describe, expect, test, vi } from 'vitest';

import { sendSignInCode } from './send-sign-in-code';

type TestEnv = {
  RESEND_API_KEY: string | undefined;
  NODE_ENV: 'development' | 'production' | 'test';
};

const env = vi.hoisted((): TestEnv => ({
  RESEND_API_KEY: undefined,
  NODE_ENV: 'production',
}));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock('@/server/env', () => ({ env }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendEmail };
  },
}));
vi.mock('next-intl/server', () => ({
  getTranslations: () =>
    Promise.resolve(
      (key: string, values: object) => `${key} ${JSON.stringify(values)}`,
    ),
}));

const CODE = { email: 'ada@example.com', otp: '123456', minutesValid: 5 };

afterEach(() => {
  vi.restoreAllMocks();
  sendEmail.mockReset();
  env.RESEND_API_KEY = undefined;
  env.NODE_ENV = 'production';
});

describe('sendSignInCode', () => {
  test('emails the code and how long it works', async () => {
    env.RESEND_API_KEY = 're_test';
    sendEmail.mockResolvedValue({ error: null });

    await sendSignInCode(CODE);

    expect(sendEmail).toHaveBeenCalledWith({
      from: 'Kotsu <no-reply@kotsu.devazx.com>',
      to: 'ada@example.com',
      subject: 'subject {"code":"123456"}',
      text: 'text {"code":"123456","minutes":5}',
    });
  });

  test('fails when Resend refuses the email', async () => {
    env.RESEND_API_KEY = 're_test';
    sendEmail.mockResolvedValue({ error: { message: 'domain not verified' } });

    await expect(sendSignInCode(CODE)).rejects.toThrow('domain not verified');
  });

  test('without a key prints the code only in development', async () => {
    const print = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    env.NODE_ENV = 'development';

    await sendSignInCode(CODE);

    expect(print).toHaveBeenCalledWith(
      'Sign-in code for ada@example.com: 123456',
    );
  });

  test('without a key a production server fails instead of logging the code', async () => {
    const print = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await expect(sendSignInCode(CODE)).rejects.toThrow('RESEND_API_KEY');
    expect(print).not.toHaveBeenCalled();
  });
});
