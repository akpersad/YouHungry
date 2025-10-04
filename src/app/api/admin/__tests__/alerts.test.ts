import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE, clearAlertStorage } from '../alerts/route';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock fetch for email notifications
global.fetch = jest.fn();

describe('/api/admin/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    clearAlertStorage(); // Clear alert storage before each test
  });

  describe('GET', () => {
    it('should return empty alerts list initially', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/alerts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alerts).toEqual([]);
      expect(data.stats).toBeDefined();
      expect(data.stats.total).toBe(0);
      expect(data.pagination).toBeDefined();
    });

    it('should filter alerts by severity', async () => {
      // First create some alerts
      const alertData1 = {
        type: 'cost_threshold_exceeded',
        severity: 'high',
        title: 'High Cost Alert',
        message: 'Daily cost exceeded',
        timestamp: new Date(),
      };

      const alertData2 = {
        type: 'performance_degradation',
        severity: 'low',
        title: 'Low Performance Alert',
        message: 'Response time increased',
        timestamp: new Date(),
      };

      // Create alerts
      await POST(
        new NextRequest('http://localhost:3000/api/admin/alerts', {
          method: 'POST',
          body: JSON.stringify({ alertData: alertData1 }),
        })
      );

      await POST(
        new NextRequest('http://localhost:3000/api/admin/alerts', {
          method: 'POST',
          body: JSON.stringify({ alertData: alertData2 }),
        })
      );

      // Filter by high severity
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts?severity=high'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alerts.length).toBe(1);
      expect(data.alerts[0].severity).toBe('high');
    });

    it('should filter alerts by acknowledged status', async () => {
      // Create an alert
      const alertData = {
        type: 'cost_threshold_exceeded',
        severity: 'high',
        title: 'Cost Alert',
        message: 'Daily cost exceeded',
        timestamp: new Date(),
      };

      const createResponse = await POST(
        new NextRequest('http://localhost:3000/api/admin/alerts', {
          method: 'POST',
          body: JSON.stringify({ alertData, sendEmail: false }),
        })
      );
      await createResponse.json();

      // Filter by unacknowledged
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts?acknowledged=false'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alerts.length).toBeGreaterThan(0);
      expect(
        data.alerts.every(
          (alert: { acknowledged: boolean }) => !alert.acknowledged
        )
      ).toBe(true);
    });

    it('should apply pagination', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts?limit=10&offset=0'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(0);
    });
  });

  describe('POST', () => {
    it('should create a new alert successfully', async () => {
      const alertData = {
        type: 'cost_threshold_exceeded',
        severity: 'high',
        title: 'Daily Cost Exceeded',
        message: 'Daily cost has exceeded the threshold',
        timestamp: new Date(),
        metadata: { dailyCost: 75, threshold: 50 },
        recommendedActions: ['Review API usage', 'Implement cost controls'],
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'POST',
          body: JSON.stringify({ alertData }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert).toBeDefined();
      expect(data.alert.id).toBeDefined();
      expect(data.alert.type).toBe('cost_threshold_exceeded');
      expect(data.alert.severity).toBe('high');
      expect(data.alert.acknowledged).toBe(false);
      expect(data.alert.resolved).toBe(false);
    });

    it('should validate required alert fields', async () => {
      const alertData = {
        severity: 'high',
        title: 'Incomplete Alert',
        // Missing type and message
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'POST',
          body: JSON.stringify({ alertData }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required alert fields');
    });

    it('should handle email notification failure gracefully', async () => {
      // Mock fetch to simulate email failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Email service unavailable')
      );

      const alertData = {
        type: 'cost_threshold_exceeded',
        severity: 'high',
        title: 'Cost Alert',
        message: 'Daily cost exceeded',
        timestamp: new Date(),
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'POST',
          body: JSON.stringify({ alertData, sendEmail: true }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Should still create the alert even if email fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert).toBeDefined();
    });
  });

  describe('PUT', () => {
    let alertId: string;

    beforeEach(async () => {
      // Create an alert for testing updates
      const alertData = {
        type: 'cost_threshold_exceeded',
        severity: 'high',
        title: 'Test Alert',
        message: 'Test message',
        timestamp: new Date(),
      };

      const response = await POST(
        new NextRequest('http://localhost:3000/api/admin/alerts', {
          method: 'POST',
          body: JSON.stringify({ alertData }),
        })
      );
      const data = await response.json();
      alertId = data.alert.id;
    });

    it('should acknowledge an alert', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'PUT',
          body: JSON.stringify({
            alertId,
            action: 'acknowledge',
            userId: 'admin',
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert.acknowledged).toBe(true);
      expect(data.alert.acknowledgedBy).toBe('admin');
      expect(data.alert.acknowledgedAt).toBeDefined();
    });

    it('should resolve an alert', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'PUT',
          body: JSON.stringify({
            alertId,
            action: 'resolve',
            userId: 'admin',
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert.resolved).toBe(true);
      expect(data.alert.resolvedBy).toBe('admin');
      expect(data.alert.resolvedAt).toBeDefined();
    });

    it('should handle invalid action', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'PUT',
          body: JSON.stringify({
            alertId,
            action: 'invalid',
            userId: 'admin',
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action');
    });

    it('should handle non-existent alert', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'PUT',
          body: JSON.stringify({
            alertId: 'non-existent-id',
            action: 'acknowledge',
            userId: 'admin',
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Alert not found');
    });
  });

  describe('DELETE', () => {
    let alertId: string;

    beforeEach(async () => {
      // Create an alert for testing deletion
      const alertData = {
        type: 'cost_threshold_exceeded',
        severity: 'high',
        title: 'Test Alert',
        message: 'Test message',
        timestamp: new Date(),
      };

      const response = await POST(
        new NextRequest('http://localhost:3000/api/admin/alerts', {
          method: 'POST',
          body: JSON.stringify({ alertData }),
        })
      );
      const data = await response.json();
      alertId = data.alert.id;
    });

    it('should delete an alert successfully', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/alerts?id=${alertId}`,
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Alert deleted successfully');
    });

    it('should handle missing alert ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Alert ID required');
    });

    it('should handle non-existent alert', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts?id=non-existent-id',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Alert not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'POST',
          body: 'invalid json',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create alert');
    });

    it('should handle malformed JSON in PUT', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        {
          method: 'PUT',
          body: 'invalid json',
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update alert');
    });
  });
});
