import nextEnv from '@next/env';
import { defineConfig, devices } from '@playwright/test';

nextEnv.loadEnvConfig(process.cwd());

const LOCAL_URL = 'http://localhost:5687';
const WITHOUT_GOOGLE_URL = 'http://localhost:5688';
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
        webServer: [
          {
            command: 'pnpm build && pnpm start',
            url: LOCAL_URL,
            reuseExistingServer: !isCI,
            // Made-up Google keys turn the button on; the tests stop at Google's door
            env: {
              RESEND_API_KEY: '',
              GOOGLE_CLIENT_ID: 'kotsu-e2e.apps.googleusercontent.com',
              GOOGLE_CLIENT_SECRET: 'e2e-only-google-secret',
            },
          },
          {
            // The same build without Google keys, as on a preview or a self-hosted copy; starts after the build above
            command: 'pnpm exec next start --port 5688',
            url: WITHOUT_GOOGLE_URL,
            reuseExistingServer: !isCI,
            env: {
              RESEND_API_KEY: '',
              GOOGLE_CLIENT_ID: '',
              GOOGLE_CLIENT_SECRET: '',
            },
          },
        ],
      }),
});
