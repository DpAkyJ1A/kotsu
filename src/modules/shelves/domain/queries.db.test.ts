import { describe, expect } from 'vitest';

import { createUser } from '@/server/auth/testing';
import { ctxOf } from '@/server/ctx/testing';
import { dbTest as test } from '@/server/db/testing';

import { createShelf } from './commands';
import { listShelves } from './queries';

const NOW = new Date('2026-11-19T09:00:00Z');

describe('listShelves', () => {
  test("gives the signed-in user's shelves in their order, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createShelf(bea, { name: 'Chess' });
    const guitar = await createShelf(ada, { name: 'Guitar' });

    expect(await listShelves(ada)).toEqual([spanish, guitar]);
  });
});
