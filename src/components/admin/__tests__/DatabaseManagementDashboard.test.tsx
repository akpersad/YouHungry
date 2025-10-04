/**
 * DatabaseManagementDashboard Component Tests
 *
 * Tests the database management dashboard component
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DatabaseManagementDashboard } from '../DatabaseManagementDashboard';

// Mock fetch globally
global.fetch = jest.fn();

const mockDatabaseStats = {
  connection: {
    status: 'connected',
    latency: 25,
  },
  overview: {
    totalCollections: 7,
    totalDocuments: 1250,
    totalStorageSize: 5242880, // 5MB
    totalIndexSize: 1048576, // 1MB
  },
  collections: [
    {
      name: 'users',
      count: 150,
      storageSize: 2097152,
      indexSize: 524288,
      indexes: 3,
    },
    {
      name: 'collections',
      count: 300,
      storageSize: 1572864,
      indexSize: 262144,
      indexes: 2,
    },
    {
      name: 'restaurants',
      count: 500,
      storageSize: 1048576,
      indexSize: 131072,
      indexes: 2,
    },
    {
      name: 'groups',
      count: 50,
      storageSize: 262144,
      indexSize: 65536,
      indexes: 1,
    },
    {
      name: 'friendships',
      count: 200,
      storageSize: 262144,
      indexSize: 65536,
      indexes: 1,
    },
    {
      name: 'decisions',
      count: 50,
      storageSize: 65536,
      indexSize: 16384,
      indexes: 1,
    },
    {
      name: 'groupInvitations',
      count: 0,
      storageSize: 0,
      indexSize: 0,
      indexes: 0,
    },
  ],
  performance: {
    averageResponseTime: 25,
    slowQueries: 0,
    totalQueries: 5000,
    recentActivity: {
      newUsers: 8,
      newCollections: 15,
      newGroups: 3,
      newDecisions: 12,
    },
  },
  recommendations: [
    {
      type: 'warning',
      message:
        'Index size is high compared to data size. Consider reviewing indexes.',
    },
    {
      type: 'info',
      message:
        '1 collection(s) have over 10,000 documents. Consider archiving old data.',
    },
  ],
};

describe('DatabaseManagementDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DatabaseManagementDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders database statistics after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDatabaseStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Database Management')).toBeInTheDocument();
    });

    // Check connection status
    expect(screen.getByText('Database Connection')).toBeInTheDocument();
    // Status text is split across elements: "Status:" and "connected"
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('connected')).toBeInTheDocument();
    // The "25 ms" text is split across elements: "25" and "ms"
    // Check for response time specifically in the connection status section
    const connectionCard = screen
      .getByText('Database Connection')
      .closest('.card-base');
    expect(connectionCard).toBeInTheDocument();
    expect(connectionCard).toHaveTextContent('25');
    expect(connectionCard).toHaveTextContent('ms');

    // Check overview stats
    expect(screen.getByText('7')).toBeInTheDocument(); // Collections
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Documents
    expect(screen.getByText('5 MB')).toBeInTheDocument(); // Storage size
    // Use getAllByText since '1 MB' appears multiple times
    expect(screen.getAllByText('1 MB').length).toBeGreaterThan(0); // Index size
  });

  it('displays collection statistics table', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDatabaseStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Collection Statistics')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    // Use getAllByText since "Storage Size" appears multiple times
    expect(screen.getAllByText('Storage Size').length).toBeGreaterThan(0);
    // Use getAllByText since "Index Size" appears multiple times
    expect(screen.getAllByText('Index Size').length).toBeGreaterThan(0);
    expect(screen.getByText('Indexes')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check collection data
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByText('512 KB')).toBeInTheDocument();
    // Use getAllByText since "3" appears multiple times
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    // Use getAllByText since 'Healthy' appears multiple times
    expect(screen.getAllByText('Healthy').length).toBeGreaterThan(0);
  });

  it('displays performance metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDatabaseStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    // Check performance metrics
    expect(screen.getByText('Average Response Time')).toBeInTheDocument();
    // The "25 ms" text is split across elements: "25" and "ms"
    // Check for response time specifically in the connection status section
    const connectionCard = screen
      .getByText('Database Connection')
      .closest('.card-base');
    expect(connectionCard).toBeInTheDocument();
    expect(connectionCard).toHaveTextContent('25');
    expect(connectionCard).toHaveTextContent('ms');
    expect(screen.getByText('Slow Queries')).toBeInTheDocument();
    // Use getAllByText since '0' appears multiple times
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText('Total Queries')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  it('displays recent activity metrics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDatabaseStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity (7 days)')).toBeInTheDocument();
    });

    // Check recent activity
    expect(screen.getByText('New Users')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('New Collections')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('New Groups')).toBeInTheDocument();
    // Use getAllByText since "3" appears multiple times
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getByText('New Decisions')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('displays recommendations when available', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDatabaseStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    // Check recommendations
    expect(
      screen.getByText(/Index size is high compared to data size/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Consider reviewing indexes/)).toBeInTheDocument();
    expect(
      screen.getByText(/1 collection.*have over 10,000 documents/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Consider archiving old data/)).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDatabaseStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDatabaseStats }),
      });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Database Management')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('formats storage sizes correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDatabaseStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('5 MB')).toBeInTheDocument(); // 5MB total storage
      // Use getAllByText since "1 MB" appears multiple times
      expect(screen.getAllByText('1 MB').length).toBeGreaterThan(0); // 1MB total index
      expect(screen.getByText('2 MB')).toBeInTheDocument(); // 2MB users collection
      expect(screen.getByText('512 KB')).toBeInTheDocument(); // 512KB users index
    });
  });

  it('shows connection status indicators correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDatabaseStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      // Status text is split across elements: "Status:" and "connected"
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('connected')).toBeInTheDocument();
    });

    // Should show connected status with green indicator
    const statusElement = screen.getByText('Status:');
    expect(statusElement).toBeInTheDocument();
  });

  it('handles disconnected status', async () => {
    const disconnectedStats = {
      ...mockDatabaseStats,
      connection: {
        status: 'disconnected',
        latency: 0,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: disconnectedStats }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      // Status text is split across elements: "Status:" and "disconnected"
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('disconnected')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      // Component should still render even with API errors
      expect(screen.getByText('Database Management')).toBeInTheDocument();
    });
  });

  it('shows collection error status when applicable', async () => {
    const statsWithError = {
      ...mockDatabaseStats,
      collections: [
        ...mockDatabaseStats.collections,
        {
          name: 'errorCollection',
          count: 0,
          storageSize: 0,
          indexSize: 0,
          indexes: 0,
          error: 'Collection not found',
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: statsWithError }),
    });

    render(<DatabaseManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('errorCollection')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});
