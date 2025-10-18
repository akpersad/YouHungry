import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const db = await connectToDatabase();

    // Find user by Clerk ID
    const user = await db.collection('users').findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove subscription from user
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      {
        $pull: {
          pushSubscriptions: { endpoint },
        },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Subscription not found or already removed' },
        { status: 404 }
      );
    }

    logger.info('Push subscription removed', {
      userId,
      endpoint: endpoint.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    });
  } catch (error) {
    logger.error('Failed to remove push subscription', { error });
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
