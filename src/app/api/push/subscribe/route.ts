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
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Find user by Clerk ID
    const user = await db.collection('users').findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription already exists
    const existingSubscriptions = user.pushSubscriptions || [];
    const subscriptionExists = existingSubscriptions.some(
      (sub: { endpoint: string }) => sub.endpoint === subscription.endpoint
    );

    if (subscriptionExists) {
      return NextResponse.json({
        success: true,
        message: 'Subscription already exists',
      });
    }

    // Add subscription to user
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      {
        $push: {
          pushSubscriptions: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
            subscribedAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    logger.info('Push subscription saved', {
      userId,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
    });
  } catch (error) {
    logger.error('Failed to save push subscription', { error });
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
