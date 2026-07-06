import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const isCI = !!process.env.CI;

// Load environment variables from .env.local (local development only)
// In CI, environment variables are already set by GitHub Actions
if (!isCI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
}

/**
 * Playwright E2E configuration — rebuilt around the v2 journeys at the
 * Phase 7 cutover. Chromium desktop drives every journey; Mobile Chrome
 * re-runs the @smoke cuts (the app is a phone-first surface). Additional
 * engines are a Phase 8 decision, not a silent claim.
 */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: isCI,
  // 1 local retry: auth-dependent specs flake under parallel load because
  // the Clerk DEV instance (strict usage limits) intermittently fails to
  // resolve the session — passes deterministically in isolation/on retry.
  retries: isCI ? 2 : 1,
  workers: 4,

  reporter: isCI
    ? [
        ['list'],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['junit', { outputFile: 'playwright-report/results.xml' }],
        ['html'],
      ]
    : [['list'], ['json', { outputFile: 'playwright-report/results.json' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Signs in the seeded test squad (scripts/v2/test-squad.ts) and saves
    // storage states. Sequential inside the file — Clerk dev-instance
    // rate limits.
    {
      name: 'setup',
      testMatch: /e2e\/auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: ['**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/organizer.json',
      },
      dependencies: ['setup'],
      fullyParallel: true,
    },
    {
      name: 'mobile-chrome',
      testMatch: ['**/*.spec.ts'],
      grep: /@smoke/,
      use: {
        ...devices['Pixel 7'],
        storageState: 'playwright/.auth/organizer.json',
      },
      dependencies: ['setup'],
      fullyParallel: true,
    },
  ],

  webServer: {
    // Production server, not `next dev`: the Next 16 dev overlay renders its
    // own role="dialog" and auto-opens on any console error (e.g. an
    // intermittent Clerk dev-instance 401), breaking strict-mode dialog
    // assertions and intercepting clicks. No overlay exists in production.
    // Locally a dev server already on :3000 is still reused — kill it first
    // for a CI-faithful run.
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 300 * 1000,
  },
});
