import nextJest from 'next/jest.js';

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
    '^@clerk/backend$': '<rootDir>/src/__mocks__/@clerk/backend.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|@mongodb-js|@clerk|@clerk/backend|@clerk/nextjs)/)',
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
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

export default createJestConfig(customJestConfig);
