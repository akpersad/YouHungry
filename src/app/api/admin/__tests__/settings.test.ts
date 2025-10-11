import { NextRequest } from 'next/server';
import { GET, PUT, POST } from '../settings/route';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('/api/admin/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return default system settings', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings'
      );
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.settings).toBeDefined();
      expect(data.settings.rateLimiting).toBeDefined();
      expect(data.settings.apiKeys).toBeDefined();
      expect(data.settings.alertThresholds).toBeDefined();
      expect(data.settings.notificationSettings).toBeDefined();
      expect(data.settings.maintenance).toBeDefined();
      expect(data.lastUpdated).toBeDefined();
    });
  });

  describe('PUT', () => {
    it('should update system settings successfully', async () => {
      const settings = {
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 100,
          requestsPerHour: 2000,
          requestsPerDay: 20000,
          burstLimit: 200,
        },
        alertThresholds: {
          costAlerts: {
            dailyThreshold: 100,
            monthlyThreshold: 2000,
            enabled: true,
          },
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('System settings updated successfully');
      expect(data.settings).toBeDefined();
    });

    it('should validate rate limiting values', async () => {
      const settings = {
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 0, // Invalid: must be positive
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          burstLimit: 100,
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Rate limiting values must be positive numbers');
    });

    it('should validate cost alert thresholds', async () => {
      const settings = {
        alertThresholds: {
          costAlerts: {
            dailyThreshold: -10, // Invalid: must be non-negative
            monthlyThreshold: 1000,
            enabled: true,
          },
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Cost alert thresholds must be non-negative numbers'
      );
    });

    it('should validate performance alert thresholds', async () => {
      const settings = {
        alertThresholds: {
          performanceAlerts: {
            responseTimeThreshold: 1000,
            errorRateThreshold: 150, // Invalid: must be <= 100
            enabled: true,
          },
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'Performance alert thresholds must be valid numbers'
      );
    });

    it('should validate system alert thresholds', async () => {
      const settings = {
        alertThresholds: {
          systemAlerts: {
            cpuThreshold: 150, // Invalid: must be <= 100
            memoryThreshold: 85,
            diskThreshold: 90,
            enabled: true,
          },
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        'System alert thresholds must be between 0 and 100'
      );
    });

    it('should validate email addresses', async () => {
      const settings = {
        notificationSettings: {
          email: {
            enabled: true,
            recipients: ['invalid-email', 'admin@youhungry.app'],
            frequency: 'immediate',
          },
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email address: invalid-email');
    });

    it('should handle invalid settings format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({ settings: 'invalid' }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid settings format');
    });

    it('should handle missing settings', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify({}),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid settings format');
    });
  });

  describe('POST (Reset)', () => {
    it('should reset settings to defaults with confirmation', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'POST',
          body: JSON.stringify({ confirmReset: true }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('System settings reset to defaults');
      expect(data.settings).toBeDefined();
    });

    it('should require reset confirmation', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'POST',
          body: JSON.stringify({ confirmReset: false }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Reset confirmation required');
    });

    it('should require reset confirmation when not provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Reset confirmation required');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        {
          method: 'PUT',
          body: 'invalid json',
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update system settings');
    });
  });
});
