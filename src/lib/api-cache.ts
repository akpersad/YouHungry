import { logger } from '@/lib/logger';
import { connectToDatabase } from './db';

interface CacheEntry<T> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  hits: number;
  lastAccessed: Date;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  staleWhileRevalidate: boolean; // Serve stale data while revalidating
}

// Cache configurations for different data types
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  restaurant_search: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxSize: 1000,
    staleWhileRevalidate: true,
  },
  restaurant_details: {
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxSize: 5000,
    staleWhileRevalidate: true,
  },
  geocoding: {
    ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
    maxSize: 2000,
    staleWhileRevalidate: false,
  },
  address_validation: {
    ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
    maxSize: 1000,
    staleWhileRevalidate: false,
  },
};

class APICache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private configs = CACHE_CONFIGS;

  async get<T>(key: string, cacheType: string): Promise<T | null> {
    const config = this.configs[cacheType];
    if (!config) {
      logger.warn(`Unknown cache type: ${cacheType}`);
      return null;
    }

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiresAt > new Date()) {
      memoryEntry.hits++;
      memoryEntry.lastAccessed = new Date();
      logger.debug(`Cache hit (memory): ${key}`);
      return memoryEntry.data as T;
    }

    // Check database cache
    try {
      const db = await connectToDatabase();
      const dbEntry = await db.collection('api_cache').findOne({
        key,
        cacheType,
        expiresAt: { $gt: new Date() },
      });

      if (dbEntry) {
        // Update access stats
        await db.collection('api_cache').updateOne(
          { key },
          {
            $inc: { hits: 1 },
            $set: { lastAccessed: new Date() },
          }
        );

        // Store in memory cache for faster access
        this.memoryCache.set(key, {
          data: dbEntry.data,
          cachedAt: dbEntry.cachedAt,
          expiresAt: dbEntry.expiresAt,
          hits: dbEntry.hits + 1,
          lastAccessed: new Date(),
        });

        logger.debug(`Cache hit (database): ${key}`);
        return dbEntry.data as T;
      }
    } catch (error) {
      logger.error('Error reading from database cache:', error);
    }

    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  async set<T>(
    key: string,
    data: T,
    cacheType: string,
    customTtl?: number
  ): Promise<void> {
    const config = this.configs[cacheType];
    if (!config) {
      logger.warn(`Unknown cache type: ${cacheType}`);
      return;
    }

    const ttl = customTtl || config.ttl;
    const cachedAt = new Date();
    const expiresAt = new Date(cachedAt.getTime() + ttl);

    const entry: CacheEntry<T> = {
      data,
      cachedAt,
      expiresAt,
      hits: 0,
      lastAccessed: cachedAt,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in database cache
    try {
      const db = await connectToDatabase();
      await db.collection('api_cache').replaceOne(
        { key, cacheType },
        {
          key,
          cacheType,
          data,
          cachedAt,
          expiresAt,
          hits: 0,
          lastAccessed: cachedAt,
        },
        { upsert: true }
      );

      logger.debug(`Cached data: ${key} (expires: ${expiresAt.toISOString()})`);
    } catch (error) {
      logger.error('Error writing to database cache:', error);
    }

    // Clean up memory cache if it gets too large
    this.cleanupMemoryCache();
  }

  async getStale<T>(key: string, cacheType: string): Promise<T | null> {
    const config = this.configs[cacheType];
    if (!config || !config.staleWhileRevalidate) {
      return null;
    }

    try {
      const db = await connectToDatabase();
      const dbEntry = await db.collection('api_cache').findOne({
        key,
        cacheType,
      });

      if (dbEntry) {
        logger.debug(`Serving stale data: ${key}`);
        return dbEntry.data as T;
      }
    } catch (error) {
      logger.error('Error reading stale data:', error);
    }

    return null;
  }

  private cleanupMemoryCache(): void {
    if (this.memoryCache.size > 100) {
      // Remove least recently used entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort(
        (a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime()
      );

      const toRemove = entries.slice(0, Math.floor(entries.length * 0.2));
      toRemove.forEach(([key]) => this.memoryCache.delete(key));

      logger.debug(`Cleaned up ${toRemove.length} memory cache entries`);
    }
  }

  async cleanupExpired(): Promise<void> {
    try {
      const db = await connectToDatabase();
      const result = await db.collection('api_cache').deleteMany({
        expiresAt: { $lt: new Date() },
      });

      if (result.deletedCount > 0) {
        logger.debug(`Cleaned up ${result.deletedCount} expired cache entries`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired cache:', error);
    }
  }

  async getStats(): Promise<{
    memoryEntries: number;
    totalHits: number;
    hitRate: number;
  }> {
    try {
      const db = await connectToDatabase();
      const stats = await db
        .collection('api_cache')
        .aggregate([
          {
            $group: {
              _id: null,
              totalHits: { $sum: '$hits' },
              totalEntries: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const totalHits = stats[0]?.totalHits || 0;
      const totalEntries = stats[0]?.totalEntries || 0;
      const hitRate = totalEntries > 0 ? (totalHits / totalEntries) * 100 : 0;

      return {
        memoryEntries: this.memoryCache.size,
        totalHits,
        hitRate: Math.round(hitRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        memoryEntries: this.memoryCache.size,
        totalHits: 0,
        hitRate: 0,
      };
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

// Helper functions for common cache operations
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

export async function withCache<T>(
  key: string,
  cacheType: string,
  fetchFn: () => Promise<T>,
  options?: { ttl?: number; staleWhileRevalidate?: boolean }
): Promise<T> {
  // Try to get from cache first
  const cached = await apiCache.get<T>(key, cacheType);
  if (cached) {
    return cached;
  }

  try {
    // Fetch fresh data
    const data = await fetchFn();
    await apiCache.set(key, data, cacheType, options?.ttl);
    return data;
  } catch (error) {
    // If fetch fails and we have stale data, return it
    if (options?.staleWhileRevalidate) {
      const stale = await apiCache.getStale<T>(key, cacheType);
      if (stale) {
        logger.warn(`Using stale data due to fetch error: ${key}`, error);
        return stale;
      }
    }
    throw error;
  }
}

// Cleanup expired entries periodically
setInterval(
  () => {
    apiCache.cleanupExpired();
  },
  60 * 60 * 1000
); // Every hour
