import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userEmailNotificationService } from '@/lib/user-email-notifications';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, email } = body;

    if (action === 'test') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email address is required for test' },
          { status: 400 }
        );
      }

      const result =
        await userEmailNotificationService.sendTestUserEmail(email);

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Test email sent successfully'
          : 'Failed to send test email',
        error: result.error,
        emailId: result.emailId,
      });
    }

    if (action === 'validate') {
      const validation =
        await userEmailNotificationService.validateConfiguration();

      return NextResponse.json({
        valid: validation.valid,
        error: validation.error,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: test, validate' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
