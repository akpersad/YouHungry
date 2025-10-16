/**
 * Client-side request throttling and deduplication utilities
 * Helps prevent excessive API calls and reduces server load
 */

interface ThrottleOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (url: string, options?: RequestInit) => string;
}

interface RequestCache {
  [key: string]: {
    promise: Promise<Response>;
    timestamp: number;
    ttl: number;
  };
}

class RequestThrottler {
  private requestCounts: Map<string, number> = new Map();
  private requestCache: RequestCache = {};
  private options: ThrottleOptions;

  constructor(options: ThrottleOptions) {
    this.options = options;

    // Clean up expired cache entries every minute
    setInterval(() => {
      this.cleanupCache();
    }, 60000);
  }

  private cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.requestCache).forEach((key) => {
      const entry = this.requestCache[key];
      if (now - entry.timestamp > entry.ttl) {
        delete this.requestCache[key];
      }
    });
  }

  private getKey(url: string, options?: RequestInit): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(url, options);
    }

    // Default key generation: URL + method + body hash
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isThrottled(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Clean up old entries
    for (const [k] of this.requestCounts.entries()) {
      if (
        k.startsWith(key.split(':')[0]) &&
        parseInt(k.split(':')[1]) < windowStart
      ) {
        this.requestCounts.delete(k);
      }
    }

    // Count requests in current window
    const currentWindowKey = `${key}:${Math.floor(now / this.options.windowMs)}`;
    const currentCount = this.requestCounts.get(currentWindowKey) || 0;

    return currentCount >= this.options.maxRequests;
  }

  private recordRequest(key: string): void {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / this.options.windowMs)}`;
    const currentCount = this.requestCounts.get(windowKey) || 0;
    this.requestCounts.set(windowKey, currentCount + 1);
  }

  async throttleRequest(url: string, options?: RequestInit): Promise<Response> {
    const key = this.getKey(url, options);

    // Check if request is cached and still valid
    const cached = this.requestCache[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.promise;
    }

    // Check if request should be throttled
    if (this.isThrottled(key)) {
      throw new Error(`Request throttled: too many requests to ${url}`);
    }

    // Record the request
    this.recordRequest(key);

    // Create and cache the promise
    const promise = fetch(url, options);
    this.requestCache[key] = {
      promise,
      timestamp: Date.now(),
      ttl: 30000, // 30 second cache TTL
    };

    return promise;
  }
}

// Global throttler instance
const globalThrottler = new RequestThrottler({
  maxRequests: 10, // Max 10 requests per window
  windowMs: 60000, // Per minute
});

/**
 * Throttled fetch wrapper that prevents excessive API calls
 */
export async function throttledFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return globalThrottler.throttleRequest(url, options);
}

/**
 * Hook for throttled API calls with React Query
 */
export function useThrottledQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
    refetchIntervalInBackground?: boolean;
  }
) {
  const throttledQueryFn = async (): Promise<T> => {
    // Create a unique URL for this query
    const url = `/api/throttled-query/${queryKey.join('/')}`;

    try {
      const response = await throttledFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryKey, queryFn: queryFn.toString() }),
      });

      if (!response.ok) {
        throw new Error(`Throttled query failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // If throttled, fall back to direct query function
      if (error instanceof Error && error.message.includes('throttled')) {
        console.warn('Query throttled, using cached data or direct call');
        return queryFn();
      }
      throw error;
    }
  };

  return {
    queryKey,
    queryFn: throttledQueryFn,
    ...options,
  };
}

/**
 * Request deduplication utility
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<Response>> = new Map();

  async deduplicateRequest(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const key = `${options?.method || 'GET'}:${url}:${options?.body || ''}`;

    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const promise = fetch(url, options).finally(() => {
      // Clean up when request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

const globalDeduplicator = new RequestDeduplicator();

/**
 * Deduplicated fetch wrapper
 */
export async function deduplicatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return globalDeduplicator.deduplicateRequest(url, options);
}

/**
 * Combined throttled and deduplicated fetch
 */
export async function smartFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // First deduplicate, then throttle
  const deduplicatedPromise = globalDeduplicator.deduplicateRequest(
    url,
    options
  );

  // Wrap in throttling
  const key = `${options?.method || 'GET'}:${url}:${options?.body || ''}`;
  if (globalThrottler['isThrottled'](key)) {
    throw new Error(`Request throttled: too many requests to ${url}`);
  }

  globalThrottler['recordRequest'](key);
  return deduplicatedPromise;
}
