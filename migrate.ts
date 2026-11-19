import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Neon's pooled URL goes through PgBouncer; migrations take the direct one when it is set
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set: copy .env.example to .env');

const db = drizzle({ connection: url });
try {
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.info('The database is up to date');
} finally {
  await db.$client.end();
}
