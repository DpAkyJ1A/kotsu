import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { describe, expect } from 'vitest';

import { createUser } from '@/server/auth/testing';
import type { Ctx } from '@/server/ctx/load-ctx';
import { ctxOf, withStorageQuota } from '@/server/ctx/testing';
import type { Db } from '@/server/db/client';
import { item } from '@/server/db/schema/shelves';
import { dbTest as test } from '@/server/db/testing';

import { ITEM_ROW_BYTES } from '../core/storage';
import { createShelf, deleteShelf } from './commands';
import { createItem, deleteItem, moveItem, renameItem } from './item-commands';
import { getNavigation } from './queries';

const NOW = new Date('2026-11-20T09:00:00Z');
const MISSING_ID = '019a9c3e-0000-7000-8000-000000000000';

async function signIn(db: Db, email: string) {
  return ctxOf(db, await createUser(db, email), NOW);
}

async function createDoc(ctx: Ctx, shelfId: string, title: string) {
  return createItem(ctx, { shelfId, kind: 'doc', title });
}

async function createDocs(ctx: Ctx, shelfId: string, titles: string[]) {
  for (const title of titles) await createDoc(ctx, shelfId, title);
}

async function titlesOn(ctx: Ctx, shelfId: string) {
  const { items } = await getNavigation(ctx);
  return items
    .filter((onShelf) => onShelf.shelfId === shelfId)
    .map(({ title }) => title);
}

async function setSize(db: Db, id: string, sizeBytes: number) {
  await db.update(item).set({ sizeBytes }).where(eq(item.id, id));
}

async function rowOf(db: Db, id: string) {
  const [found] = await db
    .select({
      position: item.position,
      content: item.content,
      plainText: item.plainText,
      version: item.version,
      sizeBytes: item.sizeBytes,
    })
    .from(item)
    .where(eq(item.id, id));
  return found;
}

