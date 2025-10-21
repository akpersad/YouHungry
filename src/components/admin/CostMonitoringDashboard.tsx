'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface APICostMetrics {
  googlePlaces: {
    textSearch: number;
    nearbySearch: number;
    placeDetails: number;
    geocoding: number;
    addressValidation: number;
  };
  googleMaps: {
    mapsLoads: number;
  };
  clerk: {
    userCreate: number;
    userUpdate: number;
    userRead: number;
    estimatedMAU: number;
  };
  vercelBlob: {
    uploads: number;
    deletes: number;
    reads: number;
    estimatedStorageGB: number;
  };
  twilio: {
    smsSent: number;
    verifySent: number;
  };
  resend: {
    emailsSent: number;
  };
  cache: {
    hitRate: number;
    totalHits: number;
    memoryEntries: number;
  };
  locationCache: {
    totalEntries: number;
    locationOnlyEntries: number;
    locationQueryEntries: number;
    averageRestaurantsPerEntry: number;
    estimatedSizeKB: number;
    oldestEntry?: string;
    newestEntry?: string;
  };
  estimatedCosts: {
    daily: number;
    monthly: number;
    savings: number;
    byService: {
      google: number;
      clerk: number;
      vercelBlob: number;
      twilio: number;
      resend: number;
    };
  };
}

interface CostData {
  metrics: APICostMetrics;
  recommendations: string[];
  availableYears?: number[];
}

