import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/users';
import { apiCache } from '@/lib/api-cache';
import { clearLocationCache } from '@/lib/google-places';

// List of authorized admin MongoDB user IDs
const ADMIN_USER_IDS = ['68d9b010a25dec569c34c111', '68d9ae3528a9bab6c334d9f9'];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await getUserByClerkId(userId);
    if (!user || !ADMIN_USER_IDS.includes(user._id.toString())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { pattern, cacheType } = body;

    let deletedCount = 0;

    if (cacheType) {
      // Special handling for location_cache (stored in MongoDB, not api-cache)
      if (cacheType === 'location_cache') {
        deletedCount = await clearLocationCache();
        logger.info('Location cache cleared by admin:', {
          userId,
          deletedCount,
        });
      } else {
        // Clear by cache type (e.g., "restaurant_search")
        deletedCount = await apiCache.clearByCacheType(cacheType);
      }
    } else if (pattern) {
      // Clear by pattern (e.g., "restaurant_nearby")
      deletedCount = await apiCache.clearByPattern(pattern);
    } else {
      return NextResponse.json(
        { error: 'Either pattern or cacheType is required' },
        { status: 400 }
      );
    }

    logger.info('Cache cleared by admin:', {
      userId,
      pattern,
      cacheType,
      deletedCount,
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} cache entries`,
    });
  } catch (error) {
    logger.error('Clear cache error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
