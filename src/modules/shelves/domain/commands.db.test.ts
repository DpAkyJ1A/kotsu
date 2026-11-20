import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { describe, expect } from 'vitest';

import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { shelf } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { createShelf, deleteShelf, moveShelf, updateShelf } from './commands';
import { getNavigation } from './queries';

const NOW = new Date('2026-11-19T09:00:00Z');
const MISSING_ID = '019a9c3e-0000-7000-8000-000000000000';

async function signIn(db: Db, email: string) {
  return ctxOf(db, await createUser(db, email), NOW);
}

async function createShelves(ctx: Ctx, names: string[]) {
  for (const name of names) await createShelf(ctx, { name });
}

async function listShelves(ctx: Ctx) {
  return (await getNavigation(ctx)).shelves;
}

async function shelfNames(ctx: Ctx) {
  return (await listShelves(ctx)).map(({ name }) => name);
}

async function positionOf(db: Db, id: string) {
  const [found] = await db
    .select({ position: shelf.position })
    .from(shelf)
    .where(eq(shelf.id, id));
  return found?.position;
}

describe('createShelf', () => {
  test('adds the shelf at the end of the list and returns it', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    await createShelves(ada, ['Spanish', 'Guitar']);

    const created = await createShelf(ada, {
      name: '  Running  ',
      color: 'green',
    });

    expect(created).toMatchObject({ name: 'Running', color: 'green' });
    expect(await shelfNames(ada)).toEqual(['Spanish', 'Guitar', 'Running']);
    expect((await listShelves(ada)).at(-1)).toEqual(created);
  });

  test('adds the shelf after the last one in the order, not the last one saved', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    await createShelf(ada, { name: 'Running' });
    await moveShelf(ada, { id: guitar.id });

    await createShelf(ada, { name: 'Chess' });

    expect(await shelfNames(ada)).toEqual([
      'Guitar',
      'Spanish',
      'Running',
      'Chess',
    ]);
  });

  test("gives a shelf without a colour the one the user's own shelves use least", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    await createShelf(ada, { name: 'Spanish', color: 'violet' });
    await createShelf(ada, { name: 'Guitar', color: 'amber' });
    await createShelf(bea, { name: 'Chess', color: 'blue' });

    const created = await createShelf(ada, { name: 'Running' });

    expect(created.color).toBe('blue');
  });

  test('keeps the id the browser made for the shelf it already shows', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const id = uuidv7();

    const created = await createShelf(ada, { id, name: 'Spanish' });

    expect(created.id).toBe(id);
    expect(await listShelves(ada)).toEqual([created]);
  });

  test('refuses an id made by the browser that is not a uuid v7', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');

    await expect(
      createShelf(ada, { id: randomUUID(), name: 'Spanish' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(await listShelves(ada)).toEqual([]);
  });

  test('allows two shelves with the same name', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');

    await createShelves(ada, ['Spanish', 'Spanish']);

    expect(await shelfNames(ada)).toEqual(['Spanish', 'Spanish']);
  });

  test('refuses a blank name or one longer than 80 characters and saves nothing', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');

    for (const name of ['   ', 'a'.repeat(81)]) {
      await expect(createShelf(ada, { name })).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    }
    expect(await createShelf(ada, { name: 'a'.repeat(80) })).toMatchObject({
      name: 'a'.repeat(80),
    });
    expect(await listShelves(ada)).toHaveLength(1);
  });
});

describe('updateShelf', () => {
  test('renames or recolours a shelf, changing only what the patch names', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish', color: 'amber' });

    const renamed = await updateShelf(ada, { id: spanish.id, name: 'Español' });
    const recoloured = await updateShelf(ada, {
      id: spanish.id,
      color: 'teal',
    });

    expect(renamed).toEqual({
      id: spanish.id,
      name: 'Español',
      color: 'amber',
    });
    expect(recoloured).toEqual({
      id: spanish.id,
      name: 'Español',
      color: 'teal',
    });
  });

  test("answers NOT_FOUND for a missing shelf or another user's, and changes nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess', color: 'blue' });

    for (const id of [chess.id, MISSING_ID]) {
      await expect(
        updateShelf(ada, { id, name: 'Mine now' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    }
    expect(await listShelves(bea)).toEqual([chess]);
  });

  test('refuses a patch with nothing to change', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });

    await expect(updateShelf(ada, { id: spanish.id })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });
});

