import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { userEmailNotificationService } from '@/lib/user-email-notifications';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, email } = body;

    if (action === 'test') {
      // Security: test emails may only be sent to the authenticated user's
      // own email address. Admins can use /api/admin/alerts/test-email for
      // arbitrary recipients.
      const targetEmail = email || user.email;

      if (
        typeof targetEmail !== 'string' ||
        targetEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()
      ) {
        logger.warn('Test email to non-own address rejected', {
          userId: user._id.toString(),
        });
        return NextResponse.json(
          { error: 'Test emails can only be sent to your own email address' },
          { status: 403 }
        );
      }

      const result = await userEmailNotificationService.sendTestUserEmail(
        user.email
      );

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
