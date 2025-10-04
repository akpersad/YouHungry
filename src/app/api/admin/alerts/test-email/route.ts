import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { emailNotificationService } from '@/lib/email-notifications';

// POST /api/admin/alerts/test-email - Send a test email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient }: { recipient: string } = body;

    logger.info('Admin: Sending test email', { recipient });

    // Validate recipient email
    if (!recipient || !recipient.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid email address required',
        },
        { status: 400 }
      );
    }

    // Validate email configuration first
    const configValidation =
      await emailNotificationService.validateConfiguration();
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Email configuration invalid: ${configValidation.error}`,
        },
        { status: 400 }
      );
    }

    // Send test email
    const success = await emailNotificationService.sendTestEmail(recipient);

    if (success) {
      logger.info('Admin: Test email sent successfully', { recipient });
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
      });
    } else {
      logger.error('Admin: Failed to send test email', { recipient });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send test email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Admin: Error sending test email', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/alerts/test-email - Validate email configuration
export async function GET() {
  try {
    logger.info('Admin: Validating email configuration');

    const validation = await emailNotificationService.validateConfiguration();

    return NextResponse.json({
      success: true,
      valid: validation.valid,
      error: validation.error,
      message: validation.valid
        ? 'Email configuration is valid'
        : `Email configuration invalid: ${validation.error}`,
    });
  } catch (error) {
    logger.error('Admin: Error validating email configuration', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate email configuration',
      },
      { status: 500 }
    );
  }
}
