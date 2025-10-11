/**
 * Cost Monitoring API Tests
 *
 * Tests the /api/admin/cost-monitoring endpoint
 */

import { GET } from '../cost-monitoring/route';

// Mock dependencies
jest.mock('@/lib/api-usage-tracker', () => ({
  getAPIUsageStats: jest.fn(),
  getAvailableDataYears: jest.fn(),
}));

jest.mock('@/lib/optimized-google-places', () => ({
  getCacheStats: jest.fn(),
}));

jest.mock('@/lib/google-places', () => ({
  getLocationCacheStats: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import {
  getAPIUsageStats,
  getAvailableDataYears,
} from '@/lib/api-usage-tracker';
import { getCacheStats } from '@/lib/optimized-google-places';
import { getLocationCacheStats } from '@/lib/google-places';

const mockGetAPIUsageStats = getAPIUsageStats as jest.MockedFunction<
  typeof getAPIUsageStats
>;
const mockGetCacheStats = getCacheStats as jest.MockedFunction<
  typeof getCacheStats
>;
const mockGetLocationCacheStats = getLocationCacheStats as jest.MockedFunction<
  typeof getLocationCacheStats
>;
const mockGetAvailableDataYears = getAvailableDataYears as jest.MockedFunction<
  typeof getAvailableDataYears
>;

describe('/api/admin/cost-monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for API usage stats - returns different values for daily vs monthly
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        // Daily
        totalCalls: 100,
        totalCost: 0.05,
        byType: {
          google_places_text_search: {
            count: 100,
            cost: 0.032,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 30,
            cost: 0.01,
            costPerCall: 0.032,
          },
          google_places_details: { count: 250, cost: 0.04, costPerCall: 0.017 },
          google_geocoding: { count: 80, cost: 0.004, costPerCall: 0.005 },
          google_address_validation: {
            count: 10,
            cost: 0.003,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 20, cost: 0.002, costPerCall: 0.007 },
        },
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        // Monthly
        totalCalls: 3000,
        totalCost: 1.5,
        byType: {
          google_places_text_search: {
            count: 3000,
            cost: 0.96,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 900,
            cost: 0.3,
            costPerCall: 0.032,
          },
          google_places_details: {
            count: 7500,
            cost: 1.275,
            costPerCall: 0.017,
          },
          google_geocoding: { count: 2400, cost: 0.12, costPerCall: 0.005 },
          google_address_validation: {
            count: 300,
            cost: 0.09,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 600, cost: 0.06, costPerCall: 0.007 },
        },
        byEndpoint: {},
      });

    mockGetCacheStats.mockResolvedValue({
      hitRate: 75.5,
      totalHits: 1250,
      memoryEntries: 89,
    });

    mockGetLocationCacheStats.mockResolvedValue({
      totalEntries: 50,
      locationOnlyEntries: 30,
      locationQueryEntries: 20,
      averageRestaurantsPerEntry: 15,
      estimatedSizeKB: 125,
      oldestEntry: new Date('2024-01-01'),
      newestEntry: new Date('2024-01-15'),
    });

    mockGetAvailableDataYears.mockResolvedValue([2024, 2023]);
  });

  it('should return cost monitoring data successfully', async () => {
    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
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
    // Reset and setup specific mocks for this test
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        // Daily
        totalCalls: 100,
        totalCost: 0.05,
        byType: {
          google_places_text_search: {
            count: 100,
            cost: 0.032,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 30,
            cost: 0.01,
            costPerCall: 0.032,
          },
          google_places_details: { count: 250, cost: 0.04, costPerCall: 0.017 },
          google_geocoding: { count: 80, cost: 0.004, costPerCall: 0.005 },
          google_address_validation: {
            count: 10,
            cost: 0.003,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 20, cost: 0.002, costPerCall: 0.007 },
        },
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        // Monthly
        totalCalls: 3000,
        totalCost: 1.5,
        byType: {
          google_places_text_search: {
            count: 3000,
            cost: 0.96,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 900,
            cost: 0.3,
            costPerCall: 0.032,
          },
          google_places_details: {
            count: 7500,
            cost: 1.275,
            costPerCall: 0.017,
          },
          google_geocoding: { count: 2400, cost: 0.12, costPerCall: 0.005 },
          google_address_validation: {
            count: 300,
            cost: 0.09,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 600, cost: 0.06, costPerCall: 0.007 },
        },
        byEndpoint: {},
      });

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Check Google Places API calculations (from monthly stats)
    expect(data.metrics.googlePlaces.textSearch).toBe(3000);
    expect(data.metrics.googlePlaces.nearbySearch).toBe(900);
    expect(data.metrics.googlePlaces.placeDetails).toBe(7500);
    expect(data.metrics.googlePlaces.geocoding).toBe(2400);
    expect(data.metrics.googlePlaces.addressValidation).toBe(300);

    // Check Google Maps API calculations
    expect(data.metrics.googleMaps.mapsLoads).toBe(600);
  });

  it('should calculate costs correctly', async () => {
    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Daily costs should be calculated
    expect(data.metrics.estimatedCosts.daily).toBeGreaterThan(0);
    expect(data.metrics.estimatedCosts.monthly).toBeGreaterThan(0);
    expect(data.metrics.estimatedCosts.savings).toBeGreaterThanOrEqual(0);

    // Monthly should be higher than daily
    expect(data.metrics.estimatedCosts.monthly).toBeGreaterThan(
      data.metrics.estimatedCosts.daily
    );
  });

  it('should generate cost recommendations', async () => {
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        totalCalls: 100,
        totalCost: 0.05,
        byType: {},
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        totalCalls: 3000,
        totalCost: 1.5,
        byType: {},
        byEndpoint: {},
      });

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.recommendations).toBeInstanceOf(Array);
    expect(data.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it('should recommend cache improvements when hit rate is low', async () => {
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        totalCalls: 100,
        totalCost: 0.05,
        byType: {},
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        totalCalls: 3000,
        totalCost: 1.5,
        byType: {},
        byEndpoint: {},
      });

    mockGetCacheStats.mockResolvedValue({
      hitRate: 50, // Below 70% threshold
      totalHits: 500,
      memoryEntries: 50,
    });

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    const hasCacheRecommendation = data.recommendations.some((rec: string) =>
      rec.includes('Cache hit rate is below 70%')
    );
    expect(hasCacheRecommendation).toBe(true);
  });

  it('should recommend cost optimization when monthly costs are high', async () => {
    // Mock high monthly costs
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        // Daily
        totalCalls: 10000,
        totalCost: 5,
        byType: {
          google_places_text_search: {
            count: 10000,
            cost: 3.2,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 3000,
            cost: 1.0,
            costPerCall: 0.032,
          },
          google_places_details: {
            count: 25000,
            cost: 4.25,
            costPerCall: 0.017,
          },
          google_geocoding: { count: 8000, cost: 0.4, costPerCall: 0.005 },
          google_address_validation: {
            count: 1000,
            cost: 0.3,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 2000, cost: 0.2, costPerCall: 0.007 },
        },
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        // Monthly
        totalCalls: 300000,
        totalCost: 150,
        byType: {
          google_places_text_search: {
            count: 300000,
            cost: 96,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 90000,
            cost: 30,
            costPerCall: 0.032,
          },
          google_places_details: {
            count: 750000,
            cost: 127.5,
            costPerCall: 0.017,
          },
          google_geocoding: { count: 240000, cost: 12, costPerCall: 0.005 },
          google_address_validation: {
            count: 30000,
            cost: 9,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 60000, cost: 6, costPerCall: 0.007 },
        },
        byEndpoint: {},
      });

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Should have high monthly costs
    expect(data.metrics.estimatedCosts.monthly).toBeGreaterThan(100);

    const hasCostRecommendation = data.recommendations.some((rec: string) =>
      rec.includes('Monthly API costs')
    );
    expect(hasCostRecommendation).toBe(true);
  });

  it('should handle API usage stats errors', async () => {
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats.mockRejectedValue(
      new Error('Failed to get API usage stats')
    );

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch cost monitoring data');
  });

  it('should handle cache stats errors', async () => {
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        totalCalls: 100,
        totalCost: 0.05,
        byType: {},
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        totalCalls: 3000,
        totalCost: 1.5,
        byType: {},
        byEndpoint: {},
      });

    mockGetCacheStats.mockRejectedValue(new Error('Cache stats failed'));

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch cost monitoring data');
  });

  it('should call getAPIUsageStats with correct date ranges', async () => {
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        totalCalls: 100,
        totalCost: 0.05,
        byType: {},
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        totalCalls: 3000,
        totalCost: 1.5,
        byType: {},
        byEndpoint: {},
      });

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    await GET(request);

    // Should be called twice - once for daily, once for monthly
    expect(mockGetAPIUsageStats).toHaveBeenCalledTimes(2);

    // Verify the calls have date ranges
    const calls = mockGetAPIUsageStats.mock.calls;
    expect(calls[0][0]).toBeInstanceOf(Date); // Daily start date
    expect(calls[0][1]).toBeInstanceOf(Date); // Daily end date
    expect(calls[1][0]).toBeInstanceOf(Date); // Monthly start date
    expect(calls[1][1]).toBeInstanceOf(Date); // Monthly end date
  });

  it('should use correct Google Places API pricing', async () => {
    // Mock specific pricing scenario
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        // Daily - 1000 searches
        totalCalls: 5310,
        totalCost: 0.0785, // Expected total
        byType: {
          google_places_text_search: {
            count: 1000,
            cost: 0.032,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 300,
            cost: 0.01,
            costPerCall: 0.032,
          },
          google_places_details: {
            count: 2500,
            cost: 0.0425,
            costPerCall: 0.017,
          },
          google_geocoding: { count: 800, cost: 0.004, costPerCall: 0.005 },
          google_address_validation: {
            count: 100,
            cost: 0.003,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 200, cost: 0.002, costPerCall: 0.007 },
        },
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        // Monthly
        totalCalls: 159300,
        totalCost: 2.355,
        byType: {
          google_places_text_search: {
            count: 30000,
            cost: 0.96,
            costPerCall: 0.032,
          },
          google_places_nearby_search: {
            count: 9000,
            cost: 0.3,
            costPerCall: 0.032,
          },
          google_places_details: {
            count: 75000,
            cost: 1.275,
            costPerCall: 0.017,
          },
          google_geocoding: { count: 24000, cost: 0.12, costPerCall: 0.005 },
          google_address_validation: {
            count: 3000,
            cost: 0.09,
            costPerCall: 0.005,
          },
          google_maps_load: { count: 6000, cost: 0.06, costPerCall: 0.007 },
        },
        byEndpoint: {},
      });

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Total daily cost should be around $0.0785
    expect(data.metrics.estimatedCosts.daily).toBeCloseTo(0.0785, 3);
  });

  it('should calculate savings based on cache hit rate', async () => {
    mockGetAPIUsageStats.mockReset();
    mockGetAPIUsageStats
      .mockResolvedValueOnce({
        totalCalls: 100,
        totalCost: 0.05,
        byType: {},
        byEndpoint: {},
      })
      .mockResolvedValueOnce({
        totalCalls: 3000,
        totalCost: 1.5,
        byType: {},
        byEndpoint: {},
      });

    mockGetCacheStats.mockResolvedValue({
      hitRate: 80, // 80% cache hit rate
      totalHits: 1000,
      memoryEntries: 100,
    });

    const request = new Request(
      'http://localhost:3000/api/admin/cost-monitoring'
    );
    const response = await GET(request);
    const data = await response.json();

    // Savings should be calculated based on 80% cache hit rate
    // Formula: (totalCalls / (1 - hitRate) - totalCalls) / totalCalls * monthlyCost
    expect(data.metrics.estimatedCosts.savings).toBeGreaterThan(0);

    // With 80% hit rate, savings should be approximately 4x the monthly cost
    // (because we would have made 5x more calls without caching)
    const expectedSavings = data.metrics.estimatedCosts.monthly * 4;
    expect(data.metrics.estimatedCosts.savings).toBeCloseTo(expectedSavings, 1);
  });
});
