import nextJest from 'next/jest.js';

// Pin the timezone so date-rendering assertions are deterministic: 6 tests
// assert toLocaleDateString output, which differs between local (EST) and
// CI (UTC) runners. Unconditional on purpose — tests must not depend on the
// host timezone.
process.env.TZ = 'America/New_York';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^mongodb$': '<rootDir>/src/__mocks__/mongodb.js',
    '^bson$': '<rootDir>/src/__mocks__/bson.js',
    '^@clerk/nextjs$': '<rootDir>/src/__mocks__/@clerk/nextjs.js',
    '^@clerk/nextjs/legacy$': '<rootDir>/src/__mocks__/@clerk/nextjs.js',
    '^@clerk/nextjs/server$': '<rootDir>/src/__mocks__/@clerk/nextjs.js',
    '^@clerk/backend$': '<rootDir>/src/__mocks__/@clerk/backend.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|@mongodb-js|@clerk|@clerk/backend|@clerk/nextjs|@vercel)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'json', 'json-summary'],
  // Honest floors at measured coverage (re-measured 2026-07-07 after the
  // account-surface tests landed: 52.7S/55.9B/54.4F/53.3L). Policy:
  // ratchet-only — raise floors when coverage rises, never lower them to
  // make a change fit.
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 53,
      lines: 52,
      statements: 51,
    },
  },
};

export default createJestConfig(customJestConfig);
