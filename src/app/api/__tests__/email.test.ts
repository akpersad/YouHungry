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

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { auth } from '@clerk/nextjs/server';
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockUserEmailService = userEmailNotificationService as jest.Mocked<
  typeof userEmailNotificationService
>;

describe('/api/email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should send test email successfully', async () => {
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      } as any);
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

    it('should handle test email failure', async () => {
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      } as any);
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
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      } as any);
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
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      } as any);
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
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: null,
      } as any);

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
    });

    it('should return 400 for missing email in test action', async () => {
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      } as any);

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

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email address is required for test');
    });

    it('should return 400 for invalid action', async () => {
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      } as any);

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
      (mockAuth as unknown as jest.Mock).mockResolvedValue({
        userId: 'user-123',
      } as any);
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
