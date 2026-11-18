import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { defineAction } from './actions';
import { AppError } from './domain';

vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('./ctx/get-ctx', () => ({
  getCtx: () => Promise.resolve({ userId: 'ada' }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('defineAction', () => {
  test('runs for the signed-in user, refreshes the page and answers with the data', async () => {
    const action = defineAction((ctx, name: string) =>
      Promise.resolve(`${name} for ${ctx.userId}`),
    );

    expect(await action('Dark')).toEqual({ ok: true, data: 'Dark for ada' });
    expect(refresh).toHaveBeenCalledOnce();
  });

  test('answers with the code of an AppError and leaves the page as it is', async () => {
    const action = defineAction(() =>
      Promise.reject(new AppError('VALIDATION')),
    );

    expect(await action(undefined)).toEqual({
      ok: false,
      error: { code: 'VALIDATION' },
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  test('logs any other failure and answers INTERNAL, without the details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('connection to the database lost');
    const action = defineAction(() => Promise.reject(failure));

    expect(await action(undefined)).toEqual({
      ok: false,
      error: { code: 'INTERNAL' },
    });
    expect(log).toHaveBeenCalledWith(failure);
  });

  test("lets Next.js's own redirects through instead of reporting them as failures", async () => {
    const action = defineAction(() => {
      redirect('/sign-in');
    });

    await expect(action(undefined)).rejects.toThrow('NEXT_REDIRECT');
  });
});
