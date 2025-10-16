import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// Get admin user IDs from environment variable
const getAdminUserIds = (): string[] => {
  return process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];
};

export async function GET() {
  try {
    const user = await requireAuth();

    // Check if user is admin (server-side check)
    const adminUserIds = getAdminUserIds();
    const isAdmin = adminUserIds.includes(user._id.toString());

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        city: user.city,
        isAdmin, // Include admin status in response
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
