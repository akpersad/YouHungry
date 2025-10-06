import { userEmailNotificationService } from '@/lib/user-email-notifications';
import { logger } from '@/lib/logger';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the email notification service
jest.mock('@/lib/email-notifications', () => ({
  emailNotificationService: {
    validateConfiguration: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockEmailNotificationService =
  require('@/lib/email-notifications').emailNotificationService;

describe('UserEmailNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.FROM_EMAIL = 'test@example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.FROM_EMAIL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('sendUserNotification', () => {
    it('should send group decision email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'email-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const emailData = {
        type: 'group_decision' as const,
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        groupName: 'Test Group',
        groupId: 'group-123',
        decisionId: 'decision-123',
        decisionType: 'tiered' as const,
        deadline: new Date('2024-01-01T12:00:00Z'),
      };

      const result =
        await userEmailNotificationService.sendUserNotification(emailData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-123');
      expect(result.timestamp).toBeInstanceOf(Date);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Test Group'),
        })
      );
    });

    it('should send friend request email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'email-456' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const emailData = {
        type: 'friend_request' as const,
        recipientEmail: 'friend@example.com',
        recipientName: 'Friend User',
        requesterName: 'John Doe',
        requesterId: 'user-123',
      };

      const result =
        await userEmailNotificationService.sendUserNotification(emailData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-456');
    });

    it('should send group invitation email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'email-789' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const emailData = {
        type: 'group_invitation' as const,
        recipientEmail: 'invitee@example.com',
        recipientName: 'Invitee User',
        groupName: 'Food Lovers',
        groupId: 'group-456',
        inviterName: 'Jane Smith',
        inviterId: 'user-456',
      };

      const result =
        await userEmailNotificationService.sendUserNotification(emailData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-789');
    });

    it('should send decision result email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'email-101' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const emailData = {
        type: 'decision_result' as const,
        recipientEmail: 'member@example.com',
        recipientName: 'Member User',
        groupName: 'Dinner Club',
        groupId: 'group-789',
        decisionId: 'decision-789',
        restaurantName: 'Pizza Palace',
        restaurantId: 'restaurant-123',
      };

      const result =
        await userEmailNotificationService.sendUserNotification(emailData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-101');
    });

    it('should handle missing API key', async () => {
      // Create a new instance without API key
      const serviceWithoutKey =
        new (require('@/lib/user-email-notifications').UserEmailNotificationService)();
      // Override the API key property
      (serviceWithoutKey as any).resendApiKey = '';

      const emailData = {
        type: 'group_decision' as const,
        recipientEmail: 'test@example.com',
        groupName: 'Test Group',
        groupId: 'group-123',
        decisionId: 'decision-123',
        decisionType: 'tiered' as const,
      };

      const result = await serviceWithoutKey.sendUserNotification(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should handle missing recipient email', async () => {
      const emailData = {
        type: 'group_decision' as const,
        recipientEmail: '',
        groupName: 'Test Group',
        groupId: 'group-123',
        decisionId: 'decision-123',
        decisionType: 'tiered' as const,
      };

      const result =
        await userEmailNotificationService.sendUserNotification(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No recipient email provided');
    });

    it('should handle API error response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Invalid email address' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const emailData = {
        type: 'group_decision' as const,
        recipientEmail: 'invalid-email',
        groupName: 'Test Group',
        groupId: 'group-123',
        decisionId: 'decision-123',
        decisionType: 'tiered' as const,
      };

      const result =
        await userEmailNotificationService.sendUserNotification(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send email: 400');
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const emailData = {
        type: 'group_decision' as const,
        recipientEmail: 'test@example.com',
        groupName: 'Test Group',
        groupId: 'group-123',
        decisionId: 'decision-123',
        decisionType: 'tiered' as const,
      };

      const result =
        await userEmailNotificationService.sendUserNotification(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendTestUserEmail', () => {
    it('should send test email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'test-email-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result =
        await userEmailNotificationService.sendTestUserEmail(
          'test@example.com'
        );

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('test-email-123');
    });

    it('should handle test email error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Test error'));

      const result =
        await userEmailNotificationService.sendTestUserEmail(
          'test@example.com'
        );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration successfully', async () => {
      mockEmailNotificationService.validateConfiguration.mockResolvedValue({
        valid: true,
      });

      const result = await userEmailNotificationService.validateConfiguration();

      expect(result.valid).toBe(true);
    });

    it('should detect invalid API key', async () => {
      mockEmailNotificationService.validateConfiguration.mockResolvedValue({
        valid: false,
        error: 'Invalid RESEND_API_KEY',
      });

      const result = await userEmailNotificationService.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid RESEND_API_KEY');
    });

    it('should handle missing API key', async () => {
      mockEmailNotificationService.validateConfiguration.mockResolvedValue({
        valid: false,
        error: 'RESEND_API_KEY not configured',
      });

      const result = await userEmailNotificationService.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('RESEND_API_KEY not configured');
    });

    it('should handle validation error', async () => {
      mockEmailNotificationService.validateConfiguration.mockRejectedValue(
        new Error('Network error')
      );

      try {
        await userEmailNotificationService.validateConfiguration();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('email templates', () => {
    it('should generate correct subject for group decision', () => {
      const template = require('@/lib/user-email-notifications')
        .USER_EMAIL_TEMPLATES.group_decision;
      const subject = template.subject('Test Group', 'tiered');
      expect(subject).toBe('🍽️ Decision Time in Test Group - Vote Now');
    });

    it('should generate correct subject for friend request', () => {
      const template = require('@/lib/user-email-notifications')
        .USER_EMAIL_TEMPLATES.friend_request;
      const subject = template.subject('John Doe');
      expect(subject).toBe('John Doe wants to be friends on You Hungry?');
    });

    it('should generate correct subject for group invitation', () => {
      const template = require('@/lib/user-email-notifications')
        .USER_EMAIL_TEMPLATES.group_invitation;
      const subject = template.subject('Food Lovers', 'Jane Smith');
      expect(subject).toBe('Jane Smith invited you to join Food Lovers');
    });

    it('should generate correct subject for decision result', () => {
      const template = require('@/lib/user-email-notifications')
        .USER_EMAIL_TEMPLATES.decision_result;
      const subject = template.subject('Dinner Club', 'Pizza Palace');
      expect(subject).toBe('Dinner Club decided: Pizza Palace');
    });
  });
});
