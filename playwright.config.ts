import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Determine which browsers to run based on environment
const isCI = !!process.env.CI;
const runAllBrowsers = process.env.RUN_ALL_BROWSERS === 'true';

// Load environment variables from .env.local (local development only)
// In CI, environment variables are already set by GitHub Actions
if (!isCI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
}

/**
 * Playwright E2E Testing Configuration - SMART PARALLELIZATION
 *
 * Local/PR: Chromium + Mobile Chrome only (fast feedback)
 * Main/Nightly: All 5 browsers (comprehensive coverage)
 */

export default defineConfig({
  testDir: './e2e',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,

  // Use multiple workers - let projects override if needed
  // Maximize workers for fast tests (slow tests override to 1 per project)
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
    // 1. Setup - runs once, sequentially
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 2. Auth tests - sequential (Clerk state management)
    {
      name: 'auth-tests',
      testMatch: /.*authentication\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
      fullyParallel: false,
    },

    // 3. CHROMIUM FAST TESTS - Parallel execution safe
    {
      name: 'chromium-fast',
      testMatch: [
        '**/accessibility.spec.ts',
        '**/registration-enhanced.spec.ts',
        '**/restaurant-search.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      fullyParallel: true, // Safe to run in parallel
    },

    // 4. CHROMIUM SLOW TESTS - Sequential due to test pollution and performance measurement
    {
      name: 'chromium-slow',
      testMatch: [
        '**/friend-management.spec.ts',
        '**/group-collaboration.spec.ts',
        '**/group-decision-*.spec.ts',
        '**/performance/**/*.spec.ts', // Performance tests need sequential execution
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      fullyParallel: false, // Sequential to avoid test pollution and accurate timing
    },

    // 5. MOBILE CHROME - Always run (local + CI)
    {
      name: 'mobile-chrome-fast',
      testMatch: [
        '**/registration-enhanced.spec.ts',
        // Note: Accessibility already tested in chromium-fast
      ],
      use: {
        ...devices['Pixel 7'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      fullyParallel: true,
    },

    // 6-9. ADDITIONAL BROWSERS - Only in comprehensive mode (main branch/nightly)
    ...(runAllBrowsers
      ? [
          // Mobile Safari
          {
            name: 'mobile-safari-fast',
            testMatch: [
              '**/accessibility.spec.ts',
              '**/registration-enhanced.spec.ts',
            ],
            use: {
              ...devices['iPhone 14 Pro'],
              storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
            fullyParallel: true,
          },
          // Firefox
          {
            name: 'firefox-fast',
            testMatch: [
              '**/accessibility.spec.ts',
              '**/registration-enhanced.spec.ts',
              '**/restaurant-search.spec.ts',
            ],
            use: {
              ...devices['Desktop Firefox'],
              storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
            fullyParallel: true,
          },
          {
            name: 'firefox-slow',
            testMatch: [
              '**/friend-management.spec.ts',
              '**/group-collaboration.spec.ts',
              '**/group-decision-*.spec.ts',
              '**/performance/**/*.spec.ts',
            ],
            use: {
              ...devices['Desktop Firefox'],
              storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
            fullyParallel: false,
          },
          // Webkit (Safari)
          {
            name: 'webkit-fast',
            testMatch: [
              '**/accessibility.spec.ts',
              '**/registration-enhanced.spec.ts',
              '**/restaurant-search.spec.ts',
            ],
            use: {
              ...devices['Desktop Safari'],
              storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
            fullyParallel: true,
          },
          {
            name: 'webkit-slow',
            testMatch: [
              '**/friend-management.spec.ts',
              '**/group-collaboration.spec.ts',
              '**/group-decision-*.spec.ts',
              '**/performance/**/*.spec.ts',
            ],
            use: {
              ...devices['Desktop Safari'],
              storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
            fullyParallel: false,
          },
        ]
      : []),
  ],

  webServer: {
    command: 'npm run dev:force',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
