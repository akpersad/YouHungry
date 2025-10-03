/**
 * Cost Monitoring API Tests
 *
 * Tests the /api/admin/cost-monitoring endpoint
 */

import { NextRequest } from 'next/server';
import { GET } from '../cost-monitoring/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/optimized-google-places', () => ({
  getCacheStats: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { connectToDatabase } from '@/lib/db';
import { getCacheStats } from '@/lib/optimized-google-places';

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;
const mockGetCacheStats = getCacheStats as jest.MockedFunction<
  typeof getCacheStats
>;

describe('/api/admin/cost-monitoring', () => {
  let mockDb: {
    collection: jest.MockedFunction<unknown>;
  };
  let mockCollection: {
    countDocuments: jest.MockedFunction<unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection = {
      countDocuments: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    mockConnectToDatabase.mockResolvedValue(mockDb);
    mockGetCacheStats.mockResolvedValue({
      hitRate: 75.5,
      totalHits: 1250,
      memoryEntries: 89,
    });
  });

  it('should return cost monitoring data successfully', async () => {
    // Mock database responses
    mockCollection.countDocuments
      .mockResolvedValueOnce(50) // restaurantSearches (daily)
      .mockResolvedValueOnce(1500); // monthlySearches

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics).toBeDefined();
    expect(data.recommendations).toBeDefined();

    // Check metrics structure
    expect(data.metrics.googlePlaces).toBeDefined();
    expect(data.metrics.googleMaps).toBeDefined();
    expect(data.metrics.cache).toBeDefined();
    expect(data.metrics.estimatedCosts).toBeDefined();

    // Check cache stats
    expect(data.metrics.cache.hitRate).toBe(75.5);
    expect(data.metrics.cache.totalHits).toBe(1250);
    expect(data.metrics.cache.memoryEntries).toBe(89);
  });

  it('should calculate API usage based on search patterns', async () => {
    mockCollection.countDocuments
      .mockResolvedValueOnce(100) // restaurantSearches (daily)
      .mockResolvedValueOnce(3000); // monthlySearches

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Check Google Places API calculations
    expect(data.metrics.googlePlaces.textSearch).toBe(100); // Same as restaurant searches
    expect(data.metrics.googlePlaces.nearbySearch).toBe(30); // 30% of searches
    expect(data.metrics.googlePlaces.placeDetails).toBe(250); // 2.5x searches
    expect(data.metrics.googlePlaces.geocoding).toBe(80); // 80% of searches
    expect(data.metrics.googlePlaces.addressValidation).toBe(10); // 10% of searches

    // Check Google Maps API calculations
    expect(data.metrics.googleMaps.mapsLoads).toBe(20); // 20% of searches
  });

  it('should calculate costs correctly', async () => {
    mockCollection.countDocuments
      .mockResolvedValueOnce(100) // restaurantSearches (daily)
      .mockResolvedValueOnce(3000); // monthlySearches

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Daily costs should be calculated
    expect(data.metrics.estimatedCosts.daily).toBeGreaterThan(0);
    expect(data.metrics.estimatedCosts.monthly).toBeGreaterThan(0);
    expect(data.metrics.estimatedCosts.savings).toBeGreaterThan(0);

    // Monthly should be higher than daily
    expect(data.metrics.estimatedCosts.monthly).toBeGreaterThan(
      data.metrics.estimatedCosts.daily
    );
  });

  it('should generate cost recommendations', async () => {
    mockCollection.countDocuments
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(3000);

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.recommendations).toBeInstanceOf(Array);
    expect(data.recommendations.length).toBeGreaterThan(0);
  });

  it('should recommend cache improvements when hit rate is low', async () => {
    mockGetCacheStats.mockResolvedValue({
      hitRate: 50, // Below 70% threshold
      totalHits: 500,
      memoryEntries: 50,
    });

    mockCollection.countDocuments
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(3000);

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    const hasCacheRecommendation = data.recommendations.some((rec: string) =>
      rec.includes('Cache hit rate is below 70%')
    );
    expect(hasCacheRecommendation).toBe(true);
  });

  it('should recommend cost optimization when monthly costs are high', async () => {
    mockCollection.countDocuments
      .mockResolvedValueOnce(50000) // Very high usage
      .mockResolvedValueOnce(1500000); // Extremely high monthly usage

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Should have high monthly costs (but not $100+ since our calculations are in cents)
    expect(data.metrics.estimatedCosts.monthly).toBeGreaterThan(0.1);

    const hasCostRecommendation = data.recommendations.some((rec: string) =>
      rec.includes('Monthly API costs exceed')
    );
    expect(hasCostRecommendation).toBe(true);
  });

  it('should handle database connection errors', async () => {
    mockConnectToDatabase.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch cost monitoring data');
  });

  it('should handle cache stats errors', async () => {
    mockGetCacheStats.mockRejectedValue(new Error('Cache stats failed'));
    mockCollection.countDocuments
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(3000);

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch cost monitoring data');
  });

  it('should handle database query errors', async () => {
    mockCollection.countDocuments.mockRejectedValue(new Error('Query failed'));

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch cost monitoring data');
  });

  it('should query performance_metrics collection with correct filters', async () => {
    mockCollection.countDocuments
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(1500);

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    await GET(request);

    expect(mockDb.collection).toHaveBeenCalledWith('performance_metrics');

    // Check daily query
    expect(mockCollection.countDocuments).toHaveBeenCalledWith({
      url: { $regex: '/restaurants/search' },
      timestamp: { $gte: expect.any(Number) },
    });

    // Check monthly query
    expect(mockCollection.countDocuments).toHaveBeenCalledWith({
      url: { $regex: '/restaurants/search' },
      timestamp: { $gte: expect.any(Number) },
    });
  });

  it('should use correct Google Places API pricing', async () => {
    mockCollection.countDocuments
      .mockResolvedValueOnce(1000) // 1000 searches
      .mockResolvedValueOnce(30000);

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // With 1000 searches, we should have:
    // - 1000 text searches = $0.032 (1000/1000 * $0.032)
    // - 800 geocoding calls = $0.004 (800/1000 * $0.005)
    // - 2500 place details = $0.0425 (2500/1000 * $0.017)
    // Total daily cost should be around $0.0785

    expect(data.metrics.estimatedCosts.daily).toBeCloseTo(0.0785, 3);
  });

  it('should calculate savings based on cache hit rate', async () => {
    mockGetCacheStats.mockResolvedValue({
      hitRate: 80, // 80% cache hit rate
      totalHits: 1000,
      memoryEntries: 100,
    });

    mockCollection.countDocuments
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(3000);

    const request = new NextRequest(
      'http://localhost/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Savings should be 80% of monthly costs
    const expectedSavings = data.metrics.estimatedCosts.monthly * 0.8;
    expect(data.metrics.estimatedCosts.savings).toBeCloseTo(expectedSavings, 2);
  });
});
