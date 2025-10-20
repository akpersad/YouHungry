import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log to server
    logger.info('Push Notification Debug Info:', body);
    console.log(
      '🔍 SERVER DEBUG: Push notification debug info:',
      JSON.stringify(body, null, 2)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error logging push notification debug info:', error);
    return NextResponse.json(
      { error: 'Failed to log debug info' },
      { status: 500 }
    );
  }
}
