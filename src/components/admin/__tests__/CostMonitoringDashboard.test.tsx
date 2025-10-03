/**
 * CostMonitoringDashboard Component Tests
 *
 * Tests the cost monitoring dashboard component
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CostMonitoringDashboard } from '../CostMonitoringDashboard';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

const mockCostData = {
  metrics: {
    googlePlaces: {
      textSearch: 150,
      nearbySearch: 45,
      placeDetails: 375,
      geocoding: 120,
      addressValidation: 15,
    },
    googleMaps: {
      mapsLoads: 30,
    },
    cache: {
      hitRate: 75.5,
      totalHits: 1250,
      memoryEntries: 89,
    },
    estimatedCosts: {
      daily: 12.45,
      monthly: 373.5,
      savings: 281.69,
    },
  },
  recommendations: [
    'Cache hit rate is below 70%. Consider increasing cache TTL or implementing more aggressive caching.',
    'High place details usage detected. Consider implementing batch place details fetching.',
  ],
};

describe('CostMonitoringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CostMonitoringDashboard />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render cost data when loaded successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCostData,
    });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Monitoring')).toBeInTheDocument();
    });

    // Check cost summary cards
    expect(screen.getByText('$12.45')).toBeInTheDocument(); // Daily cost
    expect(screen.getByText('$373.50')).toBeInTheDocument(); // Monthly cost
    expect(screen.getByText('$281.69')).toBeInTheDocument(); // Savings

    // Check API usage breakdown
    expect(screen.getByText('150 calls')).toBeInTheDocument(); // Text Search
    expect(screen.getByText('45 calls')).toBeInTheDocument(); // Nearby Search
    expect(screen.getByText('375 calls')).toBeInTheDocument(); // Place Details

    // Check cache performance
    expect(screen.getByText('75.5%')).toBeInTheDocument(); // Hit Rate
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Total Hits
    expect(screen.getByText('89')).toBeInTheDocument(); // Memory Entries
  });

  it('should render recommendations when available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCostData,
    });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    expect(
      screen.getByText(mockCostData.recommendations[0])
    ).toBeInTheDocument();
    expect(
      screen.getByText(mockCostData.recommendations[1])
    ).toBeInTheDocument();
  });

  it('should show error state when API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Cost Data')).toBeInTheDocument();
    });

    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should show error state when API returns error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Cost Data')).toBeInTheDocument();
    });

    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('should show no data message when cost data is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No cost data available')).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCostData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockCostData,
          metrics: {
            ...mockCostData.metrics,
            estimatedCosts: {
              ...mockCostData.metrics.estimatedCosts,
              daily: 15.2,
            },
          },
        }),
      });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('$12.45')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh Data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('$15.20')).toBeInTheDocument();
    });
  });

  it('should auto-refresh every 5 minutes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCostData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCostData,
      });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('$12.45')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Advance timer by 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should format currency correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCostData,
    });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      // Check that currency is formatted with $ symbol and proper decimals
      expect(screen.getByText('$12.45')).toBeInTheDocument();
      expect(screen.getByText('$373.50')).toBeInTheDocument();
      expect(screen.getByText('$281.69')).toBeInTheDocument();
    });
  });

  it('should format numbers correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCostData,
    });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      // Check that large numbers are formatted with commas
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });
  });

  it('should show last updated timestamp', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCostData,
    });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  it('should show loading state initially', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CostMonitoringDashboard />);

    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Refresh Data')).not.toBeInTheDocument();
  });

  it('should show retry button in error state', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeEnabled();
  });

  it('should retry data fetch when retry button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCostData,
      });

    render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Cost Data')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Cost Monitoring')).toBeInTheDocument();
      expect(screen.getByText('$12.45')).toBeInTheDocument();
    });
  });

  it('should clean up interval on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCostData,
    });

    const { unmount } = render(<CostMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cost Monitoring')).toBeInTheDocument();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