describe('createItem', () => {
  test('adds the item at the end of its shelf and returns it', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createDocs(ada, spanish.id, ['Verbs', 'Food']);

    const created = await createItem(ada, {
      shelfId: spanish.id,
      kind: 'sheet',
      title: '  Words  ',
    });

    expect(created).toMatchObject({
      shelfId: spanish.id,
      kind: 'sheet',
      title: 'Words',
    });
    expect((await getNavigation(ada)).items.at(-1)).toEqual(created);
    expect(await titlesOn(ada, spanish.id)).toEqual(['Verbs', 'Food', 'Words']);
  });

  test('adds the item after the last one in the order, not the last one saved', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createDocs(ada, spanish.id, ['Verbs', 'Food']);
    const travel = await createDoc(ada, spanish.id, 'Travel');
    await moveItem(ada, { id: travel.id, shelfId: spanish.id });

    await createDoc(ada, spanish.id, 'Numbers');

    expect(await titlesOn(ada, spanish.id)).toEqual([
      'Travel',
      'Verbs',
      'Food',
      'Numbers',
    ]);
  });

  test('starts the item empty: no body, no text, version 1, no size', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });

    const verbs = await createDoc(ada, spanish.id, 'Verbs');

    expect(await rowOf(db, verbs.id)).toMatchObject({
      content: null,
      plainText: '',
      version: 1,
      sizeBytes: 0,
    });
  });

  test('keeps the id the browser made for the item it already shows', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const id = uuidv7();

    const created = await createItem(ada, {
      id,
      shelfId: spanish.id,
      kind: 'doc',
      title: 'Verbs',
    });

    expect(created.id).toBe(id);
  });

  test('allows two items with the same title on one shelf', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });

    await createDocs(ada, spanish.id, ['Verbs', 'Verbs']);

    expect(await titlesOn(ada, spanish.id)).toEqual(['Verbs', 'Verbs']);
  });

  test('refuses a non-v7 id, an unknown kind and a blank or too long title, and saves nothing', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const doc = { shelfId: spanish.id, kind: 'doc', title: 'Verbs' } as const;

    for (const input of [
      { ...doc, id: randomUUID() },
      { ...doc, kind: 'slides' as 'doc' },
      { ...doc, title: '   ' },
      { ...doc, title: 'a'.repeat(201) },
    ]) {
      await expect(createItem(ada, input)).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    }
    expect(
      await createItem(ada, { ...doc, title: 'a'.repeat(200) }),
    ).toMatchObject({ title: 'a'.repeat(200) });
    expect(await titlesOn(ada, spanish.id)).toHaveLength(1);
  });

  test("answers NOT_FOUND for a missing shelf or another user's, and creates nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess' });

    for (const shelfId of [chess.id, MISSING_ID]) {
      await expect(createDoc(ada, shelfId, 'Openings')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect((await getNavigation(ada)).items).toEqual([]);
    expect((await getNavigation(bea)).items).toEqual([]);
  });

  test('creates an item while its 1 kB still fits in the quota, up to the quota itself', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    await setSize(db, verbs.id, 3_000);
    const full = await withStorageQuota(ada, 3_000 + 2 * ITEM_ROW_BYTES);

    await createDoc(full, spanish.id, 'Food');

    expect(await titlesOn(full, spanish.id)).toEqual(['Verbs', 'Food']);
  });

  test('answers STORAGE_FULL for an item that would take the user past the quota, and creates nothing', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    await setSize(db, verbs.id, 3_000);
    const full = await withStorageQuota(ada, 3_000 + 2 * ITEM_ROW_BYTES - 1);

    await expect(createDoc(full, spanish.id, 'Food')).rejects.toMatchObject({
      code: 'STORAGE_FULL',
    });
    expect(await titlesOn(full, spanish.id)).toEqual(['Verbs']);
  });

  test("counts only the user's own items against the quota", async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess' });
    const openings = await createDoc(bea, chess.id, 'Openings');
    await setSize(db, openings.id, 1_000_000);
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const full = await withStorageQuota(ada, ITEM_ROW_BYTES);

    await createDoc(full, spanish.id, 'Verbs');

    expect(await titlesOn(full, spanish.id)).toEqual(['Verbs']);
  });

  test("answers NOT_FOUND, not STORAGE_FULL, for another user's shelf when the storage is full", async ({
    db,
  }) => {
    const ada = await withStorageQuota(await signIn(db, 'ada@example.com'), 0);
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess' });

    await expect(createDoc(ada, chess.id, 'Openings')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('renameItem', () => {
  test('renames the item and leaves its shelf, kind, place and version alone', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    await createDoc(ada, spanish.id, 'Food');
    const before = await rowOf(db, verbs.id);

    const renamed = await renameItem(ada, { id: verbs.id, title: ' Verbos ' });

    expect(renamed).toEqual({ ...verbs, title: 'Verbos' });
    expect(await titlesOn(ada, spanish.id)).toEqual(['Verbos', 'Food']);
    expect(await rowOf(db, verbs.id)).toEqual(before);
  });

  test('refuses a blank title, and anything besides the title', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');

    for (const rename of [
      { id: verbs.id, title: '  ' },
      { id: verbs.id, title: 'Verbos', kind: 'sheet' },
    ]) {
      await expect(renameItem(ada, rename)).rejects.toMatchObject({
        code: 'VALIDATION',
      });
    }
    expect(await titlesOn(ada, spanish.id)).toEqual(['Verbs']);
  });

  test("answers NOT_FOUND for a missing item or another user's, and changes nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess' });
    const openings = await createDoc(bea, chess.id, 'Openings');

    for (const id of [openings.id, MISSING_ID]) {
      await expect(
        renameItem(ada, { id, title: 'Mine now' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    }
    expect((await getNavigation(bea)).items).toEqual([openings]);
  });
});

describe('moveItem', () => {
  test('puts an item right after another one on its shelf', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    const food = await createDoc(ada, spanish.id, 'Food');
    await createDoc(ada, spanish.id, 'Travel');

    await moveItem(ada, { id: verbs.id, shelfId: spanish.id, after: food.id });

    expect(await titlesOn(ada, spanish.id)).toEqual([
      'Food',
      'Verbs',
      'Travel',
    ]);
  });

  test('puts an item first on its shelf when it goes after nothing', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createDocs(ada, spanish.id, ['Verbs', 'Food']);
    const travel = await createDoc(ada, spanish.id, 'Travel');

    await moveItem(ada, { id: travel.id, shelfId: spanish.id });

    expect(await titlesOn(ada, spanish.id)).toEqual([
      'Travel',
      'Verbs',
      'Food',
    ]);
  });

  test('moves an item to another shelf, after an item there or first', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    const food = await createDoc(ada, spanish.id, 'Food');
    await createDoc(ada, spanish.id, 'Travel');
    const chords = await createDoc(ada, guitar.id, 'Chords');
    await createDoc(ada, guitar.id, 'Songs');

    await moveItem(ada, { id: verbs.id, shelfId: guitar.id, after: chords.id });
    await moveItem(ada, { id: food.id, shelfId: guitar.id });

    expect(await titlesOn(ada, spanish.id)).toEqual(['Travel']);
    expect(await titlesOn(ada, guitar.id)).toEqual([
      'Food',
      'Chords',
      'Verbs',
      'Songs',
    ]);
  });

  test('moves an item onto an empty shelf', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');

    await moveItem(ada, { id: verbs.id, shelfId: guitar.id });

    expect(await titlesOn(ada, spanish.id)).toEqual([]);
    expect(await titlesOn(ada, guitar.id)).toEqual(['Verbs']);
  });

  test('leaves the key as it is when an item is dropped where it already stands', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    const food = await createDoc(ada, spanish.id, 'Food');
    await createDoc(ada, spanish.id, 'Travel');
    await moveItem(ada, { id: food.id, shelfId: spanish.id, after: verbs.id });
    const settled = (await rowOf(db, food.id))?.position;

    for (let drop = 0; drop < 5; drop++) {
      await moveItem(ada, {
        id: food.id,
        shelfId: spanish.id,
        after: verbs.id,
      });
      await moveItem(ada, { id: verbs.id, shelfId: spanish.id });
    }

    expect((await rowOf(db, food.id))?.position).toBe(settled);
    expect(await titlesOn(ada, spanish.id)).toEqual([
      'Verbs',
      'Food',
      'Travel',
    ]);
  });

  test('moves after an item that shares its position with another one, as two tabs creating at once leave them', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    const food = await createDoc(ada, spanish.id, 'Food');
    const travel = await createDoc(ada, spanish.id, 'Travel');
    await db
      .update(item)
      .set({ position: (await rowOf(db, verbs.id))?.position ?? '' })
      .where(eq(item.id, food.id));

    await moveItem(ada, {
      id: travel.id,
      shelfId: spanish.id,
      after: verbs.id,
    });

    expect(await titlesOn(ada, spanish.id)).toEqual([
      'Verbs',
      'Food',
      'Travel',
    ]);
  });

  test('leaves the version alone', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');

    await moveItem(ada, { id: verbs.id, shelfId: guitar.id });

    expect(await rowOf(db, verbs.id)).toMatchObject({ version: 1 });
  });

  test('answers NOT_FOUND when the item to go after is not on the shelf named, and moves nothing', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    const food = await createDoc(ada, spanish.id, 'Food');
    const chords = await createDoc(ada, guitar.id, 'Chords');

    for (const move of [
      { id: verbs.id, shelfId: spanish.id, after: chords.id },
      { id: verbs.id, shelfId: guitar.id, after: food.id },
    ]) {
      await expect(moveItem(ada, move)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect(await titlesOn(ada, spanish.id)).toEqual(['Verbs', 'Food']);
    expect(await titlesOn(ada, guitar.id)).toEqual(['Chords']);
  });

  test("answers NOT_FOUND for another user's item, shelf or item to go after, and moves nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');
    const chess = await createShelf(bea, { name: 'Chess' });
    const openings = await createDoc(bea, chess.id, 'Openings');

    for (const move of [
      { id: openings.id, shelfId: spanish.id },
      { id: verbs.id, shelfId: chess.id },
      { id: verbs.id, shelfId: chess.id, after: openings.id },
      { id: verbs.id, shelfId: MISSING_ID },
      { id: MISSING_ID, shelfId: spanish.id },
    ]) {
      await expect(moveItem(ada, move)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect((await getNavigation(ada)).items).toEqual([verbs]);
    expect((await getNavigation(bea)).items).toEqual([openings]);
  });

  test('refuses to put an item after itself', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const verbs = await createDoc(ada, spanish.id, 'Verbs');

    await expect(
      moveItem(ada, { id: verbs.id, shelfId: spanish.id, after: verbs.id }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('deleteItem', () => {
  test('deletes the item and leaves the others in their order', async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    await createDoc(ada, spanish.id, 'Verbs');
    const food = await createDoc(ada, spanish.id, 'Food');
    await createDoc(ada, spanish.id, 'Travel');

    await deleteItem(ada, { id: food.id });

    expect(await titlesOn(ada, spanish.id)).toEqual(['Verbs', 'Travel']);
  });

  test("answers NOT_FOUND for a missing item or another user's, and deletes nothing", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess' });
    const openings = await createDoc(bea, chess.id, 'Openings');

    for (const id of [openings.id, MISSING_ID]) {
      await expect(deleteItem(ada, { id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    }
    expect((await getNavigation(bea)).items).toEqual([openings]);
  });
});

describe('the item table', () => {
  test("refuses an item on another user's shelf even when written past the domain", async ({
    db,
  }) => {
    const ada = await signIn(db, 'ada@example.com');
    const bea = await signIn(db, 'bea@example.com');
    const chess = await createShelf(bea, { name: 'Chess' });

    await expect(
      db.insert(item).values({
        userId: ada.userId,
        shelfId: chess.id,
        kind: 'doc',
        title: 'Openings',
        position: 'a0',
      }),
    ).rejects.toMatchObject({
      cause: { constraint: 'item_shelf_id_user_id_fkey' },
    });
  });

  test('a deleted shelf takes its items with it', async ({ db }) => {
    const ada = await signIn(db, 'ada@example.com');
    const spanish = await createShelf(ada, { name: 'Spanish' });
    const guitar = await createShelf(ada, { name: 'Guitar' });
    await createDocs(ada, spanish.id, ['Verbs', 'Food']);
    const chords = await createDoc(ada, guitar.id, 'Chords');

    await deleteShelf(ada, { id: spanish.id });

    expect((await getNavigation(ada)).items).toEqual([chords]);
  });
});
