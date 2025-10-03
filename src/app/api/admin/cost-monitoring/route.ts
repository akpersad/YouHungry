import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getCacheStats } from '@/lib/optimized-google-places';

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
  estimatedCosts: {
    daily: number;
    monthly: number;
    savings: number;
  };
}

export async function GET() {
  try {
    const db = await connectToDatabase();

    // Get API usage from logs (you might want to implement proper API usage tracking)
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get cache stats
    const cacheStats = await getCacheStats();

    // Calculate estimated API usage based on restaurant searches
    const restaurantSearches = await db
      .collection('performance_metrics')
      .countDocuments({
        url: { $regex: '/restaurants/search' },
        timestamp: { $gte: startOfDay.getTime() },
      });

    const monthlySearches = await db
      .collection('performance_metrics')
      .countDocuments({
        url: { $regex: '/restaurants/search' },
        timestamp: { $gte: startOfMonth.getTime() },
      });

    // Estimate API calls based on search patterns
    // Each search typically involves: 1 geocoding + 1 text/nearby search + N place details
    const estimatedGeocodingCalls = Math.floor(restaurantSearches * 0.8); // 80% need geocoding
    const estimatedSearchCalls = restaurantSearches;
    const estimatedDetailsCalls = Math.floor(restaurantSearches * 2.5); // Average 2.5 details per search

    const monthlyGeocodingCalls = Math.floor(monthlySearches * 0.8);
    const monthlySearchCalls = monthlySearches;
    const monthlyDetailsCalls = Math.floor(monthlySearches * 2.5);

    // Google Places API pricing (as of 2024)
    const GOOGLE_PLACES_PRICING = {
      textSearch: 0.032, // $32 per 1000 requests
      nearbySearch: 0.032,
      placeDetails: 0.017, // $17 per 1000 requests
      geocoding: 0.005, // $5 per 1000 requests
      addressValidation: 0.005,
    };

    // const GOOGLE_MAPS_PRICING = {
    //   mapsLoads: 0.007, // $7 per 1000 loads
    // };

    // Calculate costs
    const dailyCosts = {
      geocoding:
        (estimatedGeocodingCalls / 1000) * GOOGLE_PLACES_PRICING.geocoding,
      textSearch:
        (estimatedSearchCalls / 1000) * GOOGLE_PLACES_PRICING.textSearch,
      placeDetails:
        (estimatedDetailsCalls / 1000) * GOOGLE_PLACES_PRICING.placeDetails,
    };

    const monthlyCosts = {
      geocoding:
        (monthlyGeocodingCalls / 1000) * GOOGLE_PLACES_PRICING.geocoding,
      textSearch:
        (monthlySearchCalls / 1000) * GOOGLE_PLACES_PRICING.textSearch,
      placeDetails:
        (monthlyDetailsCalls / 1000) * GOOGLE_PLACES_PRICING.placeDetails,
    };

    const dailyTotal = Object.values(dailyCosts).reduce(
      (sum, cost) => sum + cost,
      0
    );
    const monthlyTotal = Object.values(monthlyCosts).reduce(
      (sum, cost) => sum + cost,
      0
    );

    // Calculate savings from caching (assuming 70% cache hit rate)
    const cacheSavingsRate = cacheStats.hitRate / 100;
    // const dailySavings = dailyTotal * cacheSavingsRate;
    const monthlySavings = monthlyTotal * cacheSavingsRate;

    const metrics: APICostMetrics = {
      googlePlaces: {
        textSearch: estimatedSearchCalls,
        nearbySearch: Math.floor(restaurantSearches * 0.3), // Estimate 30% nearby searches
        placeDetails: estimatedDetailsCalls,
        geocoding: estimatedGeocodingCalls,
        addressValidation: Math.floor(restaurantSearches * 0.1), // Estimate 10% need validation
      },
      googleMaps: {
        mapsLoads: Math.floor(restaurantSearches * 0.2), // Estimate 20% load maps
      },
      cache: {
        hitRate: cacheStats.hitRate,
        totalHits: cacheStats.totalHits,
        memoryEntries: cacheStats.memoryEntries,
      },
      estimatedCosts: {
        daily: dailyTotal,
        monthly: monthlyTotal,
        savings: monthlySavings,
      },
    };

    logger.debug('API cost monitoring data:', {
      restaurantSearches,
      monthlySearches,
      cacheStats,
      dailyCosts,
      monthlyCosts,
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

  return recommendations;
}
