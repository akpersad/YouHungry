import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { smsNotifications } from '@/lib/sms-notifications';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAdminAuth();
    } catch {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, phoneNumber, message, alertType, details } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const adminPhone = process.env.ADMIN_ALERT_PHONE;
    if ((action === 'test' || action === 'admin_alert') && !adminPhone) {
      return NextResponse.json(
        { error: 'ADMIN_ALERT_PHONE is not configured' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'test':
        result = await smsNotifications.sendTestSMS(adminPhone as string);
        break;

      case 'admin_alert':
        if (!alertType || !details) {
          return NextResponse.json(
            { error: 'Alert type and details are required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendAdminAlert(
          adminPhone as string,
          alertType,
          details
        );
        break;

      case 'custom':
        if (!phoneNumber || !message) {
          return NextResponse.json(
            { error: 'Phone number and message are required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendSMS({
          to: phoneNumber,
          body: message,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      logger.info(
        `Admin SMS sent successfully. Action: ${action}, Message ID: ${result.messageId}`
      );
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully',
      });
    } else {
      logger.error(
        `Admin SMS failed. Action: ${action}, Error: ${result.error}`
      );
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Admin SMS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    try {
      await requireAdminAuth();
    } catch {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const isConfigured = smsNotifications.isConfigured();

    // Only expose non-sensitive configuration status - never phone numbers
    return NextResponse.json({
      configured: isConfigured,
      fromNumberConfigured: Boolean(process.env.TWILIO_PHONE_NUMBER),
      message: isConfigured
        ? 'SMS service is configured'
        : 'SMS service is not configured',
    });
  } catch (error) {
    logger.error('Admin SMS status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
