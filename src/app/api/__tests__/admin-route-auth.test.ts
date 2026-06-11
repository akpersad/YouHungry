/**
 * Admin Route Authorization Tests
 *
 * Verifies that every admin/monitoring route rejects non-admin users with a
 * 403 response, that the cost-monitoring internal-call bypass still works,
 * and that responses no longer leak sensitive data (phone numbers, emails).
 */

import { NextRequest } from 'next/server';
import { requireAdminAuth, requireAuth } from '@/lib/auth';
import {
  GET as getAlerts,
  POST as createAlert,
  PUT as updateAlert,
  DELETE as deleteAlert,
} from '../admin/alerts/route';
import {
  GET as validateEmailConfig,
  POST as sendTestEmail,
} from '../admin/alerts/test-email/route';
import {
  GET as getSettings,
  PUT as updateSettings,
  POST as resetSettings,
} from '../admin/settings/route';
import { GET as comparePerformance } from '../admin/performance/compare/route';
import { GET as getPerformanceMetrics } from '../admin/performance/metrics/route';
import { GET as getCostMonitoring } from '../admin/cost-monitoring/route';
import {
  GET as checkVercelUsageEndpoint,
  POST as getVercelUsageEndpoint,
} from '../monitoring/vercel-usage/route';
import { GET as getUsageAnalytics } from '../admin/analytics/usage/route';
import { GET as getDatabaseStats } from '../admin/database/stats/route';
import { GET as searchUsers } from '../admin/users/search/route';
import { GET as getUserStats } from '../admin/users/stats/route';
import {
  PATCH as updateErrorGroup,
  DELETE as deleteErrorGroup,
} from '../admin/errors/[fingerprint]/route';
import { GET as getSmsStatus, POST as sendAdminSms } from '../admin/sms/route';
import { getAPIUsageStats } from '@/lib/api-usage-tracker';
import { getCacheStats } from '@/lib/optimized-google-places';
import { getLocationCacheStats } from '@/lib/google-places';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requireAdminAuth: jest.fn(),
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock email notifications
jest.mock('@/lib/email-notifications', () => ({
  emailNotificationService: {
    sendAlertNotification: jest.fn(),
    validateConfiguration: jest.fn(),
    sendTestEmail: jest.fn(),
  },
}));

// Mock alert storage
jest.mock('@/lib/alert-storage', () => ({
  alertStorage: new Map(),
}));

// Mock performance metrics
jest.mock('@/lib/performance-metrics', () => ({
  getRecentPerformanceMetrics: jest.fn(),
  comparePerformanceMetrics: jest.fn(),
}));

// Mock API usage tracking
jest.mock('@/lib/api-usage-tracker', () => ({
  getAPIUsageStats: jest.fn(),
  getAvailableDataYears: jest.fn(),
}));

// Mock Google Places caches
jest.mock('@/lib/optimized-google-places', () => ({
  getCacheStats: jest.fn(),
}));

jest.mock('@/lib/google-places', () => ({
  getLocationCacheStats: jest.fn(),
}));

// Mock SMS notifications
jest.mock('@/lib/sms-notifications', () => ({
  smsNotifications: {
    isConfigured: jest.fn(),
    sendTestSMS: jest.fn(),
    sendAdminAlert: jest.fn(),
    sendSMS: jest.fn(),
  },
}));

const mockAdminUser = {
  _id: '507f1f77bcf86cd799439011',
  clerkId: 'user_admin',
  email: 'admin@example.com',
  name: 'Admin User',
};

const mockNonAdminUser = {
  _id: '507f1f77bcf86cd799439099',
  clerkId: 'user_regular',
  email: 'user@example.com',
  name: 'Regular User',
};

