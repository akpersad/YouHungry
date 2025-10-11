import { connectToDatabase } from './db';
import { logger } from './logger';

export type APIType =
  // Google APIs
  | 'google_places_text_search'
  | 'google_places_nearby_search'
  | 'google_places_details'
  | 'google_geocoding'
  | 'google_address_validation'
  | 'google_maps_load'
  // Authentication
  | 'clerk_user_create'
  | 'clerk_user_update'
  | 'clerk_user_read'
  // Storage
  | 'vercel_blob_put'
  | 'vercel_blob_delete'
  | 'vercel_blob_read'
  // Messaging
  | 'twilio_sms_sent'
  | 'resend_email_sent';

interface APIUsageRecord {
  apiType: APIType;
  timestamp: number;
  date: string; // YYYY-MM-DD format
  cached: boolean;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

// API pricing (as of 2024)
// Note: Some services have free tiers, these are costs beyond free tier
const API_COSTS: Record<APIType, number> = {
  // Google Places API (per 1000 requests)
  google_places_text_search: 0.032, // $32 per 1000 requests
  google_places_nearby_search: 0.032, // $32 per 1000 requests
  google_places_details: 0.017, // $17 per 1000 requests (Basic Data)
  google_geocoding: 0.005, // $5 per 1000 requests
  google_address_validation: 0.005, // $5 per 1000 requests
  google_maps_load: 0.007, // $7 per 1000 loads

  // Clerk Authentication (per user action, after 10k MAU free tier)
  clerk_user_create: 0.0025, // ~$0.0025 per user create (estimated)
  clerk_user_update: 0.0001, // Minimal cost, mostly free
  clerk_user_read: 0.0, // Free within MAU limits

  // Vercel Blob Storage (per 1000 operations)
  vercel_blob_put: 0.0005, // $0.50 per 1000 uploads (estimated based on bandwidth)
  vercel_blob_delete: 0.0, // Free
  vercel_blob_read: 0.0001, // $0.10 per 1000 reads (estimated based on bandwidth)

  // Twilio SMS (per individual message)
  twilio_sms_sent: 0.0079, // $0.0079 per SMS in US

  // Resend Email (per individual email, after 100/day free tier)
  resend_email_sent: 0.001, // $0.001 per email ($1 per 1000 emails)
};

// Define which APIs are priced per individual unit (vs per 1000)
const PER_UNIT_APIS: Set<APIType> = new Set([
  'twilio_sms_sent',
  'resend_email_sent',
  'clerk_user_create',
  'clerk_user_update',
  'clerk_user_read',
]);

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

        // Calculate cost based on pricing model
        // Some APIs are priced per unit, others per 1000 units
        const cost = PER_UNIT_APIS.has(apiType)
          ? count * API_COSTS[apiType] // Per-unit pricing
          : (count / 1000) * API_COSTS[apiType]; // Per-1000 pricing

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
 * Get all available years that have API usage data
 */
export async function getAvailableDataYears(): Promise<number[]> {
  try {
    const db = await connectToDatabase();

    // Get distinct years from the date field
    const dates = await db.collection('api_usage').distinct('date');

    // Extract unique years and sort descending
    const years = Array.from(
      new Set(
        dates.map((date: string) => {
          const year = parseInt(date.split('-')[0], 10);
          return year;
        })
      )
    ).sort((a, b) => b - a);

    // If no data, return current year
    if (years.length === 0) {
      return [new Date().getFullYear()];
    }

    return years as number[];
  } catch (error) {
    logger.error('Failed to get available data years:', error);
    return [new Date().getFullYear()];
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
