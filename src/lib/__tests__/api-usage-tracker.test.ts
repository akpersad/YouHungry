/**
 * API Usage Tracker Tests
 *
 * Tests the API usage tracking and statistics functions
 */

import {
  trackAPIUsage,
  getAPIUsageStats,
  getCacheHitRate,
  getAvailableDataYears,
  cleanupOldAPIUsage,
} from '../api-usage-tracker';

// Mock dependencies
jest.mock('../db', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { connectToDatabase } from '../db';
import { logger } from '../logger';

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<
  typeof connectToDatabase
>;

describe('api-usage-tracker', () => {
  let mockCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection = {
      insertOne: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      countDocuments: jest.fn(),
      distinct: jest.fn(),
      deleteMany: jest.fn(),
    };

    mockConnectToDatabase.mockResolvedValue({
      collection: jest.fn(() => mockCollection),
    } as any);
  });

  describe('trackAPIUsage', () => {
    it('should track uncached API calls in database', async () => {
      await trackAPIUsage('google_places_text_search', false, {
        query: 'pizza',
      });

      expect(mockConnectToDatabase).toHaveBeenCalled();
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          apiType: 'google_places_text_search',
          cached: false,
          metadata: { query: 'pizza' },
          timestamp: expect.any(Number),
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
    });

    it('should not track cached API calls in database', async () => {
      await trackAPIUsage('google_places_text_search', true);

      expect(mockConnectToDatabase).not.toHaveBeenCalled();
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockConnectToDatabase.mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(
        trackAPIUsage('google_places_text_search', false)
      ).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to track API usage:',
        expect.any(Error)
      );
    });

    it('should track different API types', async () => {
      const apiTypes = [
        'google_places_nearby_search',
        'google_geocoding',
        'twilio_sms_sent',
        'resend_email_sent',
        'clerk_user_create',
      ];

      for (const apiType of apiTypes) {
        await trackAPIUsage(apiType as any, false);
      }

      expect(mockCollection.insertOne).toHaveBeenCalledTimes(apiTypes.length);
    });

    it('should format date correctly', async () => {
      const fixedDate = new Date('2024-01-15T10:30:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(fixedDate.getTime());

      await trackAPIUsage('google_places_text_search', false);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2024-01-15',
        })
      );

      jest.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('getAPIUsageStats', () => {
    it('should calculate usage statistics for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockCollection.toArray.mockResolvedValue([
        { _id: 'google_places_text_search', count: 1000 },
        { _id: 'google_places_details', count: 2500 },
        { _id: 'twilio_sms_sent', count: 50 },
      ]);

      const stats = await getAPIUsageStats(startDate, endDate);

      expect(stats.totalCalls).toBe(3550);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.byType).toHaveProperty('google_places_text_search');
      expect(stats.byType).toHaveProperty('google_places_details');
      expect(stats.byType).toHaveProperty('twilio_sms_sent');
    });

    it('should filter by date range correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockCollection.toArray.mockResolvedValue([]);

      await getAPIUsageStats(startDate, endDate);

      expect(mockCollection.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              timestamp: {
                $gte: startDate.getTime(),
                $lte: endDate.getTime(),
              },
              cached: false,
            }),
          }),
        ])
      );
    });

    it('should calculate costs using per-unit pricing for appropriate APIs', async () => {
      mockCollection.toArray.mockResolvedValue([
        { _id: 'twilio_sms_sent', count: 100 }, // Per-unit pricing
        { _id: 'resend_email_sent', count: 50 }, // Per-unit pricing
      ]);

      const stats = await getAPIUsageStats(new Date(), new Date());

      // Twilio: 100 * $0.0083 = $0.83
      expect(stats.byType.twilio_sms_sent.cost).toBeCloseTo(0.83, 2);

      // Resend: 50 * $0.001 = $0.05
      expect(stats.byType.resend_email_sent.cost).toBeCloseTo(0.05, 2);
    });

    it('should calculate costs using per-1000 pricing for Google APIs', async () => {
      mockCollection.toArray.mockResolvedValue([
        { _id: 'google_places_text_search', count: 1000 },
        { _id: 'google_places_details', count: 2500 },
      ]);

      const stats = await getAPIUsageStats(new Date(), new Date());

      // Text search: (1000/1000) * $0.032 = $0.032
      expect(stats.byType.google_places_text_search.cost).toBeCloseTo(0.032, 3);

      // Place details: (2500/1000) * $0.017 = $0.0425
      expect(stats.byType.google_places_details.cost).toBeCloseTo(0.0425, 4);
    });

    it('should return zero stats for no data', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const stats = await getAPIUsageStats(new Date(), new Date());

      expect(stats.totalCalls).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(Object.keys(stats.byType)).toHaveLength(0);
    });

    it('should aggregate multiple API types correctly', async () => {
      mockCollection.toArray.mockResolvedValue([
        { _id: 'google_places_text_search', count: 500 },
        { _id: 'google_places_nearby_search', count: 300 },
        { _id: 'google_geocoding', count: 200 },
        { _id: 'twilio_sms_sent', count: 25 },
      ]);

      const stats = await getAPIUsageStats(new Date(), new Date());

      expect(stats.totalCalls).toBe(1025);
      expect(stats.totalCost).toBeGreaterThan(0);

      // Verify each type has correct structure
      Object.values(stats.byType).forEach((typeStats) => {
        expect(typeStats).toHaveProperty('count');
        expect(typeStats).toHaveProperty('cost');
        expect(typeStats).toHaveProperty('costPerCall');
      });
    });

    it('should throw error when database query fails', async () => {
      mockCollection.toArray.mockRejectedValue(new Error('Query failed'));

      await expect(getAPIUsageStats(new Date(), new Date())).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get API usage stats:',
        expect.any(Error)
      );
    });
  });

  describe('getCacheHitRate', () => {
    it('should calculate cache hit rate correctly', async () => {
      mockCollection.countDocuments
        .mockResolvedValueOnce(750) // cached
        .mockResolvedValueOnce(1000); // total

      const result = await getCacheHitRate(new Date(), new Date());

      expect(result.cached).toBe(750);
      expect(result.total).toBe(1000);
      expect(result.hitRate).toBe(75.0); // 750/1000 * 100
    });

    it('should return 0% hit rate when no data', async () => {
      mockCollection.countDocuments
        .mockResolvedValueOnce(0) // cached
        .mockResolvedValueOnce(0); // total

      const result = await getCacheHitRate(new Date(), new Date());

      expect(result.cached).toBe(0);
      expect(result.total).toBe(0);
      expect(result.hitRate).toBe(0);
    });

    it('should round hit rate to 1 decimal place', async () => {
      mockCollection.countDocuments
        .mockResolvedValueOnce(333) // cached
        .mockResolvedValueOnce(1000); // total

      const result = await getCacheHitRate(new Date(), new Date());

      // 333/1000 * 100 = 33.3
      expect(result.hitRate).toBe(33.3);
    });

    it('should handle database errors gracefully', async () => {
      mockCollection.countDocuments.mockRejectedValue(new Error('DB Error'));

      const result = await getCacheHitRate(new Date(), new Date());

      expect(result).toEqual({
        cached: 0,
        total: 0,
        hitRate: 0,
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get cache hit rate:',
        expect.any(Error)
      );
    });

    it('should filter by date range correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockCollection.countDocuments.mockResolvedValue(0);

      await getCacheHitRate(startDate, endDate);

      // First call for cached count
      expect(mockCollection.countDocuments).toHaveBeenNthCalledWith(1, {
        timestamp: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
        cached: true,
      });

      // Second call for total count
      expect(mockCollection.countDocuments).toHaveBeenNthCalledWith(2, {
        timestamp: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
      });
    });
  });

  describe('getAvailableDataYears', () => {
    it('should return sorted list of years with data', async () => {
      mockCollection.distinct.mockResolvedValue([
        '2024-01-15',
        '2024-06-20',
        '2023-12-01',
        '2023-05-10',
      ]);

      const years = await getAvailableDataYears();

      expect(years).toEqual([2024, 2023]); // Descending order
    });

    it('should handle single year', async () => {
      mockCollection.distinct.mockResolvedValue([
        '2024-01-01',
        '2024-03-15',
        '2024-12-31',
      ]);

      const years = await getAvailableDataYears();

      expect(years).toEqual([2024]);
    });

    it('should return current year when no data exists', async () => {
      mockCollection.distinct.mockResolvedValue([]);

      const currentYear = new Date().getFullYear();
      const years = await getAvailableDataYears();

      expect(years).toEqual([currentYear]);
    });

    it('should remove duplicates', async () => {
      mockCollection.distinct.mockResolvedValue([
        '2024-01-01',
        '2024-06-15',
        '2024-12-31',
        '2023-03-10',
        '2023-09-20',
      ]);

      const years = await getAvailableDataYears();

      expect(years).toEqual([2024, 2023]);
      expect(new Set(years).size).toBe(years.length);
    });

    it('should handle database errors', async () => {
      mockCollection.distinct.mockRejectedValue(new Error('DB Error'));

      const currentYear = new Date().getFullYear();
      const years = await getAvailableDataYears();

      expect(years).toEqual([currentYear]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get available data years:',
        expect.any(Error)
      );
    });

    it('should query date field', async () => {
      mockCollection.distinct.mockResolvedValue([]);

      await getAvailableDataYears();

      expect(mockCollection.distinct).toHaveBeenCalledWith('date');
    });
  });

  describe('cleanupOldAPIUsage', () => {
    it('should delete records older than 90 days', async () => {
      const deletedCount = 1500;
      mockCollection.deleteMany.mockResolvedValue({ deletedCount });

      await cleanupOldAPIUsage();

      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        timestamp: { $lt: expect.any(Number) },
      });

      const callArg = mockCollection.deleteMany.mock.calls[0][0];
      const timestamp = callArg.timestamp.$lt;

      // Should be approximately 90 days ago (within 1 minute tolerance)
      expect(Math.abs(timestamp - ninetyDaysAgo)).toBeLessThan(60000);

      expect(logger.info).toHaveBeenCalledWith(
        `Cleaned up ${deletedCount} old API usage records`
      );
    });

    it('should handle no records to delete', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await cleanupOldAPIUsage();

      expect(logger.info).toHaveBeenCalledWith(
        'Cleaned up 0 old API usage records'
      );
    });

    it('should handle database errors', async () => {
      mockCollection.deleteMany.mockRejectedValue(new Error('Delete failed'));

      // Should not throw
      await expect(cleanupOldAPIUsage()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to cleanup old API usage:',
        expect.any(Error)
      );
    });

    it('should connect to database', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await cleanupOldAPIUsage();

      expect(mockConnectToDatabase).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should track and retrieve stats for a typical day', async () => {
      // Simulate tracking various API calls
      const apiCalls = [
        { type: 'google_places_text_search', count: 100 },
        { type: 'google_places_details', count: 250 },
        { type: 'twilio_sms_sent', count: 10 },
      ];

      // Mock the aggregate response for getAPIUsageStats
      mockCollection.toArray.mockResolvedValue([
        { _id: 'google_places_text_search', count: 100 },
        { _id: 'google_places_details', count: 250 },
        { _id: 'twilio_sms_sent', count: 10 },
      ]);

      const stats = await getAPIUsageStats(new Date(), new Date());

      expect(stats.totalCalls).toBe(360);
      expect(stats.totalCost).toBeGreaterThan(0);

      // Google APIs should use per-1000 pricing
      expect(stats.byType.google_places_text_search.cost).toBeCloseTo(
        0.0032,
        4
      );

      // Twilio should use per-unit pricing (10 * $0.0083 = $0.083)
      expect(stats.byType.twilio_sms_sent.cost).toBeCloseTo(0.083, 3);
    });

    it('should handle mixed cached and uncached calls', async () => {
      // Only uncached calls should appear in stats
      mockCollection.toArray.mockResolvedValue([
        { _id: 'google_places_text_search', count: 50 },
      ]);

      mockCollection.countDocuments
        .mockResolvedValueOnce(150) // cached
        .mockResolvedValueOnce(200); // total (150 cached + 50 uncached)

      const stats = await getAPIUsageStats(new Date(), new Date());
      const cacheRate = await getCacheHitRate(new Date(), new Date());

      expect(stats.totalCalls).toBe(50); // Only uncached
      expect(cacheRate.hitRate).toBe(75.0); // 150/200
    });
  });
});
