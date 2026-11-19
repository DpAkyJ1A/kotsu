import { afterEach, describe, expect, test, vi } from 'vitest';

import { sendSignInCode } from './send-sign-in-code';

type TestEnv = {
  RESEND_API_KEY: string | undefined;
  EMAIL_FROM: string;
  SIGN_IN_CODES_IN_LOG: boolean;
  NODE_ENV: 'development' | 'production' | 'test';
};

const { env, DEFAULT_ENV } = vi.hoisted(() => {
  const defaults: TestEnv = {
    RESEND_API_KEY: undefined,
    EMAIL_FROM: 'Kotsu <no-reply@kotsu.devazx.com>',
    SIGN_IN_CODES_IN_LOG: false,
    NODE_ENV: 'production',
  };
  return { env: { ...defaults }, DEFAULT_ENV: defaults };
});
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
  Object.assign(env, DEFAULT_ENV);
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

  test('sends from the address in EMAIL_FROM', async () => {
    env.RESEND_API_KEY = 're_test';
    env.EMAIL_FROM = 'Kotsu <codes@kotsu.example.com>';
    sendEmail.mockResolvedValue({ error: null });

    await sendSignInCode(CODE);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Kotsu <codes@kotsu.example.com>' }),
    );
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

  test('a self-hosted server without a key logs the code when SIGN_IN_CODES_IN_LOG is on', async () => {
    const print = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    env.SIGN_IN_CODES_IN_LOG = true;

    await sendSignInCode(CODE);

    expect(print).toHaveBeenCalledWith(
      'Sign-in code for ada@example.com: 123456',
    );
  });

  test('with a key the code is emailed, not logged, even when SIGN_IN_CODES_IN_LOG is on', async () => {
    const print = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    env.RESEND_API_KEY = 're_test';
    env.SIGN_IN_CODES_IN_LOG = true;
    sendEmail.mockResolvedValue({ error: null });

    await sendSignInCode(CODE);

    expect(sendEmail).toHaveBeenCalledOnce();
    expect(print).not.toHaveBeenCalled();
  });
});