describe('Admin route authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: caller is NOT an admin
    (requireAdminAuth as jest.Mock).mockRejectedValue(
      new Error('Admin access required')
    );
    (requireAuth as jest.Mock).mockResolvedValue(mockNonAdminUser);
  });

  describe('returns 403 for non-admin users', () => {
    it('GET /api/admin/alerts', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/alerts');
      const response = await getAlerts(request);
      expect(response.status).toBe(403);
      expect((await response.json()).error).toBe('Unauthorized');
    });

    it('POST /api/admin/alerts', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        { method: 'POST', body: JSON.stringify({}) }
      );
      const response = await createAlert(request);
      expect(response.status).toBe(403);
    });

    it('PUT /api/admin/alerts', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts',
        { method: 'PUT', body: JSON.stringify({}) }
      );
      const response = await updateAlert(request);
      expect(response.status).toBe(403);
    });

    it('DELETE /api/admin/alerts', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts?id=alert_1',
        { method: 'DELETE' }
      );
      const response = await deleteAlert(request);
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/alerts/test-email', async () => {
      const response = await validateEmailConfig();
      expect(response.status).toBe(403);
    });

    it('POST /api/admin/alerts/test-email', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/alerts/test-email',
        { method: 'POST', body: JSON.stringify({ recipient: 'a@b.com' }) }
      );
      const response = await sendTestEmail(request);
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/settings', async () => {
      const response = await getSettings();
      expect(response.status).toBe(403);
    });

    it('PUT /api/admin/settings', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        { method: 'PUT', body: JSON.stringify({ settings: {} }) }
      );
      const response = await updateSettings(request);
      expect(response.status).toBe(403);
    });

    it('POST /api/admin/settings', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings',
        { method: 'POST', body: JSON.stringify({ confirmReset: true }) }
      );
      const response = await resetSettings(request);
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/performance/compare', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/performance/compare?days=1'
      );
      const response = await comparePerformance(request);
      expect(response.status).toBe(403);
      expect((await response.json()).error).toBe('Unauthorized');
    });

    it('GET /api/admin/performance/metrics', async () => {
      const response = await getPerformanceMetrics();
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/cost-monitoring (no internal secret)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/cost-monitoring'
      );
      const response = await getCostMonitoring(request);
      expect(response.status).toBe(403);
      expect(requireAdminAuth).toHaveBeenCalled();
    });

    it('GET /api/monitoring/vercel-usage', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/vercel-usage'
      );
      const response = await checkVercelUsageEndpoint(request);
      expect(response.status).toBe(403);
    });

    it('POST /api/monitoring/vercel-usage', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/vercel-usage',
        { method: 'POST' }
      );
      const response = await getVercelUsageEndpoint(request);
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/analytics/usage', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/analytics/usage?period=7d'
      );
      const response = await getUsageAnalytics(request);
      expect(response.status).toBe(403);
      expect((await response.json()).error).toBe('Unauthorized');
    });

    it('GET /api/admin/database/stats', async () => {
      const response = await getDatabaseStats();
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/users/search', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/users/search?q=test'
      );
      const response = await searchUsers(request);
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/users/stats', async () => {
      const response = await getUserStats();
      expect(response.status).toBe(403);
    });

    it('PATCH /api/admin/errors/[fingerprint]', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/errors/abc123',
        { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) }
      );
      const response = await updateErrorGroup(request, {
        params: Promise.resolve({ fingerprint: 'abc123' }),
      });
      expect(response.status).toBe(403);
      expect((await response.json()).error).toBe('Unauthorized');
    });

    it('DELETE /api/admin/errors/[fingerprint]', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/errors/abc123',
        { method: 'DELETE' }
      );
      const response = await deleteErrorGroup(request, {
        params: Promise.resolve({ fingerprint: 'abc123' }),
      });
      expect(response.status).toBe(403);
    });

    it('GET /api/admin/sms (authenticated but not admin)', async () => {
      const response = await getSmsStatus();
      expect(response.status).toBe(403);
      expect((await response.json()).error).toBe('Admin access required');
    });

    it('POST /api/admin/sms (authenticated but not admin)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/sms', {
        method: 'POST',
        body: JSON.stringify({ action: 'test' }),
      });
      const response = await sendAdminSms(request);
      expect(response.status).toBe(403);
    });
  });

  describe('admin and internal access', () => {
    it('GET /api/admin/settings succeeds for admins without exposing hardcoded emails', async () => {
      (requireAdminAuth as jest.Mock).mockResolvedValue(mockAdminUser);

      const response = await getSettings();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(JSON.stringify(data)).not.toContain('akpersad@gmail.com');
    });

    it('GET /api/admin/cost-monitoring allows internal calls with INTERNAL_API_SECRET', async () => {
      process.env.INTERNAL_API_SECRET = 'internal-test-secret';

      (getAPIUsageStats as jest.Mock).mockResolvedValue({
        byType: {},
        totalCost: 0,
        totalCalls: 0,
      });
      (getCacheStats as jest.Mock).mockResolvedValue({
        hitRate: 0,
        totalHits: 0,
        memoryEntries: 0,
      });
      (getLocationCacheStats as jest.Mock).mockResolvedValue({
        totalEntries: 0,
        locationOnlyEntries: 0,
        locationQueryEntries: 0,
        averageRestaurantsPerEntry: 0,
        estimatedSizeKB: 0,
      });
      const { getAvailableDataYears } = jest.requireMock(
        '@/lib/api-usage-tracker'
      );
      (getAvailableDataYears as jest.Mock).mockResolvedValue([2026]);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/cost-monitoring',
        { headers: { 'x-internal-call': 'internal-test-secret' } }
      );
      const response = await getCostMonitoring(request);

      expect(response.status).toBe(200);
      expect(requireAdminAuth).not.toHaveBeenCalled();

      delete process.env.INTERNAL_API_SECRET;
    });

    it('GET /api/admin/sms does not leak phone numbers to admins', async () => {
      // The route reads ADMIN_USER_IDS at module load, so re-import it with
      // the admin env var set
      process.env.ADMIN_USER_IDS = mockAdminUser._id;

      let getSmsStatusAsAdmin: () => Promise<Response>;
      jest.isolateModules(() => {
        const authModule = jest.requireMock('@/lib/auth');
        authModule.requireAuth.mockResolvedValue(mockAdminUser);
        const smsModule = jest.requireMock('@/lib/sms-notifications');
        smsModule.smsNotifications.isConfigured.mockReturnValue(true);
        ({ GET: getSmsStatusAsAdmin } = require('../admin/sms/route'));
      });

      const response = await getSmsStatusAsAdmin!();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configured).toBe(true);
      const body = JSON.stringify(data);
      expect(body).not.toContain('+18777804236');
      expect(body).not.toContain(process.env.TWILIO_PHONE_NUMBER as string);
      expect(data.fromNumber).toBeUndefined();
      expect(data.developmentNumber).toBeUndefined();

      delete process.env.ADMIN_USER_IDS;
    });
  });
});
