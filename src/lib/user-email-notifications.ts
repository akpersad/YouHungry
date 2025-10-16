import { logger } from './logger';
import { emailNotificationService } from './email-notifications';

// User email notification types
export type UserEmailType =
  | 'group_decision'
  | 'friend_request'
  | 'group_invitation'
  | 'decision_result';

export interface UserEmailData {
  type: UserEmailType;
  recipientEmail: string;
  recipientName?: string;
  groupName?: string;
  groupId?: string;
  decisionId?: string;
  decisionType?: 'tiered' | 'random';
  deadline?: Date;
  requesterName?: string;
  requesterId?: string;
  inviterName?: string;
  inviterId?: string;
  restaurantName?: string;
  restaurantId?: string;
  collectionName?: string;
  collectionUrl?: string;
  createdByName?: string;
  unsubscribeToken?: string;
}

export interface EmailDeliveryStatus {
  success: boolean;
  emailId?: string;
  error?: string;
  timestamp: Date;
}

// User email templates
export const USER_EMAIL_TEMPLATES = {
  group_decision: {
    subject: (groupName: string, decisionType: 'tiered' | 'random') =>
      `🍽️ Decision Time in ${groupName} - ${decisionType === 'tiered' ? 'Vote Now' : 'Random Selection'}`,
    template: (data: UserEmailData) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🍽️ Fork In The Road</h1>
          <p style="color: #f0f0f0; margin: 0; font-size: 18px;">Time to decide where to eat!</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #374151; font-size: 24px;">${data.groupName} Decision${data.collectionName ? ` - ${data.collectionName}` : ''}</h2>
          ${
            data.createdByName
              ? `<p style="color: #9ca3af; font-size: 14px; margin-top: 0;">Started by ${data.createdByName}</p>`
              : ''
          }
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            ${
              data.decisionType === 'tiered'
                ? 'Your group is ready to vote on restaurant preferences. Rank your top choices to help decide where to eat!'
                : 'Your group is using random selection to pick a restaurant. The decision will be made automatically.'
            }
          </p>
          
          ${
            data.deadline
              ? `
            <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">
                ⏰ Decision needed by: ${data.deadline.toLocaleString()}
              </p>
            </div>
          `
              : ''
          }
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${data.collectionUrl || `${process.env.NEXT_PUBLIC_APP_URL}/groups/${data.groupId}/decisions/${data.decisionId}`}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              ${data.decisionType === 'tiered' ? 'Vote Now' : 'View Decision'}
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">This notification was sent by Fork In The Road - Your group decision app.</p>
          ${
            data.unsubscribeToken
              ? `
            <p style="margin: 5px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?token=${data.unsubscribeToken}" 
                 style="color: #6b7280; text-decoration: underline;">
                Unsubscribe from group decision emails
              </a>
            </p>
          `
              : ''
          }
        </div>
      </div>
    `,
  },

  friend_request: {
    subject: (requesterName: string) =>
      `${requesterName} wants to be friends on Fork In The Road`,
    template: (data: UserEmailData) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🍽️ Fork In The Road</h1>
          <p style="color: #f0f0f0; margin: 0; font-size: 18px;">New friend request!</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #374151; font-size: 24px;">Friend Request</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            <strong>${data.requesterName}</strong> wants to be friends with you on Fork In The Road 
            Accept their request to start making food decisions together!
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/friends" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              View Friend Request
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">This notification was sent by Fork In The Road - Your group decision app.</p>
          ${
            data.unsubscribeToken
              ? `
            <p style="margin: 5px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?token=${data.unsubscribeToken}" 
                 style="color: #6b7280; text-decoration: underline;">
                Unsubscribe from friend request emails
              </a>
            </p>
          `
              : ''
          }
        </div>
      </div>
    `,
  },

  group_invitation: {
    subject: (groupName: string, inviterName: string) =>
      `${inviterName} invited you to join ${groupName}`,
    template: (data: UserEmailData) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🍽️ Fork In The Road</h1>
          <p style="color: #f0f0f0; margin: 0; font-size: 18px;">You're invited to a group!</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #374151; font-size: 24px;">Group Invitation</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            <strong>${data.inviterName}</strong> has invited you to join the group 
            <strong>"${data.groupName}"</strong> on Fork In The Road. 
            Join to start making food decisions together!
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${data.groupId}" 
               style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              View Group Invitation
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">This notification was sent by Fork In The Road - Your group decision app.</p>
          ${
            data.unsubscribeToken
              ? `
            <p style="margin: 5px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?token=${data.unsubscribeToken}" 
                 style="color: #6b7280; text-decoration: underline;">
                Unsubscribe from group invitation emails
              </a>
            </p>
          `
              : ''
          }
        </div>
      </div>
    `,
  },

  decision_result: {
    subject: (groupName: string, restaurantName: string) =>
      `${groupName} decided: ${restaurantName}`,
    template: (data: UserEmailData) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🍽️ Fork In The Road</h1>
          <p style="color: #f0f0f0; margin: 0; font-size: 18px;">Decision made!</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #374151; font-size: 24px;">Decision Result${data.collectionName ? ` - ${data.collectionName}` : ''}</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Your group <strong>"${data.groupName}"</strong> has decided on a restaurant${
              data.decisionType
                ? ` using ${data.decisionType === 'random' ? 'random selection' : 'group voting'}`
                : ''
            }!
          </p>
          
          <div style="background: #d1fae5; border: 1px solid #34d399; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #059669; font-size: 20px;">${data.decisionType === 'random' ? '🎲' : '🎉'} ${data.restaurantName}</h3>
            <p style="margin: 0; color: #047857;">This is where you'll be eating!</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${data.collectionUrl || `${process.env.NEXT_PUBLIC_APP_URL}/groups/${data.groupId}/decisions/${data.decisionId}`}" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              View Details
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">This notification was sent by Fork In The Road - Your group decision app.</p>
          ${
            data.unsubscribeToken
              ? `
            <p style="margin: 5px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?token=${data.unsubscribeToken}" 
                 style="color: #6b7280; text-decoration: underline;">
                Unsubscribe from decision result emails
              </a>
            </p>
          `
              : ''
          }
        </div>
      </div>
    `,
  },
};

