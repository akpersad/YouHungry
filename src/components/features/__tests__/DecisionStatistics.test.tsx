import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DecisionStatistics } from '../DecisionStatistics';

// Mock fetch
global.fetch = jest.fn();

const mockStatistics = {
  totalDecisions: 5,
  restaurantStats: [
    {
      restaurantId: 'restaurant123',
      name: 'Restaurant 1',
      selectionCount: 3,
      lastSelected: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago (yesterday)
      currentWeight: 0.85,
    },
    {
      restaurantId: 'restaurant456',
      name: 'Restaurant 2',
      selectionCount: 2,
      lastSelected: new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000
      ).toISOString(), // 14 days ago (2 weeks)
      currentWeight: 0.95,
    },
    {
      restaurantId: 'restaurant789',
      name: 'Restaurant 3',
      selectionCount: 0,
      lastSelected: undefined,
      currentWeight: 1.0,
    },
  ],
};

describe('DecisionStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    render(<DecisionStatistics collectionId="collection123" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders statistics successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: mockStatistics,
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(screen.getByText('Decision Statistics')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Decisions Made')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(
      screen.getByText('Restaurant Selection History')
    ).toBeInTheDocument();
    expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
    expect(screen.getByText('Restaurant 2')).toBeInTheDocument();
    expect(screen.getByText('Restaurant 3')).toBeInTheDocument();
  });

  it('displays restaurant statistics correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: mockStatistics,
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
    });

    // Check selection counts
    expect(screen.getByText('Selected 3 times')).toBeInTheDocument();
    expect(screen.getByText('Selected 2 times')).toBeInTheDocument();
    expect(screen.getByText('Selected 0 times')).toBeInTheDocument();

    // Check last selected dates
    expect(screen.getByText('Last: Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Last: 2 weeks ago')).toBeInTheDocument();
    expect(screen.getByText('Last: Never')).toBeInTheDocument();

    // Check weight labels - use getAllByText since there are multiple "High Priority" elements
    const highPriorityElements = screen.getAllByText('High Priority');
    expect(highPriorityElements).toHaveLength(3);
  });

  it('displays weight values correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: mockStatistics,
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(screen.getByText('0.85')).toBeInTheDocument();
    });

    expect(screen.getByText('0.95')).toBeInTheDocument();
    expect(screen.getByText('1.00')).toBeInTheDocument();
  });

  it('handles empty statistics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: {
          totalDecisions: 0,
          restaurantStats: [],
        },
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(
        screen.getByText('No decisions have been made yet for this collection.')
      ).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Failed to fetch statistics',
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch statistics')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('retries on error when try again is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Failed to fetch statistics',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          statistics: mockStatistics,
        }),
      });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch statistics')
      ).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText('Decision Statistics')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: mockStatistics,
      }),
    });

    render(
      <DecisionStatistics collectionId="collection123" onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when onClose is not provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: mockStatistics,
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(screen.getByText('Decision Statistics')).toBeInTheDocument();
    });

    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('formats different time periods correctly', async () => {
    const statisticsWithDifferentTimes = {
      totalDecisions: 3,
      restaurantStats: [
        {
          restaurantId: 'restaurant1',
          name: 'Restaurant 1',
          selectionCount: 1,
          lastSelected: new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString(), // 1 day ago
          currentWeight: 0.5,
        },
        {
          restaurantId: 'restaurant2',
          name: 'Restaurant 2',
          selectionCount: 1,
          lastSelected: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(), // 3 days ago
          currentWeight: 0.6,
        },
        {
          restaurantId: 'restaurant3',
          name: 'Restaurant 3',
          selectionCount: 1,
          lastSelected: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days ago
          currentWeight: 0.7,
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: statisticsWithDifferentTimes,
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(screen.getByText('Last: Yesterday')).toBeInTheDocument();
    });

    expect(screen.getByText('Last: 3 days ago')).toBeInTheDocument();
    expect(screen.getByText('Last: 1 week ago')).toBeInTheDocument();
  });

  it('displays weight priority labels correctly', async () => {
    const statisticsWithDifferentWeights = {
      totalDecisions: 3,
      restaurantStats: [
        {
          restaurantId: 'restaurant1',
          name: 'High Weight Restaurant',
          selectionCount: 0,
          lastSelected: undefined,
          currentWeight: 0.9,
        },
        {
          restaurantId: 'restaurant2',
          name: 'Medium Weight Restaurant',
          selectionCount: 1,
          lastSelected: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
          currentWeight: 0.6,
        },
        {
          restaurantId: 'restaurant3',
          name: 'Low Weight Restaurant',
          selectionCount: 5,
          lastSelected: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          currentWeight: 0.2,
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        statistics: statisticsWithDifferentWeights,
      }),
    });

    render(<DecisionStatistics collectionId="collection123" />);

    await waitFor(() => {
      expect(screen.getByText('High Weight Restaurant')).toBeInTheDocument();
    });

    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    expect(screen.getByText('Low Priority')).toBeInTheDocument();
  });
});
