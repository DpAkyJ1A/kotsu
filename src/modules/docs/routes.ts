import 'server-only';

import { answer } from '@/server/actions';

import { SaveDocInput } from './core/doc';
import { LARGEST_KEEPALIVE_BYTES } from './core/save-limits';
import { saveDoc } from './domain/commands';

const NOT_A_SAVE = { ok: false, error: { code: 'VALIDATION' } } as const;
const TOO_LONG = { ok: false, error: { code: 'LIMIT' } } as const;

export async function saveDocRoute(request: Request) {
  if (request.headers.get('sec-fetch-site') !== 'same-origin') {
    return Response.json(NOT_A_SAVE, { status: 403 });
  }
  if (!fitsAKeepalive(request)) {
    return Response.json(TOO_LONG, { status: 413 });
  }
  const save = SaveDocInput.safeParse(await request.json().catch(() => null));
  if (!save.success) return Response.json(NOT_A_SAVE);
  return Response.json(await answer(saveDoc, save.data));
}

function fitsAKeepalive(request: Request) {
  const length = Number(request.headers.get('content-length') ?? Number.NaN);
  return length <= LARGEST_KEEPALIVE_BYTES;
}
