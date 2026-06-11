import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { searchUsers, FriendSearchResult } from '@/lib/friends';

/**
 * Mask an email address for display (e.g. "john.doe@example.com" -> "j***@example.com").
 * Full emails are still matched server-side when searching, but we avoid
 * returning complete addresses of users who are not the caller's friends.
 */
function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) {
    return '***';
  }
  return `${email[0]}***${email.slice(atIndex)}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Always search as the session user; caller-supplied userId is ignored
    const results = await searchUsers(query, user.clerkId);

    // Trim PII: only return full email addresses for accepted friends.
    // Non-friends get a masked email (enough for the searcher to confirm
    // a match without harvesting addresses).
    const sanitizedResults: FriendSearchResult[] = results.map((result) =>
      result.relationshipStatus === 'accepted'
        ? result
        : { ...result, email: maskEmail(result.email) }
    );

    return NextResponse.json({
      success: true,
      results: sanitizedResults,
      count: sanitizedResults.length,
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
