import { connectToDatabase } from './db';
import { logger } from './logger';

export type APIType =
  | 'google_places_text_search'
  | 'google_places_nearby_search'
  | 'google_places_details'
  | 'google_geocoding'
  | 'google_address_validation'
  | 'google_maps_load';

interface APIUsageRecord {
  apiType: APIType;
  timestamp: number;
  date: string; // YYYY-MM-DD format
  cached: boolean;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

// Google Places API pricing (as of 2024)
const API_COSTS: Record<APIType, number> = {
  google_places_text_search: 0.032, // $32 per 1000 requests
  google_places_nearby_search: 0.032, // $32 per 1000 requests
  google_places_details: 0.017, // $17 per 1000 requests (Basic Data)
  google_geocoding: 0.005, // $5 per 1000 requests
  google_address_validation: 0.005, // $5 per 1000 requests
  google_maps_load: 0.007, // $7 per 1000 loads
};

/**
 * Track an API usage event
 * @param apiType The type of API call being made
 * @param cached Whether this call was served from cache
 * @param metadata Optional metadata about the API call
 */
export async function trackAPIUsage(
  apiType: APIType,
  cached: boolean = false,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const now = Date.now();
    const date = new Date(now).toISOString().split('T')[0];

    const record: APIUsageRecord = {
      apiType,
      timestamp: now,
      date,
      cached,
      metadata,
    };

    // Only store in database for actual API calls (not cached)
    // This keeps the database size manageable while tracking costs accurately
    if (!cached) {
      const db = await connectToDatabase();
      await db.collection('api_usage').insertOne(record);

      logger.debug(`API usage tracked: ${apiType}`, {
        cached,
        cost: API_COSTS[apiType],
      });
    }
  } catch (error) {
    // Don't throw errors for tracking failures - they shouldn't break the app
    logger.error('Failed to track API usage:', error);
  }
}

/**
 * Get API usage statistics for a date range
 */
export async function getAPIUsageStats(
  startDate: Date,
  endDate: Date = new Date()
) {
  try {
    const db = await connectToDatabase();

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    // Get usage counts by API type
    const usageCounts = await db
      .collection('api_usage')
      .aggregate([
        {
          $match: {
            timestamp: { $gte: startTimestamp, $lte: endTimestamp },
            cached: false, // Only count actual API calls
          },
        },
        {
          $group: {
            _id: '$apiType',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Calculate costs
    const stats = usageCounts.reduce(
      (acc, item) => {
        const apiType = item._id as APIType;
        const count = item.count;
        const cost = (count / 1000) * API_COSTS[apiType];

        acc.totalCalls += count;
        acc.totalCost += cost;
        acc.byType[apiType] = {
          count,
          cost,
          costPerCall: API_COSTS[apiType],
        };

        return acc;
      },
      {
        totalCalls: 0,
        totalCost: 0,
        byType: {} as Record<
          APIType,
          { count: number; cost: number; costPerCall: number }
        >,
      }
    );

    return stats;
  } catch (error) {
    logger.error('Failed to get API usage stats:', error);
    throw error;
  }
}

/**
 * Get cache hit rate statistics
 */
export async function getCacheHitRate(
  startDate: Date,
  endDate: Date = new Date()
) {
  try {
    const db = await connectToDatabase();

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    const [cachedCount, totalCount] = await Promise.all([
      db.collection('api_usage').countDocuments({
        timestamp: { $gte: startTimestamp, $lte: endTimestamp },
        cached: true,
      }),
      db.collection('api_usage').countDocuments({
        timestamp: { $gte: startTimestamp, $lte: endTimestamp },
      }),
    ]);

    const hitRate = totalCount > 0 ? (cachedCount / totalCount) * 100 : 0;

    return {
      cached: cachedCount,
      total: totalCount,
      hitRate: Math.round(hitRate * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    logger.error('Failed to get cache hit rate:', error);
    return {
      cached: 0,
      total: 0,
      hitRate: 0,
    };
  }
}

/**
 * Clean up old API usage records (older than 90 days)
 */
export async function cleanupOldAPIUsage(): Promise<void> {
  try {
    const db = await connectToDatabase();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const result = await db.collection('api_usage').deleteMany({
      timestamp: { $lt: ninetyDaysAgo },
    });

    logger.info(`Cleaned up ${result.deletedCount} old API usage records`);
  } catch (error) {
    logger.error('Failed to cleanup old API usage:', error);
  }
}
