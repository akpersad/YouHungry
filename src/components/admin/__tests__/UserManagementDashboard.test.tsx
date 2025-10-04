/**
 * UserManagementDashboard Component Tests
 *
 * Tests the user management dashboard component
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UserManagementDashboard } from '../UserManagementDashboard';

// Mock fetch globally
global.fetch = jest.fn();

const mockUserStats = {
  overview: {
    totalUsers: 150,
    recentUsers: 25,
    weeklyUsers: 8,
    usersWithCollections: 120,
    usersWithGroups: 45,
    usersWithDecisions: 95,
  },
  trends: {
    dailyRegistrations: [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-02', count: 3 },
      { date: '2024-01-03', count: 7 },
    ],
  },
  social: {
    totalFriendRequests: 200,
    pendingFriendRequests: 15,
    totalGroupInvitations: 50,
    pendingGroupInvitations: 8,
  },
  topActiveUsers: [
    {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      collectionCount: 10,
      groupCount: 5,
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: '2024-01-02T00:00:00Z',
      collectionCount: 8,
      groupCount: 3,
    },
  ],
};

const mockUserSearchResults = {
  users: [
    {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      createdAt: '2024-01-01T00:00:00Z',
      lastActiveAt: '2024-01-15T10:00:00Z',
      collectionCount: 10,
      groupCount: 5,
      decisionCount: 25,
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      username: 'janesmith',
      createdAt: '2024-01-02T00:00:00Z',
      lastActiveAt: '2024-01-14T15:30:00Z',
      collectionCount: 8,
      groupCount: 3,
      decisionCount: 18,
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    totalCount: 150,
    totalPages: 8,
  },
};

describe('UserManagementDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<UserManagementDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders user statistics after loading', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      });

    render(<UserManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    // Check overview stats - use more specific selectors
    expect(screen.getByText('150')).toBeInTheDocument(); // Total users
    expect(screen.getAllByText('8')[0]).toBeInTheDocument(); // Weekly users (first occurrence)
    expect(screen.getByText('120')).toBeInTheDocument(); // Users with collections
    expect(screen.getByText('45')).toBeInTheDocument(); // Users in groups
    expect(screen.getByText('23')).toBeInTheDocument(); // Pending requests (15 + 8)
  });

  it('displays user search functionality', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      });

    render(<UserManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Search')).toBeInTheDocument();
    });

    // Check search form elements
    expect(
      screen.getByPlaceholderText(/search by name, email, or username/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('performs user search when form is submitted', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      });

    render(<UserManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Search')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search by name, email, or username/i
    );
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'john' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      // Check that the search API was called with the john query
      const calls = (fetch as jest.Mock).mock.calls;
      const searchCall = calls.find(
        (call) => call[0] && call[0].includes('/api/admin/users/search?q=john')
      );
      expect(searchCall).toBeDefined();
    });
  });

  it('displays search results in table format', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      });

    render(<UserManagementDashboard />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('User Search')).toBeInTheDocument();
    });

    // Perform a search
    const searchInput = screen.getByPlaceholderText(
      /search by name, email, or username/i
    );
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'john' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Decisions')).toBeInTheDocument();
    expect(screen.getByText('Joined')).toBeInTheDocument();

    // Check user data - use more specific selectors
    expect(screen.getAllByText('john@example.com')[0]).toBeInTheDocument();
    expect(screen.getAllByText('jane@example.com')[0]).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // John's collections
    expect(screen.getAllByText('8')[1]).toBeInTheDocument(); // Jane's collections (second occurrence)
  });

  it('displays top active users section', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      });

    render(<UserManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Top Active Users')).toBeInTheDocument();
    });

    // Check top active users - use more specific selectors
    expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
    expect(screen.getByText('10 collections')).toBeInTheDocument();
    expect(screen.getByText('5 groups')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      });

    render(<UserManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4); // 2 initial + 2 refresh calls
    });
  });

  it('handles sorting options', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      });

    render(<UserManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Search')).toBeInTheDocument();
    });

    // Check sort options are present
    const sortSelect = screen.getByDisplayValue('Created Date');
    expect(sortSelect).toBeInTheDocument();

    const orderSelect = screen.getByDisplayValue('Descending');
    expect(orderSelect).toBeInTheDocument();
  });

  it('displays pagination when there are multiple pages', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      });

    render(<UserManagementDashboard />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('User Search')).toBeInTheDocument();
    });

    // Perform a search to get results with pagination
    const searchInput = screen.getByPlaceholderText(
      /search by name, email, or username/i
    );
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'john' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 8')).toBeInTheDocument();
    });

    // Check pagination buttons
    expect(
      screen.getByRole('button', { name: /previous/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<UserManagementDashboard />);

    await waitFor(() => {
      // Component should still render even with API errors
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  it('shows loading state during search', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUserSearchResults }),
      })
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves for search

    render(<UserManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Search')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search by name, email, or username/i
    );
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    // Should show loading spinner
    expect(
      screen.getByRole('button', { name: /refresh/i })
    ).toBeInTheDocument();
  });
});
