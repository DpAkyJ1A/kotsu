import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';
import type { BrowserConfigOptions } from 'vitest/node';

// Headless Chromium, for the component tests and the stories. A new object for each project, because
// Vitest writes the project's name into the instances
const browser = (): BrowserConfigOptions => ({
  enabled: true,
  provider: playwright(),
  headless: true,
  instances: [{ browser: 'chromium' }],
});

type Theme = 'light' | 'dark';

// Storybook's "Run tests" button (it sets VITEST_STORYBOOK) names every Storybook project after the
// .storybook folder, so two of them clash there; the button runs the light one only
const STORY_THEMES: Theme[] =
  process.env.VITEST_STORYBOOK === 'true' ? ['light'] : ['light', 'dark'];

// Every story is a test (it renders, its play function passes, axe finds nothing), run once per theme
const storybookProject = (theme: Theme) => ({
  plugins: [storybookTest({ initialGlobals: { theme } })],
  test: { name: `storybook-${theme}`, browser: browser() },
});

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
          browser: browser(),
        },
      },
      ...STORY_THEMES.map(storybookProject),
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
