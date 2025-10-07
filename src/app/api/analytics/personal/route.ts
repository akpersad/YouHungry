import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId, Db } from 'mongodb';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();

    // Get user's MongoDB ID
    const user = await db.collection('users').findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get decision statistics
    const decisions = await db
      .collection('decisions')
      .find({
        participants: userId,
        status: 'completed',
      })
      .toArray();

    const personalDecisions = decisions.filter((d) => d.type === 'personal');
    const groupDecisions = decisions.filter((d) => d.type === 'group');

    // Get restaurant popularity (most selected)
    const restaurantCounts = new Map<string, number>();
    decisions.forEach((d) => {
      if (d.result?.restaurantId) {
        const id = d.result.restaurantId.toString();
        restaurantCounts.set(id, (restaurantCounts.get(id) || 0) + 1);
      }
    });

    const restaurantIds = Array.from(restaurantCounts.keys()).map(
      (id) => new ObjectId(id)
    );
    const restaurants = await db
      .collection('restaurants')
      .find({ _id: { $in: restaurantIds } })
      .toArray();

    const popularRestaurants = restaurants
      .map((r) => ({
        id: r._id.toString(),
        name: r.name,
        address: r.address,
        cuisine: r.cuisine,
        rating: r.rating,
        priceRange: r.priceRange,
        selectionCount: restaurantCounts.get(r._id.toString()) || 0,
      }))
      .sort((a, b) => b.selectionCount - a.selectionCount)
      .slice(0, 10);

    // Get decision trends (by month)
    const monthlyTrends = new Map<
      string,
      { personal: number; group: number }
    >();
    decisions.forEach((d) => {
      const month = new Date(d.visitDate).toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyTrends.get(month) || { personal: 0, group: 0 };
      if (d.type === 'personal') {
        current.personal++;
      } else {
        current.group++;
      }
      monthlyTrends.set(month, current);
    });

    const trends = Array.from(monthlyTrends.entries())
      .map(([month, counts]) => ({
        month,
        personal: counts.personal,
        group: counts.group,
        total: counts.personal + counts.group,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Get collection statistics
    const collections = await db
      .collection('collections')
      .find({
        $or: [
          { type: 'personal', ownerId: user._id },
          {
            type: 'group',
            ownerId: { $in: await getUserGroupIds(db, user._id) },
          },
        ],
      })
      .toArray();

    const collectionStats = {
      total: collections.length,
      personal: collections.filter((c) => c.type === 'personal').length,
      group: collections.filter((c) => c.type === 'group').length,
      avgRestaurantsPerCollection:
        collections.length > 0
          ? Math.round(
              collections.reduce(
                (sum, c) => sum + (c.restaurantIds?.length || 0),
                0
              ) / collections.length
            )
          : 0,
    };

    // Get group participation statistics
    const groups = await db
      .collection('groups')
      .find({ memberIds: user._id })
      .toArray();

    const groupStats = {
      totalGroups: groups.length,
      activeGroups: groups.filter((g) => {
        const hasRecentDecision = groupDecisions.some(
          (d) =>
            d.groupId?.toString() === g._id.toString() &&
            new Date(d.visitDate) >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        return hasRecentDecision;
      }).length,
      adminGroups: groups.filter((g) =>
        g.adminIds.some((id: ObjectId) => id.equals(user._id))
      ).length,
    };

    // Get favorite cuisines
    const cuisineCounts = new Map<string, number>();
    const restaurantsSelected = restaurants.filter((r) =>
      Array.from(restaurantCounts.keys()).includes(r._id.toString())
    );
    restaurantsSelected.forEach((r) => {
      cuisineCounts.set(r.cuisine, (cuisineCounts.get(r.cuisine) || 0) + 1);
    });

    const favoriteCuisines = Array.from(cuisineCounts.entries())
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalDecisions: decisions.length,
          personalDecisions: personalDecisions.length,
          groupDecisions: groupDecisions.length,
          uniqueRestaurants: restaurantCounts.size,
        },
        popularRestaurants,
        trends,
        collections: collectionStats,
        groups: groupStats,
        favoriteCuisines,
      },
    });
  } catch (error) {
    logger.error('Get personal analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getUserGroupIds(db: Db, userId: ObjectId): Promise<ObjectId[]> {
  const groups = await db
    .collection('groups')
    .find({ memberIds: userId })
    .toArray();
  return groups.map((g: { _id: ObjectId }) => g._id);
}
