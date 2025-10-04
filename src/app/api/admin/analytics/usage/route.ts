import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
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

    // Get API usage patterns (simplified - in production you'd track actual API calls)
    const apiUsage = {
      googlePlaces: {
        calls: 0, // Would be tracked in production
        cost: 0,
        errors: 0,
      },
      googleMaps: {
        calls: 0,
        cost: 0,
        errors: 0,
      },
      internal: {
        calls: 0,
        errors: 0,
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
    const userBehavior = await db
      .collection('users')
      .aggregate([
        {
          $lookup: {
            from: 'collections',
            localField: '_id',
            foreignField: 'userId',
            as: 'collections',
          },
        },
        {
          $lookup: {
            from: 'groups',
            localField: '_id',
            foreignField: 'members.userId',
            as: 'groups',
          },
        },
        {
          $lookup: {
            from: 'decisions',
            localField: '_id',
            foreignField: 'userId',
            as: 'decisions',
          },
        },
        {
          $addFields: {
            collectionCount: { $size: '$collections' },
            groupCount: { $size: '$groups' },
            decisionCount: { $size: '$decisions' },
          },
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            avgCollectionsPerUser: { $avg: '$collectionCount' },
            avgGroupsPerUser: { $avg: '$groupCount' },
            avgDecisionsPerUser: { $avg: '$decisionCount' },
            activeUsers: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $gt: ['$collectionCount', 0] },
                      { $gt: ['$groupCount', 0] },
                      { $gt: ['$decisionCount', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray();

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
            uniqueUsers: { $addToSet: '$userId' },
          },
        },
        {
          $addFields: {
            uniqueUserCount: { $size: '$uniqueUsers' },
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
