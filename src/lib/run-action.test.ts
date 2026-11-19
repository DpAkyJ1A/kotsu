import { afterEach, describe, expect, test, vi } from 'vitest';

import { runAction } from './run-action';

function setOnline(onLine: boolean) {
  vi.stubGlobal('navigator', { onLine });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runAction', () => {
  test('answers null when the action went through', async () => {
    setOnline(true);
    const action = vi.fn(() => Promise.resolve({ ok: true as const }));

    expect(await runAction(action, 'Spanish')).toBeNull();
    expect(action).toHaveBeenCalledExactlyOnceWith('Spanish');
  });

  test('answers with the code the server refused with', async () => {
    setOnline(true);
    const action = () =>
      Promise.resolve({
        ok: false as const,
        error: { code: 'NOT_FOUND' as const },
      });

    expect(await runAction(action, 'Spanish')).toBe('NOT_FOUND');
  });

  test('answers OFFLINE without sending anything while the browser is offline', async () => {
    setOnline(false);
    const action = vi.fn(() => Promise.resolve({ ok: true as const }));

    expect(await runAction(action, 'Spanish')).toBe('OFFLINE');
    expect(action).not.toHaveBeenCalled();
  });

  test('answers OFFLINE when the connection drops while the action is on its way', async () => {
    setOnline(true);
    const action = () => {
      setOnline(false);
      return Promise.reject(new TypeError('Failed to fetch'));
    };

    expect(await runAction(action, 'Spanish')).toBe('OFFLINE');
  });

  test('answers INTERNAL when the action throws while the browser is online', async () => {
    setOnline(true);
    const action = () => Promise.reject(new TypeError('Failed to fetch'));

    expect(await runAction(action, 'Spanish')).toBe('INTERNAL');
  });
});
