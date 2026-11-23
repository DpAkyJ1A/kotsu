import type { JSONContent } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { saveDocAction } from '../actions';
import type { DocSave } from '../core/doc';
import { LARGEST_KEEPALIVE_BYTES } from '../core/save-limits';
import { saveTransport } from './send-save';

vi.mock('../actions', () => ({ saveDocAction: vi.fn() }));

const DOC_ID = '019a9c3e-0101-7000-8000-000000000101';
const SAVED = { ok: true, data: { version: 2 } } as const;

function saveOf(line: string): DocSave {
  const content: JSONContent = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: line }] }],
  };
  return { id: DOC_ID, version: 1, content };
}

function saveOfBytes(bytes: number) {
  const empty = JSON.stringify(saveOf('')).length;
  return saveOf('a'.repeat(bytes - empty));
}

function setOnline(onLine: boolean) {
  vi.stubGlobal('navigator', { onLine });
}

function answerTheRouteWith(answer: unknown) {
  const fetch = vi.fn(() => Promise.resolve(Response.json(answer)));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const { send, canSendWhileLeaving } = saveTransport;

beforeEach(() => {
  setOnline(true);
  vi.mocked(saveDocAction).mockResolvedValue(SAVED);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('a save from the open page', () => {
  test('goes through the Server Action and answers with the version it returns', async () => {
    const save = saveOf('hablo');

    expect(await send(save, { isLeaving: false })).toEqual({
      ok: true,
      version: 2,
    });
    expect(saveDocAction).toHaveBeenCalledExactlyOnceWith(save);
    expect(vi.mocked(saveDocAction).mock.lastCall?.[0]).not.toBe(save);
  });

  test('hands the Server Action plain objects, since React cannot send the attributes of a ProseMirror node, which have no prototype', async () => {
    const attrs = Object.assign(Object.create(null) as object, {
      blockId: null,
    });
    const save = saveOf('hablo');
    save.content.content = [{ type: 'paragraph', attrs }];

    await send(save, { isLeaving: false });

    const [sent] = vi.mocked(saveDocAction).mock.lastCall ?? [];
    expect(Object.getPrototypeOf(sent?.content.content?.[0]?.attrs)).toBe(
      Object.prototype,
    );
    expect(sent).toEqual(save);
  });

  test.each([
    ['CONFLICT', 'CONFLICT'],
    ['LIMIT', 'TOO_LONG'],
    ['STORAGE_FULL', 'STORAGE_FULL'],
    ['NOT_FOUND', 'FAILED'],
    ['VALIDATION', 'FAILED'],
    ['INTERNAL', 'FAILED'],
  ] as const)('turns %s from the server into %s', async (code, failure) => {
    vi.mocked(saveDocAction).mockResolvedValue({ ok: false, error: { code } });

    expect(await send(saveOf('hablo'), { isLeaving: false })).toEqual({
      ok: false,
      failure,
    });
  });

  test('answers OFFLINE without sending while the browser is offline', async () => {
    setOnline(false);

    expect(await send(saveOf('hablo'), { isLeaving: false })).toEqual({
      ok: false,
      failure: 'OFFLINE',
    });
    expect(saveDocAction).not.toHaveBeenCalled();
  });

  test('answers FAILED when the call throws online, OFFLINE when the connection dropped on the way', async () => {
    vi.mocked(saveDocAction).mockRejectedValueOnce(new Error('Body exceeded'));
    expect(await send(saveOf('hablo'), { isLeaving: false })).toEqual({
      ok: false,
      failure: 'FAILED',
    });

    vi.mocked(saveDocAction).mockImplementationOnce(() => {
      setOnline(false);
      return Promise.reject(new TypeError('Failed to fetch'));
    });
    expect(await send(saveOf('hablo'), { isLeaving: false })).toEqual({
      ok: false,
      failure: 'OFFLINE',
    });
  });
});

describe('a save as the page goes away', () => {
  test('goes to the save route with fetch and keepalive, so it outlives the page, and reads the answer', async () => {
    const fetch = answerTheRouteWith(SAVED);
    const save = saveOf('hablo');

    expect(await send(save, { isLeaving: true })).toEqual({
      ok: true,
      version: 2,
    });
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/docs/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(save),
      keepalive: true,
    });
    expect(saveDocAction).not.toHaveBeenCalled();
  });

  test('reads a conflict from the route too', async () => {
    answerTheRouteWith({ ok: false, error: { code: 'CONFLICT' } });

    expect(await send(saveOf('hablo'), { isLeaving: true })).toEqual({
      ok: false,
      failure: 'CONFLICT',
    });
  });

  test('answers FAILED for an answer that is not a save result', async () => {
    answerTheRouteWith({ hello: 'world' });

    expect(await send(saveOf('hablo'), { isLeaving: true })).toEqual({
      ok: false,
      failure: 'FAILED',
    });
  });

  test('goes through the Server Action when the body is too long for keepalive', async () => {
    const fetch = answerTheRouteWith(SAVED);

    await send(saveOfBytes(LARGEST_KEEPALIVE_BYTES + 1), { isLeaving: true });

    expect(fetch).not.toHaveBeenCalled();
    expect(saveDocAction).toHaveBeenCalledOnce();
  });

  test('can go out only online and only with a body keepalive can carry', () => {
    expect(canSendWhileLeaving(saveOfBytes(LARGEST_KEEPALIVE_BYTES))).toBe(
      true,
    );
    expect(canSendWhileLeaving(saveOfBytes(LARGEST_KEEPALIVE_BYTES + 1))).toBe(
      false,
    );

    setOnline(false);
    expect(canSendWhileLeaving(saveOf('hablo'))).toBe(false);
  });
});