describe('moveShelf', () => {
  test('puts a shelf right after another one', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    await createShelf(ada, { name: 'Running' });

    await moveShelf(ada, { id: spanish.id, after: guitar.id });

    expect(await shelfNames(ada)).toEqual(['Guitar', 'Spanish', 'Running']);
  });

  test('puts a shelf first when it goes after nothing', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    await createShelves(ada, ['Spanish', 'Guitar']);
    const running = await createShelf(ada, { name: 'Running' });

    await moveShelf(ada, { id: running.id });

    expect(await shelfNames(ada)).toEqual(['Running', 'Spanish', 'Guitar']);
  });

  test('puts a shelf last when it goes after the last one', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createShelf(ada, { name: 'Guitar' });
    const running = await createShelf(ada, { name: 'Running' });

    await moveShelf(ada, { id: spanish.id, after: running.id });

    expect(await shelfNames(ada)).toEqual(['Guitar', 'Running', 'Spanish']);
  });

  test('leaves the key as it is when a shelf is dropped where it already stands', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    await createShelf(ada, { name: 'Running' });
    await moveShelf(ada, { id: guitar.id, after: spanish.id });
    const settled = await positionOf(db, guitar.id);

    for (let drop = 0; drop < 5; drop++) {
      await moveShelf(ada, { id: guitar.id, after: spanish.id });
      await moveShelf(ada, { id: spanish.id });
    }

    expect(await positionOf(db, guitar.id)).toBe(settled);
    expect(await shelfNames(ada)).toEqual(['Spanish', 'Guitar', 'Running']);
  });

  test('keeps the order when shelves keep swapping in the same gap', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const running = await createShelf(ada, { name: 'Running' });

    for (let swap = 0; swap < 20; swap++) {
      await moveShelf(ada, { id: running.id, after: spanish.id });
      expect(await shelfNames(ada)).toEqual(['Spanish', 'Running', 'Guitar']);
      await moveShelf(ada, { id: guitar.id, after: spanish.id });
      expect(await shelfNames(ada)).toEqual(['Spanish', 'Guitar', 'Running']);
    }
  });

  test('moves after a shelf that shares its position with another one, as two tabs creating at once leave them', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const running = await createShelf(ada, { name: 'Running' });
    await db
      .update(shelf)
      .set({ position: await positionOf(db, spanish.id) })
      .where(eq(shelf.id, guitar.id));

    await moveShelf(ada, { id: running.id, after: spanish.id });
    expect(await shelfNames(ada)).toEqual(['Spanish', 'Guitar', 'Running']);
    await moveShelf(ada, { id: running.id });

    expect(await shelfNames(ada)).toEqual(['Running', 'Spanish', 'Guitar']);
  });

  test("answers NOT_FOUND for another user's shelf on either side, and moves nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const chess = await createShelf(bea, { name: 'Chess' });
    const go = await createShelf(bea, { name: 'Go' });

    for (const move of [
      { id: guitar.id, after: chess.id },
      { id: chess.id, after: spanish.id },
      { id: go.id },
      { id: guitar.id, after: MISSING_ID },
    ]) {
      await expect(moveShelf(ada, move)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect(await shelfNames(ada)).toEqual(['Spanish', 'Guitar']);
    expect(await shelfNames(bea)).toEqual(['Chess', 'Go']);
  });

  test('refuses to put a shelf after itself', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });

    await expect(
      moveShelf(ada, { id: spanish.id, after: spanish.id }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('deleteShelf', () => {
  test('deletes the shelf and leaves the others in their order', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    await createShelf(ada, { name: 'Running' });

    await deleteShelf(ada, { id: guitar.id });

    expect(await shelfNames(ada)).toEqual(['Spanish', 'Running']);
  });

  test("answers NOT_FOUND for a missing shelf or another user's, and deletes nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess' });

    for (const id of [chess.id, MISSING_ID]) {
      await expect(deleteShelf(ada, { id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect(await listShelves(bea)).toEqual([chess]);
  });

  test('refuses an id that is not a uuid instead of sending it to the database', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');

    await expect(deleteShelf(ada, { id: 'shelf-1' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });
});
