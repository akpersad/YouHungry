import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sms/route';
import { smsNotifications } from '@/lib/sms-notifications';

// Mock the SMS notification service so no real Twilio sends occur
jest.mock('@/lib/sms-notifications', () => ({
  smsNotifications: {
    sendSMS: jest.fn(),
    sendTestSMS: jest.fn(),
    sendGroupDecisionNotification: jest.fn(),
    sendFriendRequestNotification: jest.fn(),
    sendGroupInvitationNotification: jest.fn(),
    sendAdminAlert: jest.fn(),
    getServiceInfo: jest.fn(),
  },
}));

// Mock auth helpers
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  isAdminUser: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the rate limiter (keep the real key helpers + 429 response builder)
jest.mock('@/lib/rate-limit', () => {
  const actual = jest.requireActual('@/lib/rate-limit');
  return { ...actual, checkRateLimit: jest.fn() };
});

import { checkRateLimit } from '@/lib/rate-limit';
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

import { getCurrentUser, isAdminUser } from '@/lib/auth';
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockIsAdminUser = isAdminUser as jest.MockedFunction<typeof isAdminUser>;
const mockSmsNotifications = smsNotifications as jest.Mocked<
  typeof smsNotifications
>;

const OWN_PHONE = '+15551234567';
const FOREIGN_PHONE = '+15559876543';

const verifiedUser = {
  _id: { toString: () => 'user-123' },
  clerkId: 'clerk-123',
  email: 'test@example.com',
  name: 'Test User',
  smsOptIn: true,
  smsPhoneNumber: OWN_PHONE,
  phoneVerified: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const unverifiedUser = {
  ...verifiedUser,
  smsPhoneNumber: undefined,
  phoneNumber: undefined,
  phoneVerified: false,
};

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/sms', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const successResult = { success: true, messageId: 'sms-123' };

describe('/api/sms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAdminUser.mockReturnValue(false);
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 0,
    });
  });

  describe('POST', () => {
    it('should return 429 when the per-user rate limit is exceeded', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 1800,
      });

      const response = await POST(
        makeRequest({ action: 'custom', phoneNumber: OWN_PHONE, message: 'x' })
      );
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('1800');
      expect(data.error).toBe('Too many requests. Please try again later.');
      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        key: 'sms-send:user:user-123',
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });
      expect(mockSmsNotifications.sendSMS).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const response = await POST(
        makeRequest({ action: 'custom', phoneNumber: OWN_PHONE, message: 'x' })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockSmsNotifications.sendSMS).not.toHaveBeenCalled();
    });

    it('should return 400 when no action is provided', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);

      const response = await POST(makeRequest({}));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Action is required');
    });

    it('should reject sends to phone numbers other than the user own verified number', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);

      const response = await POST(
        makeRequest({
          action: 'custom',
          phoneNumber: FOREIGN_PHONE,
          message: 'hello',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        'SMS can only be sent to your own verified phone number'
      );
      expect(mockSmsNotifications.sendSMS).not.toHaveBeenCalled();
    });

    it('should allow sends to the user own verified phone number', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockSmsNotifications.sendSMS.mockResolvedValue(successResult);

      const response = await POST(
        makeRequest({
          action: 'custom',
          phoneNumber: OWN_PHONE,
          message: 'hello',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSmsNotifications.sendSMS).toHaveBeenCalledWith({
        to: OWN_PHONE,
        body: 'hello',
      });
    });

    it('should treat differently formatted versions of the own number as a match', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockSmsNotifications.sendSMS.mockResolvedValue(successResult);

      const response = await POST(
        makeRequest({
          action: 'custom',
          phoneNumber: '(555) 123-4567',
          message: 'hello',
        })
      );

      expect(response.status).toBe(200);
      // The profile number is used as the actual target
      expect(mockSmsNotifications.sendSMS).toHaveBeenCalledWith({
        to: OWN_PHONE,
        body: 'hello',
      });
    });

    it('should default to the user own verified phone when none is supplied', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockSmsNotifications.sendGroupDecisionNotification.mockResolvedValue(
        successResult
      );

      const response = await POST(
        makeRequest({
          action: 'group_decision',
          groupName: 'Test Group',
          decisionType: 'tiered',
          deadline: new Date().toISOString(),
        })
      );

      expect(response.status).toBe(200);
      expect(
        mockSmsNotifications.sendGroupDecisionNotification
      ).toHaveBeenCalledWith(
        OWN_PHONE,
        'Test Group',
        'tiered',
        expect.any(Date),
        undefined
      );
    });

    it('should return 400 when the user has no verified phone number', async () => {
      mockGetCurrentUser.mockResolvedValue(unverifiedUser);

      const response = await POST(makeRequest({ action: 'test' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No verified phone number on your profile');
      expect(mockSmsNotifications.sendTestSMS).not.toHaveBeenCalled();
    });

    it('should send test SMS to the user own verified phone, not a hardcoded number', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockSmsNotifications.sendTestSMS.mockResolvedValue(successResult);

      const response = await POST(makeRequest({ action: 'test' }));

      expect(response.status).toBe(200);
      expect(mockSmsNotifications.sendTestSMS).toHaveBeenCalledWith(OWN_PHONE);
    });

    it('should reject admin_alert for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);

      const response = await POST(
        makeRequest({
          action: 'admin_alert',
          phoneNumber: OWN_PHONE,
          alertType: 'cost_spike',
          details: 'details',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(mockSmsNotifications.sendAdminAlert).not.toHaveBeenCalled();
    });

    it('should allow admins to send to arbitrary phone numbers', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockIsAdminUser.mockReturnValue(true);
      mockSmsNotifications.sendSMS.mockResolvedValue(successResult);

      const response = await POST(
        makeRequest({
          action: 'custom',
          phoneNumber: FOREIGN_PHONE,
          message: 'ops message',
        })
      );

      expect(response.status).toBe(200);
      expect(mockSmsNotifications.sendSMS).toHaveBeenCalledWith({
        to: FOREIGN_PHONE,
        body: 'ops message',
      });
    });

    it('should allow admins to send admin alerts', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockIsAdminUser.mockReturnValue(true);
      mockSmsNotifications.sendAdminAlert.mockResolvedValue(successResult);

      const response = await POST(
        makeRequest({
          action: 'admin_alert',
          phoneNumber: FOREIGN_PHONE,
          alertType: 'system_failure',
          details: 'something broke',
        })
      );

      expect(response.status).toBe(200);
      expect(mockSmsNotifications.sendAdminAlert).toHaveBeenCalledWith(
        FOREIGN_PHONE,
        'system_failure',
        'something broke'
      );
    });

    it('should return 400 for invalid action', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);

      const response = await POST(
        makeRequest({ action: 'bogus', phoneNumber: OWN_PHONE })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });

    it('should return 500 when the SMS service fails', async () => {
      mockGetCurrentUser.mockResolvedValue(verifiedUser);
      mockSmsNotifications.sendSMS.mockResolvedValue({
        success: false,
        error: 'Twilio error',
      });

      const response = await POST(
        makeRequest({
          action: 'custom',
          phoneNumber: OWN_PHONE,
          message: 'hello',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Twilio error');
    });
  });
});
