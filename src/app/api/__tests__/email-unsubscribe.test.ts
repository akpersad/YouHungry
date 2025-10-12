import { NextRequest } from 'next/server';
import { GET } from '@/app/api/email/unsubscribe/route';
import { connectToDatabase } from '@/lib/db';

// Mock the database connection
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
import { logger } from '@/lib/logger';
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('/api/email/unsubscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('GET', () => {
    it('should unsubscribe user by email successfully', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        preferences: {
          notificationSettings: {
            emailEnabled: true,
          },
        },
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      mockConnectToDatabase.mockResolvedValue(mockDb as any);

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain('Successfully Unsubscribed');
      expect(html).toContain(
        'You have been unsubscribed from ForkInTheRoad email notifications'
      );

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'user-123' },
        {
          $set: {
            'preferences.notificationSettings.emailEnabled': false,
            updatedAt: expect.any(Date),
          },
        }
      );
    });

    it('should handle user not found', async () => {
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      mockConnectToDatabase.mockResolvedValue(mockDb as any);

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=nonexistent@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(404);
      expect(html).toContain('User not found');
      expect(html).toContain(
        'You may have already unsubscribed or the link is invalid'
      );
    });

    it('should handle token-based unsubscribe (not implemented)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?token=some-token'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(501);
      expect(html).toContain('Token-based unsubscribe is not yet implemented');
    });

    it('should handle missing parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(400);
      expect(html).toContain('Invalid unsubscribe link');
    });

    it('should handle database errors', async () => {
      mockConnectToDatabase.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(500);
      expect(html).toContain(
        'An error occurred while processing your unsubscribe request'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unsubscribe error:',
        expect.any(Error)
      );
    });

    it('should handle update failure', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        preferences: {
          notificationSettings: {
            emailEnabled: true,
          },
        },
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        updateOne: jest.fn().mockResolvedValue({ acknowledged: false }),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      mockConnectToDatabase.mockResolvedValue(mockDb as any);

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain('Successfully Unsubscribed');
      // Even if update fails, we still show success message for better UX
    });

    it('should include proper HTML structure', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        preferences: {
          notificationSettings: {
            emailEnabled: true,
          },
        },
      };

      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      mockConnectToDatabase.mockResolvedValue(mockDb as any);

      const request = new NextRequest(
        'http://localhost:3000/api/email/unsubscribe?email=test@example.com'
      );

      const response = await GET(request);
      const html = await response.text();

      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<title>Unsubscribed - ForkInTheRoad</title>');
      expect(html).toContain('<body style=');
      expect(html).toContain('Return to ForkInTheRoad');
      expect(html).toContain('http://localhost:3000');
    });
  });
});
