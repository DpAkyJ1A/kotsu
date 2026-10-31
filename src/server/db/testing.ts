import 'server-only';

import { type EmptyRelations, TransactionRollbackError } from 'drizzle-orm';
import { drizzle, type NodePgTransaction } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { inject, test } from 'vitest';

/**
 * `test` for `*.db.test.ts` files. `db` is the run's own database (see vitest.db-setup.ts) inside a
 * transaction that is rolled back after the test, so tests can't see each other's rows. Code that opens a
 * transaction of its own gets a savepoint inside this one.
 */
export const dbTest = test.extend<{
  $file: { pool: Pool };
  $test: { db: NodePgTransaction<EmptyRelations> };
}>({
  pool: [
    async ({}, use) => {
      const pool = new Pool({ connectionString: inject('databaseUrl') });
      await use(pool);
      await pool.end();
    },
    { scope: 'file' },
  ],
  db: async ({ pool }, use) => {
    await drizzle({ client: pool })
      .transaction(async (tx) => {
        await use(tx);
        tx.rollback();
      })
      .catch((error: unknown) => {
        // tx.rollback() ends the transaction by throwing this
        if (!(error instanceof TransactionRollbackError)) throw error;
      });
  },
});
