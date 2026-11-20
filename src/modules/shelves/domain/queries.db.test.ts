import { describe, expect } from 'vitest';

import { createUser } from '@/server/auth/testing';
import { ctxOf } from '@/server/ctx/testing';
import { dbTest as test } from '@/server/db/testing';

import { createShelf } from './commands';
import { createItem, moveItem } from './item-commands';
import { getNavigation } from './queries';

const NOW = new Date('2026-11-19T09:00:00Z');

describe('getNavigation', () => {
  test("gives the signed-in user's shelves in their order, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createShelf(bea, { name: 'Chess' });
    const guitar = await createShelf(ada, { name: 'Guitar' });

    expect((await getNavigation(ada)).shelves).toEqual([spanish, guitar]);
  });

  test("gives the signed-in user's items with their shelf, in each shelf's order, never another user's", async ({
    db,
  }) => {
    const ada = await ctxOf(db, await createUser(db, 'ada@example.com'), NOW);
    const bea = await ctxOf(db, await createUser(db, 'bea@example.com'), NOW);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const chess = await createShelf(bea, { name: 'Chess' });
    const verbs = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Verbs',
    });
    const chords = await createItem(ada, {
      shelfId: guitar.id,
      kind: 'doc',
      title: 'Chords',
    });
    const words = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'sheet',
      title: 'Words',
    });
    await createItem(bea, {
      shelfId: chess.id,
      kind: 'doc',
      title: 'Openings',
    });
    await moveItem(ada, { id: words.id, shelfId: spanish.id });

    const { items } = await getNavigation(ada);

    expect(items.filter(({ shelfId }) => shelfId === spanish.id)).toEqual([
      { id: words.id, shelfId: spanish.id, kind: 'sheet', title: 'Words' },
      verbs,
    ]);
    expect(items.filter(({ shelfId }) => shelfId === guitar.id)).toEqual([
      chords,
    ]);
    expect(items).toHaveLength(3);
  });
});
