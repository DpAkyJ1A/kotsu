import { randomBytes } from 'node:crypto';

import { loadEnvConfig } from '@next/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import type { TestProject } from 'vitest/node';

// Global setup of the `db` project. Each run creates a database of its own next to the one in DATABASE_URL,
// migrates it and drops it at the end, so tests never see development data or another run's rows.
export default async function setup(project: TestProject) {
  try {
    return await createTestDatabase(project);
  } catch (error) {
    // Vitest 5.0.5 crashes while it prints an error thrown from global setup ("code.charCodeAt is not a
    // function"), so the messages, causes included, go out first
    printMessages(error);
    throw error;
  }
}

function printMessages(error: unknown) {
  if (!(error instanceof Error)) return;
  console.error(error.message);
  printMessages(error.cause);
}

async function createTestDatabase(project: TestProject) {
  loadEnvConfig(process.cwd());
  const serverUrl = process.env.DATABASE_URL;
  if (!serverUrl) {
    throw new Error('DATABASE_URL is not set: copy .env.example to .env');
  }

  const server = new Client({ connectionString: serverUrl });
  await server.connect().catch((error: unknown) => {
    throw new Error(
      `Postgres at ${new URL(serverUrl).host} is not reachable: start it with \`docker compose up -d db\``,
      { cause: error },
    );
  });

  // Hex only, so the name is safe to put into the statement
  const name = `kotsu_test_${randomBytes(4).toString('hex')}`;
  const databaseUrl = new URL(serverUrl);
  databaseUrl.pathname = `/${name}`;
  await server.query(`create database ${name}`);

  const client = new Client({ connectionString: databaseUrl.href });
  await client.connect();
  try {
    await migrate(drizzle({ client }), { migrationsFolder: 'drizzle' });
  } finally {
    await client.end();
  }

  project.provide('databaseUrl', databaseUrl.href);

  return async () => {
    await server.query(`drop database ${name} with (force)`);
    await server.end();
  };
}
