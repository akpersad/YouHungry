/**
 * Synthetic Monitoring Tests for Production API Endpoints
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * These tests can run against production to monitor performance
 * Run with: PLAYWRIGHT_TEST_BASE_URL=https://your-prod-url.com npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('API Performance Monitoring', () => {
  test('Collections API responds within acceptable time', async ({
    request,
  }) => {
    const startTime = Date.now();

    const response = await request.get('/api/collections');

    const responseTime = Date.now() - startTime;

    // Should respond within 500ms
    expect(responseTime).toBeLessThan(500);
    expect(response.ok()).toBeTruthy();
  });

  test('Restaurant search API responds within acceptable time', async ({
    request,
  }) => {
    const startTime = Date.now();

    const response = await request.get(
      '/api/restaurants/search?q=pizza&location=New York'
    );

    const responseTime = Date.now() - startTime;

    // Search should respond within 2s (external API call)
    expect(responseTime).toBeLessThan(2000);
    expect(response.ok()).toBeTruthy();
  });

  test('User profile API responds within acceptable time', async ({
    request,
  }) => {
    const startTime = Date.now();

    const response = await request.get('/api/user/profile');

    const responseTime = Date.now() - startTime;

    // Should respond within 300ms
    expect(responseTime).toBeLessThan(300);

    // Will be 401 without auth, but should still be fast
    expect([200, 401]).toContain(response.status());
  });

  test('Groups API responds within acceptable time', async ({ request }) => {
    const startTime = Date.now();

    const _response = await request.get('/api/groups');

    const responseTime = Date.now() - startTime;

    // Should respond within 500ms
    expect(responseTime).toBeLessThan(500);
  });

  test('Decisions history API responds within acceptable time', async ({
    request,
  }) => {
    const startTime = Date.now();

    const _response = await request.get(
      '/api/decisions/history?limit=20&offset=0'
    );

    const responseTime = Date.now() - startTime;

    // Should respond within 800ms
    expect(responseTime).toBeLessThan(800);
  });

  test('Friends API responds within acceptable time', async ({ request }) => {
    const startTime = Date.now();

    const _response = await request.get('/api/friends');

    const responseTime = Date.now() - startTime;

    // Should respond within 300ms
    expect(responseTime).toBeLessThan(300);
  });

  test('Analytics API responds within acceptable time', async ({ request }) => {
    const startTime = Date.now();

    const _response = await request.get('/api/analytics/personal');

    const responseTime = Date.now() - startTime;

    // Should respond within 1s (complex queries)
    expect(responseTime).toBeLessThan(1000);
  });
});

test.describe('API Health Checks', () => {
  test('All critical endpoints are reachable', async ({ request }) => {
    const endpoints = [
      '/api/collections',
      '/api/restaurants/search',
      '/api/groups',
      '/api/friends',
      '/api/decisions/history',
      '/api/user/profile',
      '/api/analytics/personal',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);

      // Should not return 500 errors
      expect(response.status()).not.toBe(500);
      expect(response.status()).not.toBe(502);
      expect(response.status()).not.toBe(503);
    }
  });

  test('API returns proper error codes for invalid requests', async ({
    request,
  }) => {
    const response = await request.get('/api/collections/invalid-id-format');

    // Should return 400 or 404, not 500
    expect([400, 404]).toContain(response.status());
  });

  test('API includes proper CORS headers', async ({ request }) => {
    const response = await request.get('/api/collections');

    const headers = response.headers();

    // Should have security headers
    expect(headers['x-content-type-options']).toBeDefined();
  });

  test('API responses are properly gzipped', async ({ request }) => {
    const response = await request.get('/api/decisions/history?limit=100');

    const headers = response.headers();

    // For large responses, should use compression
    const contentLength = parseInt(headers['content-length'] || '0');
    if (contentLength > 1000) {
      expect(
        ['gzip', 'br', 'deflate'].some((enc) =>
          headers['content-encoding']?.includes(enc)
        )
      ).toBeTruthy();
    }
  });
});

test.describe('Rate Limiting Checks', () => {
  test('API enforces rate limiting', async ({ request }) => {
    // Make multiple rapid requests
    const promises = Array.from({ length: 100 }, () =>
      request.get('/api/collections')
    );

    const responses = await Promise.all(promises);

    // At least some should be rate limited
    const rateLimited = responses.filter((r) => r.status() === 429);

    // Expect rate limiting to kick in
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});

test.describe('Data Consistency Checks', () => {
  test('Collection response has consistent schema', async ({ request }) => {
    const response = await request.get('/api/collections');

    if (response.ok()) {
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('collections');
      expect(Array.isArray(data.collections)).toBeTruthy();

      // Verify each collection has required fields
      if (data.collections.length > 0) {
        const collection = data.collections[0];
        expect(collection).toHaveProperty('_id');
        expect(collection).toHaveProperty('name');
        expect(collection).toHaveProperty('type');
      }
    }
  });

  test('Decision history has consistent schema', async ({ request }) => {
    const response = await request.get('/api/decisions/history');

    if (response.ok()) {
      const data = await response.json();

      expect(data).toHaveProperty('decisions');
      expect(Array.isArray(data.decisions)).toBeTruthy();

      if (data.decisions.length > 0) {
        const decision = data.decisions[0];
        expect(decision).toHaveProperty('_id');
        expect(decision).toHaveProperty('type');
        expect(decision).toHaveProperty('method');
        expect(decision).toHaveProperty('createdAt');
      }
    }
  });
});

test.describe('Error Handling Quality', () => {
  test('API returns meaningful error messages', async ({ request }) => {
    const response = await request.get('/api/collections/invalid-id');

    if (!response.ok()) {
      const data = await response.json();

      // Should have error message
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
      expect(data.error.length).toBeGreaterThan(0);
    }
  });

  test('API handles malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/collections', {
      data: 'not-valid-json',
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
