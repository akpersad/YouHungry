import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
// import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    // Check authentication and admin access
    await requireAuth();

    // TODO: Add admin role check when implemented
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const db = await connectToDatabase();

    // Get database connection status
    const adminDb = db.admin();
    let connectionStatus = 'connected';
    let connectionLatency = 0;

    try {
      const startTime = Date.now();
      await adminDb.ping();
      connectionLatency = Date.now() - startTime;
    } catch {
      connectionStatus = 'disconnected';
    }

    // Get collection statistics (sorted alphabetically)
    const collections = [
      'api_cache',
      'api_usage',
      'collections',
      'decisions',
      'friendships',
      'groupInvitations',
      'groups',
      'location_cache',
      'notifications',
      'performance_metrics',
      'phone_verifications',
      'restaurants',
      'short_urls',
      'user_interactions',
      'users',
    ];
    const collectionStats = await Promise.all(
      collections.map(async (collectionName) => {
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();
          const indexes = await collection.indexes();

          // Get storage size using MongoDB stats() method
          let storageSize = 0;
          let indexSize = 0;

          try {
            const stats = await db.command({ collStats: collectionName });
            storageSize = stats.storageSize || stats.size || 0;
            indexSize = stats.totalIndexSize || 0;
          } catch {
            // Fallback: estimate storage size based on document count
            // This is a rough approximation - actual size may vary
            storageSize = count * 1024; // Assume ~1KB per document average
            indexSize = indexes.length * 8192; // Assume ~8KB per index average
          }

          return {
            name: collectionName,
            count,
            storageSize,
            indexSize,
            indexes: indexes.length,
          };
        } catch (err) {
          return {
            name: collectionName,
            count: 0,
            storageSize: 0,
            indexSize: 0,
            indexes: 0,
            error: (err as Error).message,
          };
        }
      })
    );

    // Get database performance metrics
    const totalCollections = collectionStats.reduce(
      (sum, col) => sum + col.count,
      0
    );
    const totalStorageSize = collectionStats.reduce(
      (sum, col) => sum + col.storageSize,
      0
    );
    const totalIndexSize = collectionStats.reduce(
      (sum, col) => sum + col.indexSize,
      0
    );

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Promise.allSettled([
      (async () => {
        try {
          return await db
            .collection('users')
            .countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        } catch {
          return 0;
        }
      })(),
      (async () => {
        try {
          return await db
            .collection('collections')
            .countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        } catch {
          return 0;
        }
      })(),
      (async () => {
        try {
          return await db
            .collection('groups')
            .countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        } catch {
          return 0;
        }
      })(),
      (async () => {
        try {
          return await db
            .collection('decisions')
            .countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        } catch {
          return 0;
        }
      })(),
    ]).then((results) =>
      results.map((result) =>
        result.status === 'fulfilled' ? result.value : 0
      )
    );

    // Get query performance data (simplified - in production you'd use MongoDB profiler)
    const queryMetrics = {
      averageResponseTime: connectionLatency,
      slowQueries: 0, // Would need profiler data
      totalQueries: 0, // Would need profiler data
    };

    // Get storage optimization recommendations
    const storageRecommendations = [];

    if (totalIndexSize > totalStorageSize * 0.3) {
      storageRecommendations.push({
        type: 'warning',
        message:
          'Index size is high compared to data size. Consider reviewing indexes.',
      });
    }

    const largeCollections = collectionStats.filter((col) => col.count > 10000);
    if (largeCollections.length > 0) {
      storageRecommendations.push({
        type: 'info',
        message: `${largeCollections.length} collection(s) have over 10,000 documents. Consider archiving old data.`,
      });
    }

    // Check for unused indexes (simplified check)
    const unusedIndexes = collectionStats.filter((col) => col.indexes > 5);
    if (unusedIndexes.length > 0) {
      storageRecommendations.push({
        type: 'warning',
        message: `${unusedIndexes.length} collection(s) have many indexes. Review for unused indexes.`,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        connection: {
          status: connectionStatus,
          latency: connectionLatency,
        },
        overview: {
          totalCollections: collections.length,
          totalDocuments: totalCollections,
          totalStorageSize,
          totalIndexSize,
        },
        collections: collectionStats,
        performance: {
          ...queryMetrics,
          recentActivity: {
            newUsers: recentActivity[0],
            newCollections: recentActivity[1],
            newGroups: recentActivity[2],
            newDecisions: recentActivity[3],
          },
        },
        recommendations: storageRecommendations,
      },
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
