import { logger } from '@/lib/logger';
import twilio from 'twilio';
import { urlShortener } from '@/lib/url-shortener';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSDeliveryStatus {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSNotificationService {
  private static instance: SMSNotificationService;
  private readonly fromNumber: string;
  private readonly messagingServiceSid: string;

  private constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || '';

    if (!this.fromNumber && !this.messagingServiceSid) {
      logger.warn(
        'Neither TWILIO_PHONE_NUMBER nor TWILIO_MESSAGING_SERVICE_SID configured'
      );
    }
  }

  public static getInstance(): SMSNotificationService {
    if (!SMSNotificationService.instance) {
      SMSNotificationService.instance = new SMSNotificationService();
    }
    return SMSNotificationService.instance;
  }

  /**
   * Check if SMS service is properly configured
   */
  public isConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (this.fromNumber || this.messagingServiceSid)
    );
  }

  /**
   * Validate phone number format
   */
  public validatePhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation - must be 7-15 digits after country code
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 format
   */
  public formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // If it starts with 1 and is 11 digits, it's already formatted
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    // If it's 10 digits, assume US number and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    // Return with + prefix
    return `+${digits}`;
  }

  /**
   * Send SMS message
   */
  public async sendSMS(message: SMSMessage): Promise<SMSDeliveryStatus> {
    if (!this.isConfigured()) {
      logger.error('SMS service not configured');
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    try {
      // Validate phone number
      if (!this.validatePhoneNumber(message.to)) {
        logger.error(`Invalid phone number: ${message.to}`);
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      // Format phone number
      const formattedTo = this.formatPhoneNumber(message.to);

      logger.info(`Sending SMS to ${formattedTo}: ${message.body}`);

      // Use messaging service if available, otherwise use phone number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messageOptions: any = {
        body: message.body,
        to: formattedTo,
      };

      if (this.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.messagingServiceSid;
      } else {
        messageOptions.from = this.fromNumber;
      }

      const result = await client.messages.create(messageOptions);

      logger.info(`SMS sent successfully. SID: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send group decision notification SMS
   */
  public async sendGroupDecisionNotification(
    phoneNumber: string,
    groupName: string,
    decisionType: 'tiered' | 'random',
    deadline: Date,
    groupId?: string,
    shortUrl?: string
  ): Promise<SMSDeliveryStatus> {
    let message: string;

    // Use provided shortUrl or generate one from groupId
    let urlToUse = shortUrl;
    if (!urlToUse && groupId) {
      const groupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/groups/${groupId}`;
      urlToUse = await this.shortenUrlForSMS(groupUrl);
    }

    if (urlToUse) {
      message =
        decisionType === 'tiered'
          ? `🍽️ You Hungry? - ${groupName} has started a group decision! Vote by ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}. ${urlToUse}`
          : `🎲 You Hungry? - ${groupName} has started a random selection! Decision at ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}. ${urlToUse}`;
    } else {
      // Fallback to original message without URL
      message =
        decisionType === 'tiered'
          ? `🍽️ You Hungry? - ${groupName} has started a group decision! Vote for your top 3 restaurants by ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}.`
          : `🎲 You Hungry? - ${groupName} has started a random selection! The decision will be made at ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}.`;
    }

    return this.sendSMS({
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send decision result notification SMS
   */
  public async sendDecisionResultNotification(
    phoneNumber: string,
    groupName: string,
    restaurantName: string,
    decisionType: 'tiered' | 'random',
    shortUrl?: string
  ): Promise<SMSDeliveryStatus> {
    const typeText = decisionType === 'random' ? 'random choice' : 'group vote';
    const message = shortUrl
      ? `🎉 You Hungry? - ${groupName} decision complete! You're going to ${restaurantName} (${typeText})! ${shortUrl}`
      : `🎉 You Hungry? - ${groupName} decision complete! You're going to ${restaurantName} (${typeText})!`;

    return this.sendSMS({
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send friend request notification SMS
   */
  public async sendFriendRequestNotification(
    phoneNumber: string,
    requesterName: string
  ): Promise<SMSDeliveryStatus> {
    const message = `👋 You Hungry? - ${requesterName} sent you a friend request! Check the app to accept.`;

    return this.sendSMS({
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send group invitation notification SMS
   */
  public async sendGroupInvitationNotification(
    phoneNumber: string,
    groupName: string,
    inviterName: string
  ): Promise<SMSDeliveryStatus> {
    const message = `👥 You Hungry? - ${inviterName} invited you to join "${groupName}"! Check the app to accept.`;

    return this.sendSMS({
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send admin alert SMS
   */
  public async sendAdminAlert(
    phoneNumber: string,
    alertType: 'cost_spike' | 'system_failure' | 'circuit_breaker',
    details: string
  ): Promise<SMSDeliveryStatus> {
    const alertMessages = {
      cost_spike: '🚨 You Hungry? - Cost spike detected!',
      system_failure: '🚨 You Hungry? - System failure detected!',
      circuit_breaker: '⚠️ You Hungry? - Circuit breaker activated!',
    };

    const message = `${alertMessages[alertType]} ${details}`;

    return this.sendSMS({
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Send test SMS (for development)
   */
  public async sendTestSMS(phoneNumber: string): Promise<SMSDeliveryStatus> {
    const message = `🧪 You Hungry? - This is a test SMS from the notification system.`;

    return this.sendSMS({
      to: phoneNumber,
      body: message,
    });
  }

  /**
   * Get service configuration info
   */
  public getServiceInfo() {
    return {
      configured: this.isConfigured(),
      accountSid: process.env.TWILIO_ACCOUNT_SID
        ? '***' + process.env.TWILIO_ACCOUNT_SID.slice(-4)
        : 'Not set',
      phoneNumber: this.fromNumber || 'Not set',
      messagingServiceSid: this.messagingServiceSid || 'Not set',
      hasPhoneNumber: !!this.fromNumber,
      hasMessagingService: !!this.messagingServiceSid,
    };
  }

  /**
   * Shorten URL for SMS messages
   */
  private async shortenUrlForSMS(url: string): Promise<string> {
    try {
      return await urlShortener.shortenUrl(url, 30); // Expire in 30 days
    } catch (error) {
      logger.error('Failed to shorten URL for SMS:', error);
      return url; // Return original URL if shortening fails
    }
  }
}

// Export singleton instance
export const smsNotifications = SMSNotificationService.getInstance();
