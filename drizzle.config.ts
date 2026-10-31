import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// The same .env files Next.js reads
loadEnvConfig(process.cwd());

// Neon's pooled URL goes through PgBouncer; migrations take the direct one when it is set
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema/*.ts',
  out: './drizzle',
  ...(url ? { dbCredentials: { url } } : {}),
});
