import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { smsNotifications } from '@/lib/sms-notifications';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      action,
      phoneNumber,
      message,
      groupName,
      decisionType,
      deadline,
      groupId,
      alertType,
      details,
    } = body;

    // Validate required fields based on action
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (action !== 'test' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'test':
        // For test, use the development phone number
        result = await smsNotifications.sendTestSMS('+18777804236');
        break;

      case 'group_decision':
        if (!groupName || !decisionType || !deadline) {
          return NextResponse.json(
            { error: 'Group name, decision type, and deadline are required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendGroupDecisionNotification(
          phoneNumber,
          groupName,
          decisionType,
          new Date(deadline),
          groupId
        );
        break;

      case 'friend_request':
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendFriendRequestNotification(
          phoneNumber,
          message
        );
        break;

      case 'group_invitation':
        if (!groupName || !message) {
          return NextResponse.json(
            { error: 'Group name and inviter name are required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendGroupInvitationNotification(
          phoneNumber,
          groupName,
          message
        );
        break;

      case 'admin_alert':
        if (!alertType || !details) {
          return NextResponse.json(
            { error: 'Alert type and details are required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendAdminAlert(
          phoneNumber,
          alertType,
          details
        );
        break;

      case 'custom':
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required' },
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
        `SMS sent successfully via API. Action: ${action}, Message ID: ${result.messageId}`
      );
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'SMS sent successfully',
      });
    } else {
      logger.error(
        `SMS failed via API. Action: ${action}, Error: ${result.error}`
      );
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return SMS service status with detailed information
    const serviceInfo = smsNotifications.getServiceInfo();

    return NextResponse.json({
      configured: serviceInfo.configured,
      fromNumber: serviceInfo.phoneNumber,
      messagingServiceSid: serviceInfo.messagingServiceSid,
      accountSid: serviceInfo.accountSid,
      hasPhoneNumber: serviceInfo.hasPhoneNumber,
      hasMessagingService: serviceInfo.hasMessagingService,
      message: serviceInfo.configured
        ? 'SMS service is configured'
        : 'SMS service is not configured',
    });
  } catch (error) {
    logger.error('SMS status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
