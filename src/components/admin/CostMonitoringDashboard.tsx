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
  cache: {
    hitRate: number;
    totalHits: number;
    memoryEntries: number;
  };
  estimatedCosts: {
    daily: number;
    monthly: number;
    savings: number;
  };
}

interface CostData {
  metrics: APICostMetrics;
  recommendations: string[];
}

export function CostMonitoringDashboard() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/cost-monitoring');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cost data');
      }

      setCostData(data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching cost data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchCostData, 5 * 60 * 1000);
    return () => clearInterval(interval);
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
          <h3 className="font-medium" style={{ color: 'var(--color-error)' }}>
            Error Loading Cost Data
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
          <button
            onClick={fetchCostData}
            className="mt-3 px-4 py-2 rounded-md text-sm transition-colors"
            style={{
              background: 'var(--color-error)',
              color: 'var(--text-inverse)',
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
        <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
          No cost data available
        </div>
      </div>
    );
  }

  const { metrics, recommendations } = costData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Cost Monitoring
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track API usage and costs in real-time
          </p>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>

      {/* Cost Summary Cards */}
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
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Daily Cost
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatCurrency(metrics.estimatedCosts.daily)}
              </p>
            </div>
            <div style={{ color: 'var(--color-success)' }}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
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
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Monthly Cost
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatCurrency(metrics.estimatedCosts.monthly)}
              </p>
            </div>
            <div style={{ color: 'var(--accent-primary)' }}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
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
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Monthly Savings
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--color-success)' }}
              >
                {formatCurrency(metrics.estimatedCosts.savings)}
              </p>
            </div>
            <div style={{ color: 'var(--color-success)' }}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
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

      {/* API Usage Breakdown */}
      <div
        className="rounded-lg shadow-subtle border p-6"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--bg-quaternary)',
        }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          API Usage Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Places API */}
          <div>
            <h4
              className="font-medium mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Google Places API
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Text Search
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatNumber(metrics.googlePlaces.textSearch)} calls
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Nearby Search
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatNumber(metrics.googlePlaces.nearbySearch)} calls
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Place Details
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatNumber(metrics.googlePlaces.placeDetails)} calls
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Geocoding
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatNumber(metrics.googlePlaces.geocoding)} calls
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Address Validation
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatNumber(metrics.googlePlaces.addressValidation)} calls
                </span>
              </div>
            </div>
          </div>

          {/* Google Maps API */}
          <div>
            <h4
              className="font-medium mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Google Maps API
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Maps Loads
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatNumber(metrics.googleMaps.mapsLoads)} loads
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Performance */}
      <div
        className="rounded-lg shadow-subtle border p-6"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--bg-quaternary)',
        }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Cache Performance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: 'var(--accent-primary)' }}
            >
              {metrics.cache.hitRate.toFixed(1)}%
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Hit Rate
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: 'var(--color-success)' }}
            >
              {formatNumber(metrics.cache.totalHits)}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Total Hits
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: '#9333ea' }}>
              {formatNumber(metrics.cache.memoryEntries)}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Memory Entries
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div
          className="rounded-lg shadow-subtle border p-6"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--bg-quaternary)',
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Recommendations
          </h3>
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
                <div
                  className="mt-0.5"
                  style={{ color: 'var(--color-warning)' }}
                >
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
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-warning)' }}
                >
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchCostData}
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
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
