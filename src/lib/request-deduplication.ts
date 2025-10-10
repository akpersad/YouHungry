import { logger } from '@/lib/logger';

// Request deduplication system to prevent duplicate API calls
// This reduces costs by ensuring identical requests don't execute multiple times

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface RequestOptions {
  ttl?: number; // Time to live in milliseconds (default: 5000ms)
  maxAge?: number; // Maximum age for cached results (default: 30000ms)
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<unknown>>();
  private completedRequests = new Map<
    string,
    { result: unknown; timestamp: number }
  >();
  private defaultTtl = 5000; // 5 seconds
  private defaultMaxAge = 30000; // 30 seconds

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const ttl = options.ttl || this.defaultTtl;
    const maxAge = options.maxAge || this.defaultMaxAge;

    // Check if we have a completed request within maxAge
    const completed = this.completedRequests.get(key);
    if (completed && Date.now() - completed.timestamp < maxAge) {
      logger.debug(`Request deduplication: serving cached result for ${key}`);
      return completed.result as T;
    }

    // Check if there's already a pending request
    const pending = this.pendingRequests.get(key);
    if (pending && Date.now() - pending.timestamp < ttl) {
      logger.debug(`Request deduplication: waiting for pending request ${key}`);
      return pending.promise as Promise<T>;
    }

    // Create new request
    const promise = this.executeRequest(key, requestFn, ttl, maxAge);
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise as Promise<T>;
  }

  private async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number,
    maxAge: number
  ): Promise<T> {
    try {
      logger.debug(`Request deduplication: executing new request ${key}`);
      const result = await requestFn();

      // Store completed result
      this.completedRequests.set(key, {
        result,
        timestamp: Date.now(),
      });

      // Clean up pending request
      this.pendingRequests.delete(key);

      // Clean up old completed requests
      this.cleanupCompletedRequests(maxAge);

      return result;
    } catch (error) {
      // Remove failed request from pending
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  private cleanupCompletedRequests(maxAge: number): void {
    const now = Date.now();
    for (const [key, request] of this.completedRequests.entries()) {
      if (now - request.timestamp > maxAge) {
        this.completedRequests.delete(key);
      }
    }
  }

  // Clean up expired pending requests
  cleanupPendingRequests(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.defaultTtl) {
        this.pendingRequests.delete(key);
        logger.debug(
          `Request deduplication: cleaned up expired pending request ${key}`
        );
      }
    }
  }

  // Get statistics
  getStats(): {
    pendingRequests: number;
    completedRequests: number;
    memoryUsage: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      completedRequests: this.completedRequests.size,
      memoryUsage: this.pendingRequests.size + this.completedRequests.size,
    };
  }

  // Clear all requests (useful for testing or memory management)
  clear(): void {
    this.pendingRequests.clear();
    this.completedRequests.clear();
    logger.debug('Request deduplication: cleared all requests');
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Helper function to generate cache keys
export function generateRequestKey(
  endpoint: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `${endpoint}:${sortedParams}`;
}

// Higher-order function to wrap API calls with deduplication
export function withDeduplication<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  options?: RequestOptions
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    return requestDeduplicator.deduplicate(key, () => fn(...args), options);
  };
}

// Specific deduplication wrappers for common API patterns
export const deduplicatedFetch = withDeduplication(
  async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  (url: string, options?: RequestInit) => {
    const optionsKey = options ? JSON.stringify(options) : '';
    return `fetch:${url}:${optionsKey}`;
  },
  { ttl: 3000, maxAge: 15000 } // 3s dedup, 15s cache
);

// Google Places API deduplication
export const deduplicatedGooglePlacesSearch = withDeduplication(
  async (query: string, location?: string, radius?: number) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const baseUrl =
      'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const params = new URLSearchParams({
      query,
      key: apiKey,
      type: 'restaurant',
    });

    if (location) {
      params.append('location', location);
    }
    if (radius) {
      params.append('radius', radius.toString());
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    return response.json();
  },
  (query: string, location?: string, radius?: number) => {
    return `google-places-search:${query}:${location || ''}:${radius || ''}`;
  },
  { ttl: 5000, maxAge: 30000 } // 5s dedup, 30s cache
);

// Geocoding deduplication
export const deduplicatedGeocoding = withDeduplication(
  async (address: string) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = new URLSearchParams({
      address,
      key: apiKey,
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    return response.json();
  },
  (address: string) => `geocoding:${address.toLowerCase().trim()}`,
  { ttl: 3000, maxAge: 300000 } // 3s dedup, 5min cache (addresses don't change often)
);

// Cleanup expired requests periodically (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    requestDeduplicator.cleanupPendingRequests();
  }, 60000); // Every minute
}

// Export for monitoring
export async function getDeduplicationStats() {
  return requestDeduplicator.getStats();
}
