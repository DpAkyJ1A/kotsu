import { z } from 'zod';

import { saveDocAction } from '../actions';
import { byteLengthOf } from '../core/byte-length';
import type { DocSave } from '../core/doc';
import { LARGEST_KEEPALIVE_BYTES } from '../core/save-limits';
import type { SaveFailure } from '../core/save-state';
import type { SaveAnswer, SaveTransport } from './save-queue';

const SAVE_ROUTE = '/api/docs/save';

const RouteAnswer = z.union([
  z.object({ ok: z.literal(true), data: z.object({ version: z.int() }) }),
  z.object({ ok: z.literal(false), error: z.object({ code: z.string() }) }),
]);

type RouteAnswer = z.infer<typeof RouteAnswer>;

export const saveTransport: SaveTransport = {
  send: sendSave,
  canSendWhileLeaving: (save) =>
    isOnline() && fitsAKeepalive(JSON.stringify(save)),
};

async function sendSave(
  save: DocSave,
  { isLeaving }: { isLeaving: boolean },
): Promise<SaveAnswer> {
  if (!isOnline()) return failed('OFFLINE');
  const json = JSON.stringify(save);
  try {
    return answerOf(
      isLeaving && fitsAKeepalive(json)
        ? await postWithKeepalive(json)
        : await saveDocAction(structuredClone(save)),
    );
  } catch {
    return failed(isOnline() ? 'FAILED' : 'OFFLINE');
  }
}

async function postWithKeepalive(json: string) {
  const response = await fetch(SAVE_ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: json,
    keepalive: true,
  });
  return RouteAnswer.parse(await response.json());
}

function answerOf(result: RouteAnswer): SaveAnswer {
  if (result.ok) return { ok: true, version: result.data.version };
  return failed(failureOf(result.error.code));
}

function failureOf(code: string): SaveFailure {
  if (code === 'CONFLICT') return 'CONFLICT';
  if (code === 'LIMIT') return 'TOO_LONG';
  if (code === 'STORAGE_FULL') return 'STORAGE_FULL';
  return 'FAILED';
}

function failed(failure: SaveFailure): SaveAnswer {
  return { ok: false, failure };
}

function fitsAKeepalive(json: string) {
  return byteLengthOf(json) <= LARGEST_KEEPALIVE_BYTES;
}

function isOnline() {
  return navigator.onLine;
}
