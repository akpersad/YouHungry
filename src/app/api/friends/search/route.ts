import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { searchUsers } from '@/lib/friends';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const results = await searchUsers(query, userId);

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Search users error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
