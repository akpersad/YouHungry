import { NextRequest } from 'next/server';
import { POST } from '@/app/api/email/route';
import { userEmailNotificationService } from '@/lib/user-email-notifications';

// Mock the user email notification service
jest.mock('@/lib/user-email-notifications', () => ({
  userEmailNotificationService: {
    sendTestUserEmail: jest.fn(),
    validateConfiguration: jest.fn(),
  },
}));

// Mock auth helpers
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { getCurrentUser } from '@/lib/auth';
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockUserEmailService = userEmailNotificationService as jest.Mocked<
  typeof userEmailNotificationService
>;

const mockUser = {
  _id: { toString: () => 'user-123' },
  clerkId: 'clerk-123',
  email: 'test@example.com',
  name: 'Test User',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('/api/email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should send test email to the authenticated user own email', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserEmailService.sendTestUserEmail.mockResolvedValue({
        success: true,
        emailId: 'email-123',
        timestamp: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          email: 'test@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Test email sent successfully');
      expect(data.emailId).toBe('email-123');
      expect(mockUserEmailService.sendTestUserEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('should default to the authenticated user email when none is provided', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserEmailService.sendTestUserEmail.mockResolvedValue({
        success: true,
        emailId: 'email-456',
        timestamp: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUserEmailService.sendTestUserEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('should reject test emails to addresses other than the authenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          email: 'victim@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        'Test emails can only be sent to your own email address'
      );
      expect(mockUserEmailService.sendTestUserEmail).not.toHaveBeenCalled();
    });

    it('should allow case-insensitive matches of the user own email', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserEmailService.sendTestUserEmail.mockResolvedValue({
        success: true,
        emailId: 'email-789',
        timestamp: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          email: 'Test@Example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUserEmailService.sendTestUserEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('should handle test email failure', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserEmailService.sendTestUserEmail.mockResolvedValue({
        success: false,
        error: 'Failed to send email',
        timestamp: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          email: 'test@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to send test email');
      expect(data.error).toBe('Failed to send email');
    });

    it('should validate configuration successfully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserEmailService.validateConfiguration.mockResolvedValue({
        valid: true,
      });

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'validate',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(mockUserEmailService.validateConfiguration).toHaveBeenCalled();
    });

    it('should handle validation failure', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserEmailService.validateConfiguration.mockResolvedValue({
        valid: false,
        error: 'API key not configured',
      });

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'validate',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('API key not configured');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          email: 'test@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockUserEmailService.sendTestUserEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid action', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Invalid action. Supported actions: test, validate'
      );
    });

    it('should handle service errors', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockUserEmailService.sendTestUserEmail.mockRejectedValue(
        new Error('Service error')
      );

      const request = new NextRequest('http://localhost:3000/api/email', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          email: 'test@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
