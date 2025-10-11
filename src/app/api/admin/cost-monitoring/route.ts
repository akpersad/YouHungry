import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getAPIUsageStats } from '@/lib/api-usage-tracker';
import { getCacheStats } from '@/lib/optimized-google-places';
import { getLocationCacheStats } from '@/lib/google-places';

interface APICostMetrics {
  googlePlaces: {
    textSearch: number;
    nearbySearch: number;
    placeDetails: number;
    geocoding: number;
    addressValidation: number;
  };
  googleMaps: {
    mapsLoads: number;
  };
  cache: {
    hitRate: number;
    totalHits: number;
    memoryEntries: number;
  };
  locationCache: {
    totalEntries: number;
    locationOnlyEntries: number;
    locationQueryEntries: number;
    averageRestaurantsPerEntry: number;
    estimatedSizeKB: number;
    oldestEntry?: string;
    newestEntry?: string;
  };
  estimatedCosts: {
    daily: number;
    monthly: number;
    savings: number;
  };
}

export async function GET() {
  try {
    // Get date ranges
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get actual API usage statistics
    const [dailyStats, monthlyStats, cacheStats, locationCacheStats] =
      await Promise.all([
        getAPIUsageStats(startOfDay, today),
        getAPIUsageStats(startOfMonth, today),
        getCacheStats(),
        getLocationCacheStats(),
      ]);

    // Extract call counts by type
    const dailyUsage = {
      textSearch: dailyStats.byType.google_places_text_search?.count || 0,
      nearbySearch: dailyStats.byType.google_places_nearby_search?.count || 0,
      placeDetails: dailyStats.byType.google_places_details?.count || 0,
      geocoding: dailyStats.byType.google_geocoding?.count || 0,
      addressValidation:
        dailyStats.byType.google_address_validation?.count || 0,
      mapsLoads: dailyStats.byType.google_maps_load?.count || 0,
    };

    const monthlyUsage = {
      textSearch: monthlyStats.byType.google_places_text_search?.count || 0,
      nearbySearch: monthlyStats.byType.google_places_nearby_search?.count || 0,
      placeDetails: monthlyStats.byType.google_places_details?.count || 0,
      geocoding: monthlyStats.byType.google_geocoding?.count || 0,
      addressValidation:
        monthlyStats.byType.google_address_validation?.count || 0,
      mapsLoads: monthlyStats.byType.google_maps_load?.count || 0,
    };

    // Calculate total costs (already calculated by getAPIUsageStats)
    const dailyTotal = dailyStats.totalCost;
    const monthlyTotal = monthlyStats.totalCost;

    // Calculate potential savings from caching
    // This is an estimate based on cache hit rate
    // If we had 70% cache hit rate, we would have made 70% more API calls without caching
    const cacheSavingsRate = cacheStats.hitRate / 100;
    const potentialAdditionalCalls =
      monthlyStats.totalCalls / (1 - cacheSavingsRate) -
      monthlyStats.totalCalls;
    const monthlySavings =
      (potentialAdditionalCalls / monthlyStats.totalCalls) * monthlyTotal;

    const metrics: APICostMetrics = {
      googlePlaces: {
        textSearch: monthlyUsage.textSearch,
        nearbySearch: monthlyUsage.nearbySearch,
        placeDetails: monthlyUsage.placeDetails,
        geocoding: monthlyUsage.geocoding,
        addressValidation: monthlyUsage.addressValidation,
      },
      googleMaps: {
        mapsLoads: monthlyUsage.mapsLoads,
      },
      cache: {
        hitRate: cacheStats.hitRate,
        totalHits: cacheStats.totalHits,
        memoryEntries: cacheStats.memoryEntries,
      },
      locationCache: {
        totalEntries: locationCacheStats.totalEntries,
        locationOnlyEntries: locationCacheStats.locationOnlyEntries,
        locationQueryEntries: locationCacheStats.locationQueryEntries,
        averageRestaurantsPerEntry:
          locationCacheStats.averageRestaurantsPerEntry,
        estimatedSizeKB: locationCacheStats.estimatedSizeKB,
        oldestEntry: locationCacheStats.oldestEntry?.toISOString(),
        newestEntry: locationCacheStats.newestEntry?.toISOString(),
      },
      estimatedCosts: {
        daily: dailyTotal,
        monthly: monthlyTotal,
        savings: isFinite(monthlySavings) ? monthlySavings : 0,
      },
    };

    logger.debug('API cost monitoring data:', {
      dailyUsage,
      monthlyUsage,
      cacheStats,
      locationCacheStats,
      dailyTotal,
      monthlyTotal,
      monthlySavings,
    });

    return NextResponse.json({
      success: true,
      metrics,
      recommendations: generateCostRecommendations(metrics),
    });
  } catch (error) {
    logger.error('Error fetching cost monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost monitoring data' },
      { status: 500 }
    );
  }
}

function generateCostRecommendations(metrics: APICostMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.cache.hitRate < 70) {
    recommendations.push(
      'Cache hit rate is below 70%. Consider increasing cache TTL or implementing more aggressive caching.'
    );
  }

  if (metrics.estimatedCosts.monthly > 100) {
    recommendations.push(
      'Monthly API costs exceed $100. Consider implementing request batching or reducing API call frequency.'
    );
  }

  if (metrics.googlePlaces.placeDetails > metrics.googlePlaces.textSearch * 2) {
    recommendations.push(
      'High place details usage detected. Consider implementing batch place details fetching.'
    );
  }

  if (metrics.googlePlaces.geocoding > metrics.googlePlaces.textSearch * 0.9) {
    recommendations.push(
      'High geocoding usage detected. Consider implementing address normalization to reduce duplicate geocoding calls.'
    );
  }

  if (metrics.cache.memoryEntries > 500) {
    recommendations.push(
      'High memory cache usage. Consider implementing cache eviction policies or increasing database cache usage.'
    );
  }

  // Location cache recommendations
  if (metrics.locationCache.totalEntries > 100) {
    recommendations.push(
      `Location cache has ${metrics.locationCache.totalEntries} entries (~${metrics.locationCache.estimatedSizeKB}KB). Consider running cleanup to remove expired entries.`
    );
  }

  if (metrics.locationCache.estimatedSizeKB > 5000) {
    recommendations.push(
      'Location cache size is over 5MB. Consider implementing more aggressive eviction policies or reducing cache TTL.'
    );
  }

  if (
    metrics.locationCache.locationQueryEntries >
    metrics.locationCache.locationOnlyEntries * 2
  ) {
    recommendations.push(
      'High number of location+query cache entries. Consider consolidating similar queries to improve cache hit rates.'
    );
  }

  return recommendations;
}
