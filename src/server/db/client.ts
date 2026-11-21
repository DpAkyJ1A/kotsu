import 'server-only';

import { attachDatabasePool } from '@vercel/functions';
import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgAsyncTransaction } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

import { env } from '@/server/env';

const pool = new Pool({ connectionString: env.DATABASE_URL });

// On Vercel, keeps a function instance alive until the pool has closed its idle connections, so a suspended
// instance doesn't leave them open; elsewhere it does nothing
attachDatabasePool(pool);

export const db = drizzle({ client: pool });

export type Db = typeof db | PgAsyncTransaction<NodePgQueryResultHKT>;
