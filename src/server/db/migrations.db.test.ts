import { sql } from 'drizzle-orm';
import { expect } from 'vitest';

import { dbTest as test } from './testing';

const UUID_V7 =
  /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;

test('ids can default to uuidv7() from Postgres 18', async ({ db }) => {
  const [row] = await db.execute<{ id: string }>(
    sql`select uuidv7() as id`,
    'objects',
  );

  expect(row?.id).toMatch(UUID_V7);
});

test('pg_trgm matches a word with a typo', async ({ db }) => {
  const [row] = await db.execute<{ matches: boolean }>(
    sql`select 'practise' % 'practice' as matches`,
    'objects',
  );

  expect(row?.matches).toBe(true);
});
