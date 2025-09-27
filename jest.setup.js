import '@testing-library/jest-dom';

// Mock fetch globally for all tests
global.fetch = jest.fn();

// Mock fetch responses
const mockFetch = global.fetch;

// Default mock implementation - only used when no specific mock is set
mockFetch.mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  })
);

// Reset fetch mock before each test, but preserve any specific mocks
beforeEach(() => {
  // Don't clear mocks that are specifically set by individual tests
  // This allows tests to override the default behavior when needed
});
