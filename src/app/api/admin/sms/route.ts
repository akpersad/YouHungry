import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { smsNotifications } from '@/lib/sms-notifications';
import { logger } from '@/lib/logger';

// Admin user IDs that can send SMS
const ADMIN_USER_IDS = [
  'user_2rZQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8', // Andrew Persad
  // Add more admin user IDs as needed
];

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is admin
    if (!ADMIN_USER_IDS.includes(user.clerkId)) {
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

    let result;

    switch (action) {
      case 'test':
        // Send test SMS to development number
        result = await smsNotifications.sendTestSMS('+18777804236');
        break;

      case 'admin_alert':
        if (!alertType || !details) {
          return NextResponse.json(
            { error: 'Alert type and details are required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendAdminAlert(
          '+18777804236',
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
    const user = await requireAuth();

    // Check if user is admin
    if (!ADMIN_USER_IDS.includes(user.clerkId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const isConfigured = smsNotifications.isConfigured();

    return NextResponse.json({
      configured: isConfigured,
      fromNumber: process.env.TWILIO_PHONE_NUMBER,
      developmentNumber: '+18777804236',
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
