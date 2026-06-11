/**
 * Cron Route Authentication Tests
 *
 * Verifies that both cron endpoints require the CRON_SECRET bearer token,
 * reject missing/incorrect secrets with 401, and fail with 500 when the
 * secret is not configured.
 */

import { NextRequest } from 'next/server';
import {
  GET as performanceMetricsCron,
  POST as performanceMetricsCronPost,
} from '../cron/performance-metrics/route';
import { GET as vercelMonitoringCron } from '../cron/vercel-monitoring/route';
import { collectAllMetrics, healthCheck } from '@/lib/metrics-collector';
import { checkVercelUsage } from '@/app/api/monitoring/vercel-usage/route';

// Mock the metrics collector
jest.mock('@/lib/metrics-collector', () => ({
  collectAllMetrics: jest.fn(),
  healthCheck: jest.fn(),
}));

// Mock the vercel usage monitoring module (dynamically imported by the cron route)
jest.mock('@/app/api/monitoring/vercel-usage/route', () => ({
  checkVercelUsage: jest.fn(),
}));

const CRON_SECRET = 'test-cron-secret';

const buildRequest = (url: string, authHeader?: string) =>
  new NextRequest(
    url,
    authHeader ? { headers: { authorization: authHeader } } : undefined
  );

describe('Cron route authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
  });

  afterAll(() => {
    delete process.env.CRON_SECRET;
  });

  describe('GET /api/cron/performance-metrics', () => {
    const url = 'http://localhost:3000/api/cron/performance-metrics';

    it('returns 500 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;

      const response = await performanceMetricsCron(
        buildRequest(url, `Bearer ${CRON_SECRET}`)
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server misconfiguration');
      expect(collectAllMetrics).not.toHaveBeenCalled();
    });

    it('returns 401 when authorization header is missing', async () => {
      const response = await performanceMetricsCron(buildRequest(url));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(collectAllMetrics).not.toHaveBeenCalled();
    });

    it('returns 401 when the secret is wrong', async () => {
      const response = await performanceMetricsCron(
        buildRequest(url, 'Bearer wrong-secret')
      );

      expect(response.status).toBe(401);
      expect(collectAllMetrics).not.toHaveBeenCalled();
    });

    it('returns 401 for a wrong secret of the same length', async () => {
      const sameLengthSecret = 'x'.repeat(CRON_SECRET.length);
      const response = await performanceMetricsCron(
        buildRequest(url, `Bearer ${sameLengthSecret}`)
      );

      expect(response.status).toBe(401);
      expect(collectAllMetrics).not.toHaveBeenCalled();
    });

    it('runs the collection when the secret is correct', async () => {
      (healthCheck as jest.Mock).mockResolvedValue(true);
      (collectAllMetrics as jest.Mock).mockResolvedValue({
        success: true,
        date: '2026-06-11',
        metrics: {},
      });

      const response = await performanceMetricsCron(
        buildRequest(url, `Bearer ${CRON_SECRET}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(collectAllMetrics).toHaveBeenCalled();
    });

    it('POST enforces the same secret check', async () => {
      const response = await performanceMetricsCronPost(
        buildRequest(url, 'Bearer wrong-secret')
      );

      expect(response.status).toBe(401);
      expect(collectAllMetrics).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/cron/vercel-monitoring', () => {
    const url = 'http://localhost:3000/api/cron/vercel-monitoring';

    it('returns 500 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;

      const response = await vercelMonitoringCron(
        buildRequest(url, `Bearer ${CRON_SECRET}`)
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server misconfiguration');
      expect(checkVercelUsage).not.toHaveBeenCalled();
    });

    it('returns 401 when authorization header is missing', async () => {
      const response = await vercelMonitoringCron(buildRequest(url));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(checkVercelUsage).not.toHaveBeenCalled();
    });

    it('returns 401 when the secret is wrong', async () => {
      const response = await vercelMonitoringCron(
        buildRequest(url, 'Bearer wrong-secret')
      );

      expect(response.status).toBe(401);
      expect(checkVercelUsage).not.toHaveBeenCalled();
    });

    it('runs the usage check when the secret is correct', async () => {
      (checkVercelUsage as jest.Mock).mockResolvedValue(undefined);

      const response = await vercelMonitoringCron(
        buildRequest(url, `Bearer ${CRON_SECRET}`)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(checkVercelUsage).toHaveBeenCalled();
    });
  });
});
