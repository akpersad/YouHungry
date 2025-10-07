import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await context.params;

    const db = await connectToDatabase();

    // Verify group exists and user is a member
    const group = await db
      .collection('groups')
      .findOne({ _id: new ObjectId(groupId) });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get user's MongoDB ID
    const user = await db.collection('users').findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is a member
    if (!group.memberIds.some((id: ObjectId) => id.equals(user._id))) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      );
    }

    // Get group decisions
    const decisions = await db
      .collection('decisions')
      .find({
        groupId: new ObjectId(groupId),
        status: 'completed',
      })
      .toArray();

    // Get restaurant popularity for this group
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

    // Get decision trends by month
    const monthlyTrends = new Map<string, number>();
    decisions.forEach((d) => {
      const month = new Date(d.visitDate).toISOString().slice(0, 7);
      monthlyTrends.set(month, (monthlyTrends.get(month) || 0) + 1);
    });

    const trends = Array.from(monthlyTrends.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    // Get member participation
    const memberParticipation = new Map<string, number>();
    decisions.forEach((d) => {
      d.participants?.forEach((participantId: string) => {
        memberParticipation.set(
          participantId,
          (memberParticipation.get(participantId) || 0) + 1
        );
      });
    });

    const memberStats = await Promise.all(
      Array.from(memberParticipation.entries()).map(
        async ([clerkId, count]) => {
          const member = await db.collection('users').findOne({ clerkId });
          return {
            userId: clerkId,
            name: member?.name || 'Unknown',
            participationCount: count,
            participationRate:
              decisions.length > 0
                ? ((count / decisions.length) * 100).toFixed(0)
                : '0',
          };
        }
      )
    );

    memberStats.sort((a, b) => b.participationCount - a.participationCount);

    // Get decision method breakdown
    const methodBreakdown = {
      tiered: decisions.filter((d) => d.method === 'tiered').length,
      random: decisions.filter((d) => d.method === 'random').length,
      manual: decisions.filter((d) => d.method === 'manual').length,
    };

    // Get favorite cuisines
    const cuisineCounts = new Map<string, number>();
    restaurants.forEach((r) => {
      cuisineCounts.set(r.cuisine, (cuisineCounts.get(r.cuisine) || 0) + 1);
    });

    const favoriteCuisines = Array.from(cuisineCounts.entries())
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get collections statistics
    const collections = await db
      .collection('collections')
      .find({ type: 'group', ownerId: group._id })
      .toArray();

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalDecisions: decisions.length,
          uniqueRestaurants: restaurantCounts.size,
          activeMembers: memberParticipation.size,
          totalMembers: group.memberIds.length,
          totalCollections: collections.length,
        },
        popularRestaurants,
        trends,
        memberParticipation: memberStats.slice(0, 10),
        methodBreakdown,
        favoriteCuisines,
        recentActivity: {
          lastDecision: decisions.length > 0 ? decisions[0].visitDate : null,
          decisionsThisMonth: decisions.filter(
            (d) =>
              new Date(d.visitDate).getMonth() === new Date().getMonth() &&
              new Date(d.visitDate).getFullYear() === new Date().getFullYear()
          ).length,
        },
      },
    });
  } catch (error) {
    logger.error('Get group analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group analytics' },
      { status: 500 }
    );
  }
}
