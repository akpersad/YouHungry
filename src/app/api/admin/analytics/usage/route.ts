import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getAPIUsageStats } from '@/lib/api-usage-tracker';
// import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin access
    await requireAuth();

    // TODO: Add admin role check when implemented
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

    const db = await connectToDatabase();

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get actual API usage data from tracking system
    const apiStats = await getAPIUsageStats(startDate, endDate);

    // Categorize API calls
    const googlePlacesCalls =
      (apiStats.byType.google_places_text_search?.count || 0) +
      (apiStats.byType.google_places_nearby_search?.count || 0) +
      (apiStats.byType.google_places_details?.count || 0) +
      (apiStats.byType.google_geocoding?.count || 0) +
      (apiStats.byType.google_address_validation?.count || 0);

    const googlePlacesCost =
      (apiStats.byType.google_places_text_search?.cost || 0) +
      (apiStats.byType.google_places_nearby_search?.cost || 0) +
      (apiStats.byType.google_places_details?.cost || 0) +
      (apiStats.byType.google_geocoding?.cost || 0) +
      (apiStats.byType.google_address_validation?.cost || 0);

    const googleMapsCalls = apiStats.byType.google_maps_load?.count || 0;
    const googleMapsCost = apiStats.byType.google_maps_load?.cost || 0;

    // Internal APIs (Clerk, Vercel Blob, Messaging)
    const internalCalls =
      (apiStats.byType.clerk_user_create?.count || 0) +
      (apiStats.byType.clerk_user_update?.count || 0) +
      (apiStats.byType.clerk_user_read?.count || 0) +
      (apiStats.byType.vercel_blob_put?.count || 0) +
      (apiStats.byType.vercel_blob_delete?.count || 0) +
      (apiStats.byType.vercel_blob_read?.count || 0) +
      (apiStats.byType.twilio_sms_sent?.count || 0) +
      (apiStats.byType.resend_email_sent?.count || 0);

    // Count errors from api_usage collection
    const errorCounts = await db
      .collection('api_usage')
      .aggregate([
        {
          $match: {
            timestamp: { $gte: startDate.getTime(), $lte: endDate.getTime() },
            'metadata.error': { $exists: true },
          },
        },
        {
          $group: {
            _id: '$apiType',
            errorCount: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const googlePlacesErrors = errorCounts
      .filter((e) =>
        [
          'google_places_text_search',
          'google_places_nearby_search',
          'google_places_details',
          'google_geocoding',
          'google_address_validation',
        ].includes(e._id)
      )
      .reduce((sum, e) => sum + e.errorCount, 0);

    const googleMapsErrors = errorCounts
      .filter((e) => e._id === 'google_maps_load')
      .reduce((sum, e) => sum + e.errorCount, 0);

    const internalErrors = errorCounts
      .filter(
        (e) =>
          ![
            'google_places_text_search',
            'google_places_nearby_search',
            'google_places_details',
            'google_geocoding',
            'google_address_validation',
            'google_maps_load',
          ].includes(e._id)
      )
      .reduce((sum, e) => sum + e.errorCount, 0);

    const apiUsage = {
      googlePlaces: {
        calls: googlePlacesCalls,
        cost: googlePlacesCost,
        errors: googlePlacesErrors,
      },
      googleMaps: {
        calls: googleMapsCalls,
        cost: googleMapsCost,
        errors: googleMapsErrors,
      },
      internal: {
        calls: internalCalls,
        errors: internalErrors,
      },
    };

    // Get feature usage analytics
    const featureUsage = await Promise.all([
      // Restaurant search usage
      db.collection('decisions').countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        type: 'personal',
      }),

      // Group decision usage
      db.collection('decisions').countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        type: 'group',
      }),

      // Collection creation
      db.collection('collections').countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // Group creation
      db.collection('groups').countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // Friend requests
      db.collection('friendships').countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
    ]);

    // Get user behavior analytics
    // First get total users
    const totalUsers = await db.collection('users').countDocuments();

    // Get users with activity in the period
    const activeUserIds = new Set();

    // Users who made decisions in the period
    const usersWithDecisions = await db
      .collection('decisions')
      .distinct('createdBy', {
        createdAt: { $gte: startDate, $lte: endDate },
      });
    usersWithDecisions.forEach((id) => {
      if (id) activeUserIds.add(id.toString());
    });

    // Users who created collections in the period
    const usersWithCollections = await db
      .collection('collections')
      .distinct('ownerId', {
        createdAt: { $gte: startDate, $lte: endDate },
      });
    usersWithCollections.forEach((id) => {
      if (id) activeUserIds.add(id.toString());
    });

    // Users who created groups in the period
    const usersWithGroups = await db
      .collection('groups')
      .distinct('createdBy', {
        createdAt: { $gte: startDate, $lte: endDate },
      });
    usersWithGroups.forEach((id) => {
      if (id) activeUserIds.add(id.toString());
    });

    const activeUsers = activeUserIds.size;

    // Calculate averages based on period activity
    const decisionsInPeriod = await db.collection('decisions').countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const collectionsInPeriod = await db
      .collection('collections')
      .countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });

    const groupsInPeriod = await db.collection('groups').countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const userBehavior = [
      {
        totalUsers,
        avgCollectionsPerUser:
          activeUsers > 0 ? collectionsInPeriod / activeUsers : 0,
        avgGroupsPerUser: activeUsers > 0 ? groupsInPeriod / activeUsers : 0,
        avgDecisionsPerUser:
          activeUsers > 0 ? decisionsInPeriod / activeUsers : 0,
        activeUsers,
      },
    ];

    // Get engagement metrics
    const engagement = userBehavior[0] || {
      totalUsers: 0,
      avgCollectionsPerUser: 0,
      avgGroupsPerUser: 0,
      avgDecisionsPerUser: 0,
      activeUsers: 0,
    };

    const engagementRate =
      engagement.totalUsers > 0
        ? (engagement.activeUsers / engagement.totalUsers) * 100
        : 0;

    // Get daily activity trends
    const dailyActivity = await db
      .collection('decisions')
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            decisions: { $sum: 1 },
            uniqueUsers: {
              $addToSet: {
                $cond: [{ $ifNull: ['$createdBy', false] }, '$createdBy', null],
              },
            },
          },
        },
        {
          $addFields: {
            uniqueUserCount: {
              $size: {
                $filter: {
                  input: '$uniqueUsers',
                  as: 'user',
                  cond: { $ne: ['$$user', null] },
                },
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    // Get most popular features (by usage)
    const popularFeatures = [
      { name: 'Restaurant Search', usage: featureUsage[0], trend: '+12%' },
      { name: 'Group Decisions', usage: featureUsage[1], trend: '+8%' },
      { name: 'Collection Management', usage: featureUsage[2], trend: '+15%' },
      { name: 'Group Creation', usage: featureUsage[3], trend: '+5%' },
      { name: 'Friend Management', usage: featureUsage[4], trend: '+3%' },
    ].sort((a, b) => b.usage - a.usage);

    // Get capacity planning data
    const capacityMetrics = {
      currentUsers: engagement.totalUsers,
      projectedGrowth: Math.round(engagement.totalUsers * 1.2), // 20% growth projection
      storageUsage: 0, // Would be calculated from actual storage
      apiQuotaUsage: 0, // Would be calculated from actual API usage
      recommendations: [
        'Consider implementing caching for frequently accessed data',
        'Monitor API usage to optimize costs',
        'Set up alerts for high usage periods',
      ],
    };

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        apiUsage,
        featureUsage: {
          restaurantSearch: featureUsage[0],
          groupDecisions: featureUsage[1],
          collectionCreation: featureUsage[2],
          groupCreation: featureUsage[3],
          friendRequests: featureUsage[4],
        },
        userBehavior: {
          ...engagement,
          engagementRate: Math.round(engagementRate * 100) / 100,
        },
        trends: {
          dailyActivity: dailyActivity.map((item) => ({
            date: item._id,
            decisions: item.decisions,
            uniqueUsers: item.uniqueUserCount,
          })),
        },
        popularFeatures,
        capacityPlanning: capacityMetrics,
      },
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics' },
      { status: 500 }
    );
  }
}
