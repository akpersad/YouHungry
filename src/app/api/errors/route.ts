/**
 * Error Logging API
 *
 * POST /api/errors - Log client-side errors
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logError } from '@/lib/error-tracking';
import { getUserByClerkId } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();

    const body = await request.json();
    const {
      error,
      url,
      userAgent,
      screenSize,
      additionalData,
      breadcrumbs,
      userReport,
    } = body;

    // Get MongoDB user ID from Clerk ID if user is authenticated
    let mongoUserId: string | undefined;
    if (userId) {
      const user = await getUserByClerkId(userId);
      mongoUserId = user?._id.toString();
    }

    // Log the error
    await logError({
      error: new Error(error.message),
      mongoUserId,
      userEmail: sessionClaims?.email as string | undefined,
      userName: sessionClaims?.name as string | undefined,
      url,
      userAgent,
      screenSize,
      additionalData,
      breadcrumbs: breadcrumbs?.map((crumb: { timestamp: string }) => ({
        ...crumb,
        timestamp: new Date(crumb.timestamp),
      })),
      userReport,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error('Error logging error:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
