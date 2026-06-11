import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdminUser } from '@/lib/auth';
import { smsNotifications } from '@/lib/sms-notifications';
import { logger } from '@/lib/logger';
import {
  checkRateLimit,
  rateLimitResponse,
  userRateLimitKey,
} from '@/lib/rate-limit';
import type { User } from '@/types/database';

// Normalize a phone number for comparison (digits only, US country code stripped)
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;
}

// The only number a non-admin user may send SMS to: their own verified phone
function getOwnVerifiedPhoneNumber(user: User): string | null {
  if (!user.phoneVerified) {
    return null;
  }
  return user.smsPhoneNumber || user.phoneNumber || null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Real Twilio sends cost money — 10 SMS per user per hour.
    const rateLimit = await checkRateLimit({
      key: userRateLimitKey('sms-send', user._id.toString()),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds);
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

    const isAdmin = isAdminUser(user);
    const ownPhoneNumber = getOwnVerifiedPhoneNumber(user);

    // Security: non-admin callers may only target their own verified phone
    // number. Admins may pass arbitrary numbers (e.g. for ops/testing).
    let targetPhoneNumber: string = phoneNumber;

    if (action === 'admin_alert' && !isAdmin) {
      logger.warn('Non-admin user attempted admin_alert SMS', {
        userId: user._id.toString(),
      });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!isAdmin) {
      if (!ownPhoneNumber) {
        return NextResponse.json(
          { error: 'No verified phone number on your profile' },
          { status: 400 }
        );
      }

      if (
        phoneNumber &&
        normalizePhoneNumber(phoneNumber) !==
          normalizePhoneNumber(ownPhoneNumber)
      ) {
        logger.warn('SMS send to non-own phone number rejected', {
          userId: user._id.toString(),
          action,
        });
        return NextResponse.json(
          {
            error: 'SMS can only be sent to your own verified phone number',
          },
          { status: 403 }
        );
      }

      // Always send to the user's own verified number from their profile
      targetPhoneNumber = ownPhoneNumber;
    }

    if (action !== 'test' && !targetPhoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'test': {
        // Send the test to the caller's own verified phone (admins may
        // override with an explicit phoneNumber)
        const testTarget = isAdmin
          ? phoneNumber || ownPhoneNumber
          : targetPhoneNumber;
        if (!testTarget) {
          return NextResponse.json(
            { error: 'No verified phone number on your profile' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendTestSMS(testTarget);
        break;
      }

      case 'group_decision':
        if (!groupName || !decisionType || !deadline) {
          return NextResponse.json(
            { error: 'Group name, decision type, and deadline are required' },
            { status: 400 }
          );
        }
        result = await smsNotifications.sendGroupDecisionNotification(
          targetPhoneNumber,
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
          targetPhoneNumber,
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
          targetPhoneNumber,
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
          targetPhoneNumber,
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
          to: targetPhoneNumber,
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
