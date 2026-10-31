import { fileURLToPath } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Next.js resolves it to an empty module in server code; Vitest would get the version that throws
      'server-only': fileURLToPath(
        new URL('node_modules/server-only/empty.js', import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['**/*.test.ts'],
          exclude: [...configDefaults.exclude, '**/*.db.test.ts'],
        },
      },
      {
        test: {
          name: 'db',
          environment: 'node',
          include: ['**/*.db.test.ts'],
          globalSetup: ['vitest.db-setup.ts'],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
