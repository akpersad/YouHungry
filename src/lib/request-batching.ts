import { logger } from '@/lib/logger';

// Request batching system to reduce API calls by grouping similar requests
// This is particularly useful for Google Places API where we can batch place details requests

interface BatchRequest<T, R> {
  id: string;
  params: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // Maximum time to wait before processing batch
  maxAge: number; // Maximum age of requests in batch
}

class RequestBatcher<T, R> {
  private pendingRequests = new Map<string, BatchRequest<T, R>>();
  private config: BatchConfig;
  private processing = false;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize || 10,
      maxWaitTime: config.maxWaitTime || 100, // 100ms
      maxAge: config.maxAge || 1000, // 1 second
    };
  }

  async addRequest(id: string, params: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest<T, R> = {
        id,
        params,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.pendingRequests.set(id, request);

      // Process batch if we've reached max size
      if (this.pendingRequests.size >= this.config.maxBatchSize) {
        this.processBatch();
      } else if (!this.processing) {
        // Set timeout to process batch after maxWaitTime
        setTimeout(() => {
          if (this.pendingRequests.size > 0) {
            this.processBatch();
          }
        }, this.config.maxWaitTime);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.pendingRequests.size === 0) {
      return;
    }

    this.processing = true;

    try {
      // Get all pending requests
      const requests = Array.from(this.pendingRequests.values());
      this.pendingRequests.clear();

      // Filter out expired requests
      const now = Date.now();
      const validRequests = requests.filter(
        (req) => now - req.timestamp < this.config.maxAge
      );

      if (validRequests.length === 0) {
        this.processing = false;
        return;
      }

      logger.debug(`Processing batch of ${validRequests.length} requests`);

      // Process the batch
      const results = await this.processBatchRequests(validRequests);

      // Resolve all requests
      validRequests.forEach((request, index) => {
        if (results[index]) {
          request.resolve(results[index]);
        } else {
          request.reject(new Error('Batch processing failed'));
        }
      });
    } catch (error) {
      // Reject all pending requests
      const requests = Array.from(this.pendingRequests.values());
      this.pendingRequests.clear();

      requests.forEach((request) => {
        request.reject(
          error instanceof Error ? error : new Error('Unknown error')
        );
      });
    } finally {
      this.processing = false;
    }
  }

  protected async processBatchRequests(
    requests: BatchRequest<T, R>[]
  ): Promise<R[]> {
    // This method should be implemented by subclasses
    // The requests parameter is required by the interface but not used in the base implementation
    void requests; // Mark as intentionally unused
    throw new Error('processBatchRequests must be implemented by subclass');
  }

  getStats(): {
    pendingRequests: number;
    processing: boolean;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      processing: this.processing,
    };
  }
}

// Google Places Details Batcher
interface GooglePlacesResponse {
  results?: unknown[];
  status: string;
  error_message?: string;
}

class GooglePlacesDetailsBatcher extends RequestBatcher<
  string,
  GooglePlacesResponse
> {
  constructor() {
    super({
      maxBatchSize: 20, // Google Places allows up to 20 place IDs per request
      maxWaitTime: 200, // Wait up to 200ms to batch requests
      maxAge: 2000, // Max 2 seconds age
    });
  }

  protected async processBatchRequests(
    requests: BatchRequest<string, GooglePlacesResponse>[]
  ): Promise<GooglePlacesResponse[]> {
    const placeIds = requests.map((req) => req.params);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Google Places API doesn't support true batching, but we can make parallel requests
    // This reduces the overhead of multiple individual requests
    const promises = placeIds.map(async (placeId) => {
      const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
      const params = new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        fields:
          'place_id,name,formatted_address,geometry,types,rating,price_level,photos,formatted_phone_number,website,opening_hours',
      });

      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      return response.json();
    });

    return Promise.all(promises);
  }
}

// Geocoding Batcher (for multiple addresses)
interface GeocodingResponse {
  results?: unknown[];
  status: string;
  error_message?: string;
}

class GeocodingBatcher extends RequestBatcher<string, GeocodingResponse> {
  constructor() {
    super({
      maxBatchSize: 10,
      maxWaitTime: 150,
      maxAge: 1500,
    });
  }

  protected async processBatchRequests(
    requests: BatchRequest<string, GeocodingResponse>[]
  ): Promise<GeocodingResponse[]> {
    const addresses = requests.map((req) => req.params);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Process addresses in parallel
    const promises = addresses.map(async (address) => {
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
    });

    return Promise.all(promises);
  }
}

// Restaurant Search Batcher (for multiple search queries)
interface RestaurantSearchResponse {
  results?: unknown[];
  status: string;
  error_message?: string;
}

class RestaurantSearchBatcher extends RequestBatcher<
  { query: string; location?: string; radius?: number },
  RestaurantSearchResponse
> {
  constructor() {
    super({
      maxBatchSize: 5, // Smaller batch size for search requests
      maxWaitTime: 100,
      maxAge: 1000,
    });
  }

  protected async processBatchRequests(
    requests: BatchRequest<
      { query: string; location?: string; radius?: number },
      RestaurantSearchResponse
    >[]
  ): Promise<RestaurantSearchResponse[]> {
    const searchParams = requests.map((req) => req.params);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Process searches in parallel
    const promises = searchParams.map(async (params) => {
      const baseUrl =
        'https://maps.googleapis.com/maps/api/place/textsearch/json';
      const urlParams = new URLSearchParams({
        query: params.query,
        key: apiKey,
        type: 'restaurant',
      });

      if (params.location) {
        urlParams.append('location', params.location);
      }
      if (params.radius) {
        urlParams.append('radius', params.radius.toString());
      }

      const response = await fetch(`${baseUrl}?${urlParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      return response.json();
    });

    return Promise.all(promises);
  }
}

// Singleton instances
export const googlePlacesDetailsBatcher = new GooglePlacesDetailsBatcher();
export const geocodingBatcher = new GeocodingBatcher();
export const restaurantSearchBatcher = new RestaurantSearchBatcher();

// Convenience functions
export async function batchGetPlaceDetails(
  placeId: string
): Promise<GooglePlacesResponse> {
  return googlePlacesDetailsBatcher.addRequest(placeId, placeId);
}

export async function batchGeocodeAddress(
  address: string
): Promise<GeocodingResponse> {
  return geocodingBatcher.addRequest(address, address);
}

export async function batchSearchRestaurants(
  query: string,
  location?: string,
  radius?: number
): Promise<RestaurantSearchResponse> {
  const key = `${query}:${location || ''}:${radius || ''}`;
  return restaurantSearchBatcher.addRequest(key, { query, location, radius });
}

// Batch manager for monitoring
class BatchManager {
  private batchers = new Map<
    string,
    { getStats(): { pendingRequests: number; processing: boolean } }
  >();

  constructor() {
    this.batchers.set('google-places-details', googlePlacesDetailsBatcher);
    this.batchers.set('geocoding', geocodingBatcher);
    this.batchers.set('restaurant-search', restaurantSearchBatcher);
  }

  getAllStats(): Record<
    string,
    { pendingRequests: number; processing: boolean }
  > {
    const stats: Record<
      string,
      { pendingRequests: number; processing: boolean }
    > = {};
    for (const [name, batcher] of this.batchers) {
      stats[name] = batcher.getStats();
    }
    return stats;
  }
}

export const batchManager = new BatchManager();

// Export for monitoring
export async function getBatchingStats() {
  return batchManager.getAllStats();
}
