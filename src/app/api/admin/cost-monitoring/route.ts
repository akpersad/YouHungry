import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import {
  getAPIUsageStats,
  getAvailableDataYears,
} from '@/lib/api-usage-tracker';
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
  clerk: {
    userCreate: number;
    userUpdate: number;
    userRead: number;
    estimatedMAU: number;
  };
  vercelBlob: {
    uploads: number;
    deletes: number;
    reads: number;
    estimatedStorageGB: number;
  };
  twilio: {
    smsSent: number;
    verifySent: number;
  };
  resend: {
    emailsSent: number;
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
    byService: {
      google: number;
      clerk: number;
      vercelBlob: number;
      twilio: number;
      resend: number;
    };
  };
}

export async function GET(request: Request) {
  try {
    // Check for internal API call (from metrics collector or cron jobs)
    const internalSecret = request.headers.get('x-internal-call');
    const isInternalCall =
      internalSecret && internalSecret === process.env.INTERNAL_API_SECRET;

    // For internal calls, bypass authentication
    // For external calls, authentication is handled by middleware
    if (!isInternalCall) {
      // External call - middleware will handle auth
      // We're allowing it through for now, but middleware should protect /api/admin/*
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    // Get date ranges
    const today = new Date();
    let targetMonth: number;
    let targetYear: number;

    if (monthParam && yearParam) {
      targetMonth = parseInt(monthParam, 10) - 1; // Convert to 0-11
      targetYear = parseInt(yearParam, 10);
    } else {
      targetMonth = today.getMonth();
      targetYear = today.getFullYear();
    }

    // Calculate start and end of the selected month
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(
      targetYear,
      targetMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    // For daily stats, use today if it's the current month, otherwise use last day of selected month
    const isCurrentMonth =
      targetMonth === today.getMonth() && targetYear === today.getFullYear();
    const endOfDay = isCurrentMonth ? today : endOfMonth;
    const startOfDay = new Date(
      endOfDay.getFullYear(),
      endOfDay.getMonth(),
      endOfDay.getDate()
    );

    // Get actual API usage statistics
    const [
      dailyStats,
      monthlyStats,
      cacheStats,
      locationCacheStats,
      availableYears,
    ] = await Promise.all([
      getAPIUsageStats(startOfDay, endOfDay),
      getAPIUsageStats(startOfMonth, endOfMonth),
      getCacheStats(),
      getLocationCacheStats(),
      getAvailableDataYears(),
    ]);

    // Extract call counts by type
    const dailyUsage = {
      // Google APIs
      textSearch: dailyStats.byType.google_places_text_search?.count || 0,
      nearbySearch: dailyStats.byType.google_places_nearby_search?.count || 0,
      placeDetails: dailyStats.byType.google_places_details?.count || 0,
      geocoding: dailyStats.byType.google_geocoding?.count || 0,
      addressValidation:
        dailyStats.byType.google_address_validation?.count || 0,
      mapsLoads: dailyStats.byType.google_maps_load?.count || 0,
      // Clerk
      clerkUserCreate: dailyStats.byType.clerk_user_create?.count || 0,
      clerkUserUpdate: dailyStats.byType.clerk_user_update?.count || 0,
      clerkUserRead: dailyStats.byType.clerk_user_read?.count || 0,
      // Vercel Blob
      blobPut: dailyStats.byType.vercel_blob_put?.count || 0,
      blobDelete: dailyStats.byType.vercel_blob_delete?.count || 0,
      blobRead: dailyStats.byType.vercel_blob_read?.count || 0,
      // Messaging
      smsSent: dailyStats.byType.twilio_sms_sent?.count || 0,
      verifySent: dailyStats.byType.twilio_verify_sent?.count || 0,
      emailsSent: dailyStats.byType.resend_email_sent?.count || 0,
    };

    const monthlyUsage = {
      // Google APIs
      textSearch: monthlyStats.byType.google_places_text_search?.count || 0,
      nearbySearch: monthlyStats.byType.google_places_nearby_search?.count || 0,
      placeDetails: monthlyStats.byType.google_places_details?.count || 0,
      geocoding: monthlyStats.byType.google_geocoding?.count || 0,
      addressValidation:
        monthlyStats.byType.google_address_validation?.count || 0,
      mapsLoads: monthlyStats.byType.google_maps_load?.count || 0,
      // Clerk
      clerkUserCreate: monthlyStats.byType.clerk_user_create?.count || 0,
      clerkUserUpdate: monthlyStats.byType.clerk_user_update?.count || 0,
      clerkUserRead: monthlyStats.byType.clerk_user_read?.count || 0,
      // Vercel Blob
      blobPut: monthlyStats.byType.vercel_blob_put?.count || 0,
      blobDelete: monthlyStats.byType.vercel_blob_delete?.count || 0,
      blobRead: monthlyStats.byType.vercel_blob_read?.count || 0,
      // Messaging
      smsSent: monthlyStats.byType.twilio_sms_sent?.count || 0,
      verifySent: monthlyStats.byType.twilio_verify_sent?.count || 0,
      emailsSent: monthlyStats.byType.resend_email_sent?.count || 0,
    };

    // Calculate total costs (already calculated by getAPIUsageStats)
    const dailyTotal = dailyStats.totalCost;
    const monthlyTotal = monthlyStats.totalCost;

    // Calculate costs by service
    const googleCost =
      (monthlyStats.byType.google_places_text_search?.cost || 0) +
      (monthlyStats.byType.google_places_nearby_search?.cost || 0) +
      (monthlyStats.byType.google_places_details?.cost || 0) +
      (monthlyStats.byType.google_geocoding?.cost || 0) +
      (monthlyStats.byType.google_address_validation?.cost || 0) +
      (monthlyStats.byType.google_maps_load?.cost || 0);

    const clerkCost =
      (monthlyStats.byType.clerk_user_create?.cost || 0) +
      (monthlyStats.byType.clerk_user_update?.cost || 0) +
      (monthlyStats.byType.clerk_user_read?.cost || 0);

    const vercelBlobCost =
      (monthlyStats.byType.vercel_blob_put?.cost || 0) +
      (monthlyStats.byType.vercel_blob_delete?.cost || 0) +
      (monthlyStats.byType.vercel_blob_read?.cost || 0);

    const twilioCost =
      (monthlyStats.byType.twilio_sms_sent?.cost || 0) +
      (monthlyStats.byType.twilio_verify_sent?.cost || 0);
    const resendCost = monthlyStats.byType.resend_email_sent?.cost || 0;

    // Calculate potential savings from caching
    // This is an estimate based on cache hit rate
    // If we had 70% cache hit rate, we would have made 70% more API calls without caching
    const cacheSavingsRate = cacheStats.hitRate / 100;
    const potentialAdditionalCalls =
      monthlyStats.totalCalls / (1 - cacheSavingsRate) -
      monthlyStats.totalCalls;
    const monthlySavings =
      (potentialAdditionalCalls / monthlyStats.totalCalls) * monthlyTotal;

    // Estimate storage size (rough estimate based on uploads)
    const averageImageSize = 0.5; // 500KB average per image
    const estimatedStorageGB = (monthlyUsage.blobPut * averageImageSize) / 1024;

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
      clerk: {
        userCreate: monthlyUsage.clerkUserCreate,
        userUpdate: monthlyUsage.clerkUserUpdate,
        userRead: monthlyUsage.clerkUserRead,
        estimatedMAU: monthlyUsage.clerkUserCreate, // Rough estimate
      },
      vercelBlob: {
        uploads: monthlyUsage.blobPut,
        deletes: monthlyUsage.blobDelete,
        reads: monthlyUsage.blobRead,
        estimatedStorageGB,
      },
      twilio: {
        smsSent: monthlyUsage.smsSent,
        verifySent: monthlyUsage.verifySent,
      },
      resend: {
        emailsSent: monthlyUsage.emailsSent,
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
        byService: {
          google: googleCost,
          clerk: clerkCost,
          vercelBlob: vercelBlobCost,
          twilio: twilioCost,
          resend: resendCost,
        },
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
      availableYears,
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

  // Overall cost recommendations
  if (metrics.estimatedCosts.monthly > 100) {
    recommendations.push(
      `💰 Monthly API costs are $${metrics.estimatedCosts.monthly.toFixed(2)}. Consider implementing request batching or reducing API call frequency.`
    );
  }

  // Google API recommendations
  if (metrics.cache.hitRate < 70) {
    recommendations.push(
      '⚡ Cache hit rate is below 70%. Consider increasing cache TTL or implementing more aggressive caching to reduce Google API costs.'
    );
  }

  if (metrics.googlePlaces.placeDetails > metrics.googlePlaces.textSearch * 2) {
    recommendations.push(
      '🔍 High place details usage detected. Consider implementing batch place details fetching or caching more aggressively.'
    );
  }

  if (metrics.googlePlaces.geocoding > metrics.googlePlaces.textSearch * 0.9) {
    recommendations.push(
      '📍 High geocoding usage detected. Consider implementing address normalization to reduce duplicate geocoding calls.'
    );
  }

  // Service-specific cost recommendations
  const { byService } = metrics.estimatedCosts;

  if (byService.google > 50) {
    recommendations.push(
      `🗺️ Google APIs cost $${byService.google.toFixed(2)}/month. This is your highest cost. Consider implementing more aggressive caching.`
    );
  }

  if (byService.twilio > 10) {
    recommendations.push(
      `📱 Twilio costs are $${byService.twilio.toFixed(2)}/month (${metrics.twilio.smsSent} SMS + ${metrics.twilio.verifySent} verifications). Consider encouraging users to use in-app or email notifications.`
    );
  }

  if (metrics.twilio.verifySent > 20) {
    recommendations.push(
      `🔐 Sending ${metrics.twilio.verifySent} Twilio Verify SMS/month at $0.05 each. Consider implementing phone verification caching or rate limiting.`
    );
  }

  if (metrics.twilio.smsSent > 100) {
    recommendations.push(
      `📨 Sending ${metrics.twilio.smsSent} SMS/month. Consider batching notifications or implementing user preferences to reduce SMS volume.`
    );
  }

  if (byService.resend > 5) {
    recommendations.push(
      `📧 Email costs are $${byService.resend.toFixed(2)}/month (${metrics.resend.emailsSent} emails). Monitor to stay within free tier limits.`
    );
  }

  if (metrics.resend.emailsSent > 3000) {
    recommendations.push(
      `⚠️ Approaching Resend free tier limit (100 emails/day). Consider upgrading plan or implementing email batching.`
    );
  }

  if (byService.vercelBlob > 5) {
    recommendations.push(
      `💾 Blob storage costs are $${byService.vercelBlob.toFixed(2)}/month. Consider implementing image compression or cleanup policies.`
    );
  }

  if (metrics.vercelBlob.uploads > 50) {
    recommendations.push(
      `🖼️ ${metrics.vercelBlob.uploads} files uploaded this month. Consider implementing file size limits and format restrictions.`
    );
  }

  // Cache recommendations
  if (metrics.cache.memoryEntries > 500) {
    recommendations.push(
      '💾 High memory cache usage. Consider implementing cache eviction policies or increasing database cache usage.'
    );
  }

  // Location cache recommendations
  if (metrics.locationCache.totalEntries > 100) {
    recommendations.push(
      `📊 Location cache has ${metrics.locationCache.totalEntries} entries (~${metrics.locationCache.estimatedSizeKB}KB). Consider running cleanup to remove expired entries.`
    );
  }

  if (metrics.locationCache.estimatedSizeKB > 5000) {
    recommendations.push(
      '🗂️ Location cache size is over 5MB. Consider implementing more aggressive eviction policies or reducing cache TTL.'
    );
  }

  if (
    metrics.locationCache.locationQueryEntries >
    metrics.locationCache.locationOnlyEntries * 2
  ) {
    recommendations.push(
      '🔎 High number of location+query cache entries. Consider consolidating similar queries to improve cache hit rates.'
    );
  }

  // Positive feedback
  if (metrics.estimatedCosts.savings > 20) {
    recommendations.push(
      `✅ Great job! Caching is saving approximately $${metrics.estimatedCosts.savings.toFixed(2)}/month in API costs.`
    );
  }

  if (metrics.estimatedCosts.monthly < 20) {
    recommendations.push(
      `✅ Total monthly costs are under $20. Current optimization strategies are working well!`
    );
  }

  return recommendations;
}
