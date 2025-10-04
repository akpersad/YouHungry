/**
 * UsageAnalyticsDashboard Component Tests
 *
 * Tests the usage analytics dashboard component
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UsageAnalyticsDashboard } from '../UsageAnalyticsDashboard';

// Mock fetch globally
global.fetch = jest.fn();

const mockUsageAnalytics = {
  period: '7d',
  dateRange: {
    start: '2024-01-08T00:00:00Z',
    end: '2024-01-15T00:00:00Z',
  },
  apiUsage: {
    googlePlaces: {
      calls: 1250,
      cost: 15.75,
      errors: 5,
    },
    googleMaps: {
      calls: 800,
      cost: 12.5,
      errors: 2,
    },
    internal: {
      calls: 5000,
      errors: 12,
    },
  },
  featureUsage: {
    restaurantSearch: 450,
    groupDecisions: 120,
    collectionCreation: 85,
    groupCreation: 25,
    friendRequests: 60,
  },
  userBehavior: {
    totalUsers: 150,
    avgCollectionsPerUser: 2.5,
    avgGroupsPerUser: 0.8,
    avgDecisionsPerUser: 3.2,
    activeUsers: 95,
    engagementRate: 63.3,
  },
  trends: {
    dailyActivity: [
      { date: '2024-01-08', decisions: 15, uniqueUsers: 12 },
      { date: '2024-01-09', decisions: 22, uniqueUsers: 18 },
      { date: '2024-01-10', decisions: 18, uniqueUsers: 14 },
      { date: '2024-01-11', decisions: 25, uniqueUsers: 20 },
      { date: '2024-01-12', decisions: 30, uniqueUsers: 25 },
      { date: '2024-01-13', decisions: 28, uniqueUsers: 22 },
      { date: '2024-01-14', decisions: 32, uniqueUsers: 26 },
    ],
  },
  popularFeatures: [
    { name: 'Restaurant Search', usage: 450, trend: '+12%' },
    { name: 'Group Decisions', usage: 120, trend: '+8%' },
    { name: 'Collection Management', usage: 85, trend: '+15%' },
    { name: 'Group Creation', usage: 25, trend: '+5%' },
    { name: 'Friend Management', usage: 60, trend: '+3%' },
  ],
  capacityPlanning: {
    currentUsers: 150,
    projectedGrowth: 180,
    storageUsage: 45.2,
    apiQuotaUsage: 67.8,
    recommendations: [
      'Consider implementing caching for frequently accessed data',
      'Monitor API usage to optimize costs',
      'Set up alerts for high usage periods',
    ],
  },
};

describe('UsageAnalyticsDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<UsageAnalyticsDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders usage analytics after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
    });

    // Check API usage overview
    expect(screen.getByText('Google Places API')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument(); // 1250 formatted
    expect(screen.getByText('$15.75 cost')).toBeInTheDocument();

    expect(screen.getByText('Google Maps API')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('$12.50 cost')).toBeInTheDocument();

    expect(screen.getByText('Internal API')).toBeInTheDocument();
    expect(screen.getByText('5K')).toBeInTheDocument(); // 5000 formatted

    expect(screen.getByText('API Errors')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument(); // 5 + 2 + 12
  });

  it('displays feature usage metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Feature Usage')).toBeInTheDocument();
    });

    // Check feature usage cards
    expect(screen.getByText(/restaurant search/i)).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText(/group decisions/i)).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/collection creation/i)).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('displays user engagement metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Engagement')).toBeInTheDocument();
    });

    // Check engagement metrics
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
    expect(screen.getByText('63.3%')).toBeInTheDocument();
    expect(screen.getByText('Avg Collections/User')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });

  it('displays capacity planning metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Capacity Planning')).toBeInTheDocument();
    });

    // Check capacity metrics
    expect(screen.getByText('Current Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Projected Growth')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
    expect(screen.getByText('45.2%')).toBeInTheDocument();
    expect(screen.getByText('API Quota Usage')).toBeInTheDocument();
    expect(screen.getByText('67.8%')).toBeInTheDocument();
  });

  it('displays popular features ranking', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Most Popular Features')).toBeInTheDocument();
    });

    // Check popular features
    expect(screen.getByText('Restaurant Search')).toBeInTheDocument();
    expect(screen.getByText('450 uses')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();

    expect(screen.getByText('Group Decisions')).toBeInTheDocument();
    expect(screen.getByText('120 uses')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();
  });

  it('displays daily activity trends', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Daily Activity Trends')).toBeInTheDocument();
    });

    // Check daily activity (should show last 7 days)
    expect(screen.getByText('1/8/2024')).toBeInTheDocument();
    expect(screen.getByText('1/14/2024')).toBeInTheDocument();
    expect(screen.getByText('15 decisions')).toBeInTheDocument();
    expect(screen.getByText('12 users')).toBeInTheDocument();
  });

  it('displays optimization recommendations', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Optimization Recommendations')
      ).toBeInTheDocument();
    });

    // Check recommendations
    expect(
      screen.getByText(
        /Consider implementing caching for frequently accessed data/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Monitor API usage to optimize costs/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Set up alerts for high usage periods/)
    ).toBeInTheDocument();
  });

  it('handles period selection', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsageAnalytics }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockUsageAnalytics, period: '30d' },
        }),
      });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
    });

    const periodSelect = screen.getByDisplayValue('Last 7 days');
    fireEvent.change(periodSelect, { target: { value: '30d' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/analytics/usage?period=30d'),
        expect.any(Object)
      );
    });
  });

  it('handles refresh button click', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsageAnalytics }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsageAnalytics }),
      });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('formats numbers correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument(); // 1250
      expect(screen.getByText('5K')).toBeInTheDocument(); // 5000
      expect(screen.getByText('150')).toBeInTheDocument(); // < 1000
    });
  });

  it('shows trend indicators correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      // Should show positive trends in green
      expect(screen.getByText('+12%')).toBeInTheDocument();
      expect(screen.getByText('+8%')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      // Component should still render even with API errors
      expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
    });
  });

  it('displays correct period information', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsageAnalytics }),
    });

    render(<UsageAnalyticsDashboard />);

    await waitFor(() => {
      // Should show period context in feature usage
      expect(screen.getByText('This week')).toBeInTheDocument();
    });
  });
});
