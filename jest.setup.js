import '@testing-library/jest-dom';

// Polyfill for PointerEvent (not available in jsdom)
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId || 0;
      this.width = params.width || 0;
      this.height = params.height || 0;
      this.pressure = params.pressure || 0;
      this.tiltX = params.tiltX || 0;
      this.tiltY = params.tiltY || 0;
      this.pointerType = params.pointerType || '';
      this.isPrimary = params.isPrimary || false;
    }
  }
  global.PointerEvent = PointerEvent;
}

// Polyfill for Request/Response globals needed for Next.js API tests
// Simple polyfill that provides the minimal interface needed for tests
global.Request = class Request {
  constructor(input, init = {}) {
    // Use Object.defineProperty to create a read-only url property
    Object.defineProperty(this, 'url', {
      value: typeof input === 'string' ? input : input.url,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }

  async text() {
    return this.body || '';
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }

  async text() {
    return this.body || '';
  }

  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  }
};

global.Headers = class Headers {
  constructor(init = {}) {
    this.map = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.map.set(key.toLowerCase(), value);
      });
    }
  }

  get(name) {
    return this.map.get(name.toLowerCase());
  }

  set(name, value) {
    this.map.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.map.has(name.toLowerCase());
  }

  delete(name) {
    this.map.delete(name.toLowerCase());
  }

  forEach(callback) {
    this.map.forEach(callback);
  }

  entries() {
    return this.map.entries();
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  [Symbol.iterator]() {
    return this.map[Symbol.iterator]();
  }
};

// Mock fetch globally for all tests
global.fetch = jest.fn();

// Mock fetch responses
const mockFetch = global.fetch;

// Default mock implementation - returns empty successful response
// Tests should override this with specific mocks for their needs
mockFetch.mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ results: [], status: 'OK' }),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  })
);

// Set consistent environment variables for all tests
process.env.NODE_ENV = 'test';
process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-api-key';
process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY = 'test-api-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/you-hungry-test';
process.env.MONGODB_DATABASE = 'test-db-name';
process.env.TWILIO_ACCOUNT_SID = 'test-api-key';
process.env.TWILIO_AUTH_TOKEN = 'test-api-key';
process.env.TWILIO_PHONE_NUMBER = '+18002562938';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test-api-key';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Note: Logger is not mocked globally to allow individual tests to control their own mocking

// Set default test timeout to 10 seconds (prevents hanging tests)
jest.setTimeout(10000);

// Reset fetch mock before each test, but preserve any specific mocks
beforeEach(() => {
  // Don't clear mocks that are specifically set by individual tests
  // This allows tests to override the default behavior when needed

  // Clear all timers to prevent leaks between tests
  jest.clearAllTimers();
});
