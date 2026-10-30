import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5687';
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    // WebKit, because every browser on iOS, and so the installed PWA, runs on it
    { name: 'mobile', use: devices['iPhone 17'] },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: !isCI,
  },
});
