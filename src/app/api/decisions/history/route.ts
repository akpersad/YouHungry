import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const historyQuerySchema = z.object({
  type: z.enum(['personal', 'group', 'all']).optional().default('all'),
  collectionId: z.string().optional(),
  groupId: z.string().optional(),
  restaurantId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(500).optional().default(100),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = {
      type: searchParams.get('type') || 'all',
      collectionId: searchParams.get('collectionId') || undefined,
      groupId: searchParams.get('groupId') || undefined,
      restaurantId: searchParams.get('restaurantId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || '100',
      offset: searchParams.get('offset') || '0',
      search: searchParams.get('search') || undefined,
    };

    const query = historyQuerySchema.parse(params);

    const db = await connectToDatabase();

    // Build the query filter
    const filter: Record<string, unknown> = {
      participants: userId,
      status: 'completed',
    };

    // Filter by type
    if (query.type !== 'all') {
      filter.type = query.type;
    }

    // Filter by collection
    if (query.collectionId) {
      filter.collectionId = new ObjectId(query.collectionId);
    }

    // Filter by group
    if (query.groupId) {
      filter.groupId = new ObjectId(query.groupId);
    }

    // Filter by restaurant
    if (query.restaurantId) {
      filter['result.restaurantId'] = new ObjectId(query.restaurantId);
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.$lte = new Date(query.endDate);
      }
      filter.visitDate = dateFilter;
    }

    // Get total count
    const totalCount = await db.collection('decisions').countDocuments(filter);

    // Get decisions with pagination
    const decisions = await db
      .collection('decisions')
      .find(filter)
      .sort({ visitDate: -1, createdAt: -1 })
      .skip(query.offset)
      .limit(query.limit)
      .toArray();

    // Get restaurant details for each decision
    const restaurantIds = decisions
      .filter((d) => d.result?.restaurantId)
      .map((d) => d.result.restaurantId);

    const restaurants = await db
      .collection('restaurants')
      .find({ _id: { $in: restaurantIds } })
      .toArray();

    const restaurantMap = new Map(
      restaurants.map((r) => [r._id.toString(), r])
    );

    // Get collection names for each decision
    const collectionIds = [...new Set(decisions.map((d) => d.collectionId))];
    const collections = await db
      .collection('collections')
      .find({ _id: { $in: collectionIds } })
      .toArray();

    const collectionMap = new Map(
      collections.map((c) => [c._id.toString(), c.name])
    );

    // Get group names for group decisions
    const groupIds = decisions.filter((d) => d.groupId).map((d) => d.groupId);
    const groups = groupIds.length
      ? await db
          .collection('groups')
          .find({ _id: { $in: groupIds } })
          .toArray()
      : [];

    const groupMap = new Map(groups.map((g) => [g._id.toString(), g.name]));

    // Format response
    const formattedDecisions = decisions.map((decision) => ({
      id: decision._id.toString(),
      type: decision.type,
      collectionId: decision.collectionId.toString(),
      collectionName:
        collectionMap.get(decision.collectionId.toString()) || 'Unknown',
      groupId: decision.groupId?.toString(),
      groupName: decision.groupId
        ? groupMap.get(decision.groupId.toString()) || 'Unknown'
        : undefined,
      method: decision.method,
      visitDate: decision.visitDate.toISOString(),
      result: decision.result
        ? {
            restaurantId: decision.result.restaurantId.toString(),
            restaurant: restaurantMap.get(
              decision.result.restaurantId.toString()
            ) || { name: 'Restaurant not found' },
            selectedAt: decision.result.selectedAt.toISOString(),
            reasoning: decision.result.reasoning,
          }
        : null,
      createdAt: decision.createdAt.toISOString(),
    }));

    // Apply search filter if provided
    let filteredDecisions = formattedDecisions;
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredDecisions = formattedDecisions.filter(
        (d) =>
          d.result?.restaurant?.name?.toLowerCase().includes(searchLower) ||
          d.collectionName.toLowerCase().includes(searchLower) ||
          d.groupName?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      decisions: filteredDecisions,
      pagination: {
        total: totalCount,
        offset: query.offset,
        limit: query.limit,
        hasMore: query.offset + query.limit < totalCount,
      },
    });
  } catch (error) {
    logger.error('Get decision history error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch decision history' },
      { status: 500 }
    );
  }
}
