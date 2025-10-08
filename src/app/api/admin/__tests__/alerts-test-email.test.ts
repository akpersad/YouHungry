import { NextRequest } from 'next/server';
import { GET, POST } from '../alerts/test-email/route';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock email notification service
jest.mock('@/lib/email-notifications', () => ({
  emailNotificationService: {
    validateConfiguration: jest.fn(),
    sendTestEmail: jest.fn(),
  },
}));

import { emailNotificationService } from '@/lib/email-notifications';

const mockEmailService = emailNotificationService as jest.Mocked<
  typeof emailNotificationService
>;

describe('/api/admin/alerts/test-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET (Validate Configuration)', () => {
    it('should return valid configuration', async () => {
      mockEmailService.validateConfiguration.mockResolvedValue({
        valid: true,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email'
      );
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.valid).toBe(true);
      expect(data.message).toBe('Email configuration is valid');
    });

    it('should return invalid configuration with error', async () => {
      mockEmailService.validateConfiguration.mockResolvedValue({
        valid: false,
        error: 'RESEND_API_KEY not configured',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email'
      );
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('RESEND_API_KEY not configured');
      expect(data.message).toBe(
        'Email configuration invalid: RESEND_API_KEY not configured'
      );
    });

    it('should handle validation errors', async () => {
      mockEmailService.validateConfiguration.mockRejectedValue(
        new Error('Network error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email'
      );
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to validate email configuration');
    });
  });

  describe('POST (Send Test Email)', () => {
    it('should send test email successfully', async () => {
      mockEmailService.validateConfiguration.mockResolvedValue({
        valid: true,
      });
      mockEmailService.sendTestEmail.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        {
          method: 'POST',
          body: JSON.stringify({ recipient: 'admin@youhungry.app' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Test email sent successfully');
      expect(mockEmailService.sendTestEmail).toHaveBeenCalledWith(
        'admin@youhungry.app'
      );
    });

    it('should validate email address format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        {
          method: 'POST',
          body: JSON.stringify({ recipient: 'invalid-email' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Valid email address required');
    });

    it('should require recipient email', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Valid email address required');
    });

    it('should handle invalid email configuration', async () => {
      mockEmailService.validateConfiguration.mockResolvedValue({
        valid: false,
        error: 'RESEND_API_KEY not configured',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        {
          method: 'POST',
          body: JSON.stringify({ recipient: 'admin@youhungry.app' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Email configuration invalid: RESEND_API_KEY not configured'
      );
    });

    it('should handle test email failure', async () => {
      mockEmailService.validateConfiguration.mockResolvedValue({
        valid: true,
      });
      mockEmailService.sendTestEmail.mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        {
          method: 'POST',
          body: JSON.stringify({ recipient: 'admin@youhungry.app' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send test email');
    });

    it('should handle test email service errors', async () => {
      mockEmailService.validateConfiguration.mockResolvedValue({
        valid: true,
      });
      mockEmailService.sendTestEmail.mockRejectedValue(
        new Error('Service unavailable')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        {
          method: 'POST',
          body: JSON.stringify({ recipient: 'admin@youhungry.app' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send test email');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        {
          method: 'POST',
          body: 'invalid json',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to send test email');
    });
  });
});
