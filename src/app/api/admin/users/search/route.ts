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
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const db = await connectToDatabase();

    // Build search filter
    const filter: Record<string, unknown> = {};
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ];
    }

    // Build sort object - MongoDB sort expects [field, direction] tuples
    const sort: [string, 1 | -1] = [sortBy, sortOrder === 'desc' ? -1 : 1];

    // Get paginated users
    const skip = (page - 1) * limit;
    const users = await db
      .collection('users')
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await db.collection('users').countDocuments(filter);

    // Get additional user data (collections, groups, decisions)
    const userIds = users.map((user) => user._id);

    const userCollections = await db
      .collection('collections')
      .aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ])
      .toArray();

    const userGroups = await db
      .collection('groups')
      .aggregate([
        { $match: { 'members.userId': { $in: userIds } } },
        { $unwind: '$members' },
        { $match: { 'members.userId': { $in: userIds } } },
        { $group: { _id: '$members.userId', count: { $sum: 1 } } },
      ])
      .toArray();

    const userDecisions = await db
      .collection('decisions')
      .aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ])
      .toArray();

    // Create lookup maps
    const collectionsMap = new Map(
      userCollections.map((item) => [item._id.toString(), item.count])
    );
    const groupsMap = new Map(
      userGroups.map((item) => [item._id.toString(), item.count])
    );
    const decisionsMap = new Map(
      userDecisions.map((item) => [item._id.toString(), item.count])
    );

    // Enhance users with additional data
    const enhancedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      collectionCount: collectionsMap.get(user._id.toString()) || 0,
      groupCount: groupsMap.get(user._id.toString()) || 0,
      decisionCount: decisionsMap.get(user._id.toString()) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: enhancedUsers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
