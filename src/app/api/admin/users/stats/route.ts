import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
// import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    // Check authentication and admin access
    await requireAuth();

    // TODO: Add admin role check when implemented
    // For now, allow access to any authenticated user
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const db = await connectToDatabase();

    // Get user statistics
    const totalUsers = await db.collection('users').countDocuments();

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await db.collection('users').countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get users created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyUsers = await db.collection('users').countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get daily user registration trends for the last 30 days
    const dailyRegistrations = await db
      .collection('users')
      .aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
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
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    // Get friend request statistics
    const totalFriendRequests = await db
      .collection('friendships')
      .countDocuments();
    const pendingFriendRequests = await db
      .collection('friendships')
      .countDocuments({
        status: 'pending',
      });

    // Get group invitation statistics
    const totalGroupInvitations = await db
      .collection('groupInvitations')
      .countDocuments();
    const pendingGroupInvitations = await db
      .collection('groupInvitations')
      .countDocuments({
        status: 'pending',
      });

    // Get user engagement metrics
    const usersWithCollections = await db
      .collection('collections')
      .distinct('ownerId');
    const usersWithGroups = await db
      .collection('groups')
      .aggregate([{ $unwind: '$memberIds' }, { $group: { _id: '$memberIds' } }])
      .toArray();

    const usersWithDecisions = await db
      .collection('decisions')
      .aggregate([
        { $unwind: '$participants' },
        { $group: { _id: '$participants' } },
      ])
      .toArray();

    // Get top active users (by number of collections)
    const topActiveUsers = await db
      .collection('users')
      .aggregate([
        {
          $lookup: {
            from: 'collections',
            localField: '_id',
            foreignField: 'ownerId',
            as: 'collections',
          },
        },
        {
          $lookup: {
            from: 'groups',
            localField: '_id',
            foreignField: 'memberIds',
            as: 'groups',
          },
        },
        {
          $addFields: {
            collectionCount: { $size: '$collections' },
            groupCount: { $size: '$groups' },
          },
        },
        {
          $sort: { collectionCount: -1, groupCount: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            createdAt: 1,
            collectionCount: 1,
            groupCount: 1,
          },
        },
      ])
      .toArray();

    const response = NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          recentUsers,
          weeklyUsers,
          usersWithCollections: usersWithCollections.length,
          usersWithGroups: usersWithGroups.length,
          usersWithDecisions: usersWithDecisions.length,
        },
        trends: {
          dailyRegistrations: dailyRegistrations.map((item) => ({
            date: item._id,
            count: item.count,
          })),
        },
        social: {
          totalFriendRequests,
          pendingFriendRequests,
          totalGroupInvitations,
          pendingGroupInvitations,
        },
        topActiveUsers: topActiveUsers.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          collectionCount: user.collectionCount,
          groupCount: user.groupCount,
        })),
      },
    });

    // Add cache busting headers
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Last-Modified', new Date().toUTCString());

    return response;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