export function CostMonitoringDashboard() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Time filter state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  ); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [hasNoData, setHasNoData] = useState(false);

  const fetchCostData = async (month?: number, year?: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (month !== undefined && year !== undefined) {
        params.append('month', month.toString());
        params.append('year', year.toString());
      }

      const response = await fetch(
        `/api/admin/cost-monitoring?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cost data');
      }

      // Check if there's any data for this period
      const hasData =
        data.metrics &&
        (data.metrics.estimatedCosts.monthly > 0 ||
          (Object.values(data.metrics.googlePlaces) as number[]).some(
            (v) => v > 0
          ) ||
          (Object.values(data.metrics.clerk) as number[]).some((v) => v > 0) ||
          (Object.values(data.metrics.vercelBlob) as number[]).some(
            (v) => v > 0
          ) ||
          data.metrics.twilio.smsSent > 0 ||
          data.metrics.twilio.verifySent > 0 ||
          data.metrics.resend.emailsSent > 0);

      setHasNoData(!hasData);
      setCostData(data);
      setLastUpdated(new Date());

      // Update available years if provided
      if (data.availableYears) {
        setAvailableYears(data.availableYears);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching cost data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = () => {
    fetchCostData(selectedMonth, selectedYear);
  };

  useEffect(() => {
    // Fetch data for current month/year on mount
    fetchCostData(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCostKPI = (amount: number) => {
    // If there's any cost at all (>0), show at least $0.01
    if (amount > 0 && amount < 0.01) {
      return '$0.01';
    }
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'var(--accent-primary)' }}
            role="status"
            aria-label="Loading"
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="border rounded-lg p-4"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'var(--color-error)',
          }}
        >
          <h3 className="font-medium">Error Loading Cost Data</h3>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchCostData()}
            className="mt-3 px-4 py-2 rounded-md text-sm transition-colors"
            style={{
              background: 'var(--color-error)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-error)';
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!costData) {
    return (
      <div className="p-6">
        <div className="text-center">No cost data available</div>
      </div>
    );
  }

  const { metrics, recommendations } = costData;

  // Helper function to get month name
  const getMonthName = (monthNum: number) => {
    return new Date(2000, monthNum - 1).toLocaleDateString('en-US', {
      month: 'long',
    });
  };

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Cost Monitoring</h2>
            <p>
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
                'en-US',
                {
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </p>
          </div>
          <div className="text-sm">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </div>
        </div>

        {/* Time Filter Controls */}
        <div
          className="flex flex-wrap items-end gap-4 p-4 rounded-lg"
          style={{
            background: 'var(--bg-tertiary)',
            borderColor: 'var(--bg-quaternary)',
            border: '1px solid',
          }}
        >
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-quaternary)',
              }}
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--bg-quaternary)',
              }}
            >
              {availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              ) : (
                // Fallback to current year if no data yet
                <option value={currentDate.getFullYear()}>
                  {currentDate.getFullYear()}
                </option>
              )}
            </select>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--accent-primary)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background =
                  'var(--accent-primary-light)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--accent-primary)';
              }
            }}
          >
            {loading ? 'Loading...' : 'Calculate'}
          </button>
        </div>
      </div>

      {/* No Data Message */}
      {hasNoData && (
        <div
          className="rounded-lg shadow-subtle border p-8 text-center"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--bg-quaternary)',
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl">📊</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
              <p className="text-sm mb-4">
                There is no API usage data for{' '}
                <span className="font-medium">
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
                .
              </p>
              {availableYears.length > 0 && (
                <div
                  className="inline-block px-4 py-2 rounded-md text-sm"
                  style={{
                    background: 'var(--bg-tertiary)',
                  }}
                >
                  💡 Data is available from{' '}
                  {availableYears[availableYears.length - 1]} onwards
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cost Summary Cards */}
      {!hasNoData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="rounded-lg shadow-subtle border p-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--bg-quaternary)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.estimatedCosts.daily)}
                </p>
              </div>
              <div>
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg shadow-subtle border p-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--bg-quaternary)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Monthly Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.estimatedCosts.monthly)}
                </p>
              </div>
              <div>
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg shadow-subtle border p-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--bg-quaternary)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Monthly Savings</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.estimatedCosts.savings)}
                </p>
                <p className="text-xs mt-1">from caching</p>
              </div>
              <div>
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cost Breakdown by Service */}
      {!hasNoData && (
        <div
          className="rounded-lg shadow-subtle border p-6"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--bg-quaternary)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4">
            Monthly Cost by Service
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div
              className="text-center p-4 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="text-2xl font-bold">
                {formatCostKPI(metrics.estimatedCosts.byService.google)}
              </div>
              <div className="text-sm mt-1">Google APIs</div>
            </div>

            <div
              className="text-center p-4 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="text-2xl font-bold">
                {formatCostKPI(metrics.estimatedCosts.byService.twilio)}
              </div>
              <div className="text-sm mt-1">Twilio</div>
              <div className="text-xs mt-1" style={{ opacity: 0.7 }}>
                {metrics.twilio.smsSent} SMS + {metrics.twilio.verifySent}{' '}
                Verify
              </div>
            </div>

            <div
              className="text-center p-4 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="text-2xl font-bold">
                {formatCostKPI(metrics.estimatedCosts.byService.resend)}
              </div>
              <div className="text-sm mt-1">Resend Email</div>
            </div>

            <div
              className="text-center p-4 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="text-2xl font-bold">
                {formatCostKPI(metrics.estimatedCosts.byService.vercelBlob)}
              </div>
              <div className="text-sm mt-1">Vercel Blob</div>
            </div>

            <div
              className="text-center p-4 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="text-2xl font-bold">
                {formatCostKPI(metrics.estimatedCosts.byService.clerk)}
              </div>
              <div className="text-sm mt-1">Clerk Auth</div>
            </div>
          </div>
        </div>
      )}

      {/* API Usage Breakdown */}
      {!hasNoData && (
        <div
          className="rounded-lg shadow-subtle border p-6"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--bg-quaternary)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4">API Usage Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Google Places API */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span>🗺️</span>
                <span>Google Places API</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Text Search</span>
                  <span className="font-medium">
                    {formatNumber(metrics.googlePlaces.textSearch)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nearby Search</span>
                  <span className="font-medium">
                    {formatNumber(metrics.googlePlaces.nearbySearch)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Place Details</span>
                  <span className="font-medium">
                    {formatNumber(metrics.googlePlaces.placeDetails)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Geocoding</span>
                  <span className="font-medium">
                    {formatNumber(metrics.googlePlaces.geocoding)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Address Validation</span>
                  <span className="font-medium">
                    {formatNumber(metrics.googlePlaces.addressValidation)}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Maps API */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span>🗺️</span>
                <span>Google Maps API</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Maps Loads</span>
                  <span className="font-medium">
                    {formatNumber(metrics.googleMaps.mapsLoads)}
                  </span>
                </div>
              </div>
            </div>

            {/* Clerk Authentication */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span>🔐</span>
                <span>Clerk Auth</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>User Creates</span>
                  <span className="font-medium">
                    {formatNumber(metrics.clerk.userCreate)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>User Updates</span>
                  <span className="font-medium">
                    {formatNumber(metrics.clerk.userUpdate)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Est. MAU</span>
                  <span className="font-medium">
                    {formatNumber(metrics.clerk.estimatedMAU)}
                  </span>
                </div>
              </div>
            </div>

            {/* Twilio SMS & Verify */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span>📱</span>
                <span>Twilio</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SMS Messages</span>
                  <span className="font-medium">
                    {formatNumber(metrics.twilio.smsSent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cost per SMS</span>
                  <span className="font-medium">$0.0083</span>
                </div>
                <div
                  className="flex justify-between text-sm font-semibold mt-3 pt-2"
                  style={{ borderTop: '1px solid var(--bg-quaternary)' }}
                >
                  <span>Verify SMS</span>
                  <span className="font-medium">
                    {formatNumber(metrics.twilio.verifySent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cost per Verify</span>
                  <span className="font-medium">$0.05</span>
                </div>
              </div>
            </div>

            {/* Resend Email */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span>📧</span>
                <span>Resend Email</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Emails Sent</span>
                  <span className="font-medium">
                    {formatNumber(metrics.resend.emailsSent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Free Tier</span>
                  <span className="font-medium">3,000/mo</span>
                </div>
              </div>
            </div>

            {/* Vercel Blob Storage */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span>💾</span>
                <span>Vercel Blob</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploads</span>
                  <span className="font-medium">
                    {formatNumber(metrics.vercelBlob.uploads)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reads</span>
                  <span className="font-medium">
                    {formatNumber(metrics.vercelBlob.reads)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Est. Storage</span>
                  <span className="font-medium">
                    {metrics.vercelBlob.estimatedStorageGB.toFixed(2)} GB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cache Performance */}
      {!hasNoData && (
        <div
          className="rounded-lg shadow-subtle border p-6"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--bg-quaternary)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Cache Performance</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {metrics.cache.hitRate.toFixed(1)}%
              </div>
              <div className="text-sm">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(metrics.cache.totalHits)}
              </div>
              <div className="text-sm">Total Hits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(metrics.cache.memoryEntries)}
              </div>
              <div className="text-sm">Memory Entries</div>
            </div>
          </div>
        </div>
      )}

      {/* Location Cache (25-mile Search Results) */}
      {!hasNoData && (
        <div
          className="rounded-lg shadow-subtle border p-6"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--bg-quaternary)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4">
            Location Cache (25-mile Search Results)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(metrics.locationCache.totalEntries)}
              </div>
              <div className="text-sm">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(metrics.locationCache.locationOnlyEntries)}
              </div>
              <div className="text-sm">Location-Only</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(metrics.locationCache.locationQueryEntries)}
              </div>
              <div className="text-sm">With Query</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(metrics.locationCache.estimatedSizeKB)} KB
              </div>
              <div className="text-sm">Estimated Size</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="text-center p-3 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div className="text-xl font-semibold">
                {metrics.locationCache.averageRestaurantsPerEntry} restaurants
              </div>
              <div className="text-sm">Average Per Entry</div>
            </div>
            {metrics.locationCache.oldestEntry && (
              <div
                className="text-center p-3 rounded-lg"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <div className="text-sm font-semibold">
                  {new Date(
                    metrics.locationCache.oldestEntry
                  ).toLocaleDateString()}
                </div>
                <div className="text-sm">Oldest Entry</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!hasNoData && recommendations.length > 0 && (
        <div
          className="rounded-lg shadow-subtle border p-6"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--bg-quaternary)',
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  border: '1px solid',
                }}
              >
                <div className="mt-0.5">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--accent-primary)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--accent-primary-light)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--accent-primary)';
            }
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}
