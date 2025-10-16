import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { clearLocationCache } from '@/lib/google-places';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/users';

// Get admin user IDs from environment variable (MongoDB user IDs)
const getAdminUserIds = (): string[] => {
  return process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin by getting their MongoDB user ID
    const user = await getUserByClerkId(userId);
    const adminUserIds = getAdminUserIds();
    if (!user || !adminUserIds.includes(user._id.toString())) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body to get optional coordinates
    const body = await request.json().catch(() => ({}));
    const { lat, lng } = body;

    // Clear cache
    let deletedCount: number;
    if (lat !== undefined && lng !== undefined) {
      deletedCount = await clearLocationCache(parseFloat(lat), parseFloat(lng));
      logger.info(
        `Admin cleared location cache for (${lat}, ${lng}): ${deletedCount} entries removed`
      );
    } else {
      deletedCount = await clearLocationCache();
      logger.info(
        `Admin cleared all location caches: ${deletedCount} entries removed`
      );
    }

    return NextResponse.json({
      success: true,
      message:
        lat !== undefined && lng !== undefined
          ? `Cleared ${deletedCount} cache entries for location (${lat}, ${lng})`
          : `Cleared all ${deletedCount} cache entries`,
      deletedCount,
    });
  } catch (error) {
    logger.error('Error clearing location cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
