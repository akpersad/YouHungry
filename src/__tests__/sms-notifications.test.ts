import { smsNotifications } from '@/lib/sms-notifications';

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM1234567890abcdef1234567890abcdef',
        status: 'sent',
      }),
    },
  }));
});

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('SMS Notifications', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: 'AC1234567890abcdef1234567890abcdef', // Fake Twilio SID
      TWILIO_AUTH_TOKEN: 'test_auth_token',
      TWILIO_PHONE_NUMBER: '+18663101886',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration', () => {
    it('should be configured when all environment variables are set', () => {
      expect(smsNotifications.isConfigured()).toBe(true);
    });

    it('should not be configured when environment variables are missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      expect(smsNotifications.isConfigured()).toBe(false);
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate E.164 format phone numbers', () => {
      expect(smsNotifications.validatePhoneNumber('+1234567890')).toBe(true);
      expect(smsNotifications.validatePhoneNumber('+11234567890')).toBe(true);
      expect(smsNotifications.validatePhoneNumber('+12345678901')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(smsNotifications.validatePhoneNumber('1234567890')).toBe(false);
      expect(smsNotifications.validatePhoneNumber('+123')).toBe(false);
      expect(smsNotifications.validatePhoneNumber('invalid')).toBe(false);
    });

    it('should format phone numbers correctly', () => {
      expect(smsNotifications.formatPhoneNumber('1234567890')).toBe(
        '+11234567890'
      );
      expect(smsNotifications.formatPhoneNumber('11234567890')).toBe(
        '+11234567890'
      );
      expect(smsNotifications.formatPhoneNumber('+1234567890')).toBe(
        '+1234567890'
      );
    });
  });

  describe('SMS Sending', () => {
    it('should send SMS successfully', async () => {
      const result = await smsNotifications.sendSMS({
        to: '+18777804236',
        body: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM1234567890abcdef1234567890abcdef');
    });

    it('should fail with invalid phone number', async () => {
      const result = await smsNotifications.sendSMS({
        to: 'invalid',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number format');
    });

    it('should fail when not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;

      const result = await smsNotifications.sendSMS({
        to: '+18777804236',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMS service not configured');
    });
  });

  describe('Predefined Notifications', () => {
    it('should send group decision notification', async () => {
      const result = await smsNotifications.sendGroupDecisionNotification(
        '+18777804236',
        'Test Group',
        'tiered',
        new Date('2024-01-01T12:00:00Z')
      );

      expect(result.success).toBe(true);
    });

    it('should send friend request notification', async () => {
      const result = await smsNotifications.sendFriendRequestNotification(
        '+18777804236',
        'John Doe'
      );

      expect(result.success).toBe(true);
    });

    it('should send group invitation notification', async () => {
      const result = await smsNotifications.sendGroupInvitationNotification(
        '+18777804236',
        'Food Lovers',
        'Jane Smith'
      );

      expect(result.success).toBe(true);
    });

    it('should send admin alert notification', async () => {
      const result = await smsNotifications.sendAdminAlert(
        '+18777804236',
        'cost_spike',
        'Daily costs exceeded threshold'
      );

      expect(result.success).toBe(true);
    });

    it('should send test SMS', async () => {
      const result = await smsNotifications.sendTestSMS('+18777804236');
      expect(result.success).toBe(true);
    });
  });
});
