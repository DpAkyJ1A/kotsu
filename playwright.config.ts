import { defineConfig, devices } from '@playwright/test';

const LOCAL_URL = 'http://localhost:5687';
const isCI = Boolean(process.env.CI);
// Set to test a deployment instead of a local build (the smoke tests); then no server is started
const deploymentURL = process.env.PLAYWRIGHT_BASE_URL;
// Lets the requests through Vercel's Deployment Protection, which guards previews
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: deploymentURL ?? LOCAL_URL,
    extraHTTPHeaders: bypassSecret
      ? { 'x-vercel-protection-bypass': bypassSecret }
      : {},
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
  ...(deploymentURL
    ? {}
    : {
        webServer: {
          command: 'pnpm build && pnpm start',
          url: LOCAL_URL,
          reuseExistingServer: !isCI,
        },
      }),
});
