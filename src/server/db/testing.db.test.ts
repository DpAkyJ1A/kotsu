import { sql, TransactionRollbackError } from 'drizzle-orm';
import { describe, expect } from 'vitest';

import { dbTest as test } from './testing';

const countProbes = sql`select count(*)::integer as count from probe`;

// The tests run in order: the second one checks what the first one left behind
describe('dbTest', () => {
  test('gives each test a transaction to write in', async ({ db }) => {
    await db.execute(sql`create table probe (id integer)`);
    await db.execute(sql`insert into probe values (1)`);

    const [row] = await db.execute<{ count: number }>(countProbes, 'objects');
    expect(row?.count).toBe(1);
  });

  test('rolls it back before the next test', async ({ db }) => {
    const [row] = await db.execute<{ probe: string | null }>(
      sql`select to_regclass('probe') as probe`,
      'objects',
    );

    expect(row?.probe).toBeNull();
  });

  test('turns a transaction inside a test into a savepoint', async ({ db }) => {
    await db.execute(sql`create table probe (id integer)`);

    await expect(
      db.transaction(async (tx) => {
        await tx.execute(sql`insert into probe values (1)`);
        tx.rollback();
      }),
    ).rejects.toThrow(TransactionRollbackError);

    // The table from before the savepoint is still there, the row from inside it is gone
    const [row] = await db.execute<{ count: number }>(countProbes, 'objects');
    expect(row?.count).toBe(0);
  });
});
