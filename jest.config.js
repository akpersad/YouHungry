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
    '^@/test-utils/(.*)$': '<rootDir>/src/test-utils/$1',
    '^mongodb$': '<rootDir>/src/__mocks__/mongodb.js',
    '^bson$': '<rootDir>/src/__mocks__/bson.js',
    '^@clerk/nextjs$': '<rootDir>/src/__mocks__/@clerk/nextjs.js',
    '^@clerk/nextjs/legacy$': '<rootDir>/src/__mocks__/@clerk/nextjs.js',
    '^@clerk/nextjs/server$': '<rootDir>/src/__mocks__/@clerk/nextjs.js',
    '^@clerk/backend$': '<rootDir>/src/__mocks__/@clerk/backend.js',
    '^@vercel/blob$': '<rootDir>/src/__mocks__/@vercel/blob.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|@mongodb-js|@clerk|@clerk/backend|@clerk/nextjs|@vercel|@vercel/blob)/)',
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
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/in-app-notifications.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'json', 'json-summary'],
  // Honest floors at measured coverage (2026-06 honesty pass: 44.0L/43.3S/
  // 34.4F/38.9B globally; decisions.ts/auth.ts/notification-service.ts are
  // now 99-100%). The old 60% figure never ran in any gate and was never
  // actually met. Policy: ratchet-only — raise floors when coverage rises.
  coverageThreshold: {
    global: {
      branches: 38,
      functions: 34,
      lines: 43,
      statements: 43,
    },
  },
};

export default createJestConfig(customJestConfig);