// User email notification service class
export class UserEmailNotificationService {
  private resendApiKey: string;
  private fromEmail: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    if (!this.resendApiKey) {
      logger.warn(
        'UserEmailNotificationService: RESEND_API_KEY not configured'
      );
    }
  }

  /**
   * Send a user email notification
   */
  async sendUserNotification(
    data: UserEmailData
  ): Promise<EmailDeliveryStatus> {
    try {
      if (!this.resendApiKey) {
        logger.error(
          'UserEmailNotificationService: Cannot send email - RESEND_API_KEY not configured'
        );
        return {
          success: false,
          error: 'Email service not configured',
          timestamp: new Date(),
        };
      }

      if (!data.recipientEmail) {
        logger.error(
          'UserEmailNotificationService: No recipient email provided',
          { emailType: data.type }
        );
        return {
          success: false,
          error: 'No recipient email provided',
          timestamp: new Date(),
        };
      }

      const template = USER_EMAIL_TEMPLATES[data.type];
      if (!template) {
        logger.error(
          'UserEmailNotificationService: No template found for email type',
          { emailType: data.type }
        );
        return {
          success: false,
          error: 'No template found for email type',
          timestamp: new Date(),
        };
      }

      // Generate subject based on email type
      let subject: string;
      switch (data.type) {
        case 'group_decision':
          subject = USER_EMAIL_TEMPLATES.group_decision.subject(
            data.groupName || 'Group',
            (data.decisionType as 'tiered' | 'random') || 'random'
          );
          break;
        case 'friend_request':
          subject = USER_EMAIL_TEMPLATES.friend_request.subject(
            data.requesterName || 'Someone'
          );
          break;
        case 'group_invitation':
          subject = USER_EMAIL_TEMPLATES.group_invitation.subject(
            data.groupName || 'Group',
            data.inviterName || 'Someone'
          );
          break;
        case 'decision_result':
          subject = USER_EMAIL_TEMPLATES.decision_result.subject(
            data.groupName || 'Group',
            data.restaurantName || 'Restaurant'
          );
          break;
        default:
          subject = 'Fork In The Road Notification';
      }

      const emailData = {
        from: this.fromEmail,
        to: [data.recipientEmail],
        subject,
        html: template.template(data),
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('UserEmailNotificationService: Failed to send email', {
          status: response.status,
          error: errorData,
          emailType: data.type,
          recipient: data.recipientEmail,
        });
        return {
          success: false,
          error: `Failed to send email: ${response.status}`,
          timestamp: new Date(),
        };
      }

      const result = await response.json();
      logger.info('UserEmailNotificationService: Email sent successfully', {
        emailType: data.type,
        recipient: data.recipientEmail,
        emailId: result.id,
      });

      // Track API usage for cost monitoring
      try {
        const { trackAPIUsage } = await import('./api-usage-tracker');
        await trackAPIUsage('resend_email_sent', false, {
          type: data.type,
          recipient: data.recipientEmail,
        });
      } catch (error) {
        logger.error('Failed to track email API usage:', error);
      }

      return {
        success: true,
        emailId: result.id,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(
        'UserEmailNotificationService: Error sending user email notification',
        {
          error,
          emailType: data.type,
          recipient: data.recipientEmail,
        }
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send a test user email to verify configuration
   */
  async sendTestUserEmail(recipient: string): Promise<EmailDeliveryStatus> {
    try {
      const testData: UserEmailData = {
        type: 'group_decision',
        recipientEmail: recipient,
        recipientName: 'Test User',
        groupName: 'Test Group',
        groupId: 'test-group-id',
        decisionId: 'test-decision-id',
        decisionType: 'tiered',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };

      return await this.sendUserNotification(testData);
    } catch (error) {
      logger.error('UserEmailNotificationService: Error sending test email', {
        error,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Validate email configuration
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    return await emailNotificationService.validateConfiguration();
  }
}

// Singleton instance
export const userEmailNotificationService = new UserEmailNotificationService();
