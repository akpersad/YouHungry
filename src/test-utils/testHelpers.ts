/**
 * Test Helper Utilities
 *
 * This file contains common test utilities and helper functions
 * that can be reused across different test files.
 */

import { QueryClient } from '@tanstack/react-query';
import React from 'react';
import { expect, jest } from '@jest/globals';

// ============================================================================
// REACT QUERY TEST HELPERS
// ============================================================================

/**
 * Creates a test QueryClient with disabled retries for faster tests
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Creates a TestWrapper component for React Query hooks
 */
export const createTestWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'test-wrapper' }, children);
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

// ============================================================================
// MOCK VALIDATION HELPERS
// ============================================================================

/**
 * Validates that a fetch call was made with the expected URL and method
 */
export const expectFetchCall = (
  mockFetch: jest.MockedFunction<typeof fetch>,
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
) => {
  if (options) {
    expect(mockFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining(options)
    );
  } else {
    expect(mockFetch).toHaveBeenCalledWith(url);
  }
};

/**
 * Validates that a fetch call was made exactly once
 */
export const expectFetchCalledOnce = (
  mockFetch: jest.MockedFunction<typeof fetch>
) => {
  expect(mockFetch).toHaveBeenCalledTimes(1);
};

/**
 * Validates that a mock function was called with specific arguments
 */
export const expectMockCalledWith = (
  mockFn: jest.MockedFunction<(...args: unknown[]) => unknown>,
  ...args: unknown[]
) => {
  expect(mockFn).toHaveBeenCalledWith(...args);
};

/**
 * Validates that a mock function was called exactly once
 */
export const expectMockCalledOnce = (
  mockFn: jest.MockedFunction<(...args: unknown[]) => unknown>
) => {
  expect(mockFn).toHaveBeenCalledTimes(1);
};

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

/**
 * Creates a mock successful API response
 */
export const createMockApiSuccess = <T>(data: T, status = 200) => ({
  ok: true,
  status,
  json: async () => ({ success: true, data }),
  text: async () => JSON.stringify({ success: true, data }),
  headers: new Headers(),
});

/**
 * Creates a mock error API response
 */
export const createMockApiError = (error: string, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ success: false, error }),
  text: async () => JSON.stringify({ success: false, error }),
  headers: new Headers(),
});

/**
 * Creates a mock fetch response for network errors
 */
export const createMockNetworkError = () => {
  const error = new Error('Network error');
  return Promise.reject(error);
};

// ============================================================================
// DOM TESTING HELPERS
// ============================================================================

/**
 * Waits for an element to appear in the DOM
 */
export const waitForElement = async (
  getByTestId: (id: string) => HTMLElement,
  testId: string,
  timeout = 1000
) => {
  return new Promise<HTMLElement>((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      try {
        const element = getByTestId(testId);
        resolve(element);
      } catch {
        if (Date.now() - startTime > timeout) {
          reject(
            new Error(
              `Element with testId "${testId}" not found within ${timeout}ms`
            )
          );
        } else {
          setTimeout(check, 10);
        }
      }
    };

    check();
  });
};

// ============================================================================
// PERFORMANCE TESTING HELPERS
// ============================================================================

/**
 * Measures the execution time of a function
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; executionTime: number }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();

  return {
    result,
    executionTime: endTime - startTime,
  };
};

/**
 * Creates a mock performance object for testing
 */
export const createMockPerformance = () => ({
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
});

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

/**
 * Sets up test environment variables
 */
export const setupTestEnv = () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    GOOGLE_PLACES_API_KEY: 'test-api-key',
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: 'test-api-key',
    MONGODB_URI: 'mongodb://localhost:27017/you-hungry-test',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
  });
};

/**
 * Cleans up test environment
 */
export const cleanupTestEnv = () => {
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  delete process.env.MONGODB_URI;
  delete process.env.NEXTAUTH_SECRET;
  delete process.env.NEXTAUTH_URL;
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that a value is a valid ObjectId string
 */
export const expectValidObjectId = (value: string) => {
  expect(value).toMatch(/^[0-9a-fA-F]{24}$/);
};

/**
 * Asserts that a value is a valid ISO date string
 */
export const expectValidISODate = (value: string) => {
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  expect(new Date(value).toISOString()).toBe(value);
};

/**
 * Asserts that a value is within a reasonable range for a timestamp
 */
export const expectValidTimestamp = (value: number) => {
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

  expect(value).toBeGreaterThanOrEqual(oneYearAgo);
  expect(value).toBeLessThanOrEqual(oneYearFromNow);
};

/**
 * Asserts that an array contains unique values
 */
export const expectUniqueArray = <T>(array: T[]) => {
  const uniqueArray = [...new Set(array)];
  expect(array).toHaveLength(uniqueArray.length);
};

// ============================================================================
// ERROR TESTING HELPERS
// ============================================================================

/**
 * Asserts that a function throws an error with a specific message
 */
export const expectToThrowWithMessage = async (
  fn: () => Promise<unknown> | unknown,
  expectedMessage: string | RegExp
) => {
  await expect(fn).rejects.toThrow(expectedMessage);
};

/**
 * Asserts that a function throws an error of a specific type
 */
export const expectToThrowWithType = async <T extends Error>(
  fn: () => Promise<unknown> | unknown,
  ErrorType: new (...args: unknown[]) => T
) => {
  await expect(fn).rejects.toThrow(ErrorType);
};

/**
 * Asserts that a promise rejects with a specific error
 */
export const expectPromiseToReject = async (
  promise: Promise<unknown>,
  expectedError?: string | RegExp | Error
) => {
  if (expectedError) {
    await expect(promise).rejects.toThrow(expectedError);
  } else {
    await expect(promise).rejects.toThrow();
  }
};
