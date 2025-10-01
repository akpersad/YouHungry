import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        city: user.city,
      },
    });
  } catch (error) {
    logger.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current user' },
      { status: 500 }
    );
  }
}
