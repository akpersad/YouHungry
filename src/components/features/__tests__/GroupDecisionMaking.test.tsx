import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { GroupDecisionMaking } from '../GroupDecisionMaking';
import { useGroupDecisionSubscription } from '@/hooks/api/useGroupDecisionSubscription';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock the subscription hook
jest.mock('@/hooks/api/useGroupDecisionSubscription', () => ({
  useGroupDecisionSubscription: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser = {
  id: 'user_123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
};

const mockDecisions = [
  {
    id: 'decision_1',
    type: 'group' as const,
    collectionId: 'collection_1',
    groupId: 'group_1',
    method: 'tiered' as const,
    status: 'active' as const,
    deadline: '2024-01-02T12:00:00Z',
    visitDate: '2024-01-01T18:00:00Z',
    participants: ['user_123', 'user_456'],
    votes: [
      {
        userId: 'user_123',
        submittedAt: '2024-01-01T10:00:00Z',
        hasRankings: true,
      },
    ],
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'decision_2',
    type: 'group' as const,
    collectionId: 'collection_1',
    groupId: 'group_1',
    method: 'tiered' as const,
    status: 'completed' as const,
    deadline: '2024-01-02T12:00:00Z',
    visitDate: '2024-01-01T18:00:00Z',
    participants: ['user_123', 'user_456'],
    votes: [
      {
        userId: 'user_123',
        submittedAt: '2024-01-01T10:00:00Z',
        hasRankings: true,
      },
      {
        userId: 'user_456',
        submittedAt: '2024-01-01T11:00:00Z',
        hasRankings: true,
      },
    ],
    result: {
      restaurantId: 'restaurant_1',
      selectedAt: '2024-01-01T12:00:00Z',
      reasoning: 'Most popular choice among group members',
    },
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
];

const mockRestaurants = [
  {
    _id: 'restaurant_1',
    googlePlaceId: 'place_1',
    name: 'Test Restaurant 1',
    address: '123 Test St, Test City',
    coordinates: { lat: 40.7128, lng: -74.006 },
    cuisine: 'Italian',
    rating: 4.5,
    priceRange: '$$',
    phoneNumber: '+1-555-0123',
    photos: ['photo1.jpg'],
    website: 'https://testrestaurant1.com',
    hours: {
      Monday: '9:00 AM - 10:00 PM',
      Tuesday: '9:00 AM - 10:00 PM',
      Wednesday: '9:00 AM - 10:00 PM',
      Thursday: '9:00 AM - 10:00 PM',
      Friday: '9:00 AM - 11:00 PM',
      Saturday: '9:00 AM - 11:00 PM',
      Sunday: '9:00 AM - 10:00 PM',
    },
    cachedAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date('2024-01-01T00:00:00Z'),
  },
  {
    _id: 'restaurant_2',
    googlePlaceId: 'place_2',
    name: 'Test Restaurant 2',
    address: '456 Test Ave, Test City',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    cuisine: 'Mexican',
    rating: 4.2,
    priceLevel: '$',
    phone: '+1-555-0456',
    photos: ['photo2.jpg'],
    website: 'https://testrestaurant2.com',
    hours: {
      Monday: '11:00 AM - 9:00 PM',
      Tuesday: '11:00 AM - 9:00 PM',
      Wednesday: '11:00 AM - 9:00 PM',
      Thursday: '11:00 AM - 9:00 PM',
      Friday: '11:00 AM - 10:00 PM',
      Saturday: '11:00 AM - 10:00 PM',
      Sunday: '11:00 AM - 9:00 PM',
    },
    cachedAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date('2024-01-01T00:00:00Z'),
  },
];

const mockCurrentUser = {
  _id: 'user_123',
  clerkId: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  profilePicture: 'https://example.com/avatar.jpg',
  city: 'Test City',
  smsOptIn: false,
  smsPhoneNumber: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe('GroupDecisionMaking', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: mockDecisions,
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockCurrentUser }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ restaurants: mockRestaurants }),
      });
  });

  it('renders group decision making interface', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Group Decisions')).toBeInTheDocument();
    });
  });

  it('shows start decision button for admins', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Start Decision')).toBeInTheDocument();
    });
  });

  it('does not show start decision button for non-admins', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Start Decision')).not.toBeInTheDocument();
    });
  });

  it('displays active decisions correctly', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tiered Choice')).toBeInTheDocument();
      expect(screen.getByText('Visit Date: 1/1/2024')).toBeInTheDocument();
      expect(
        screen.getByText('Deadline: 1/2/2024, 7:00:00 AM')
      ).toBeInTheDocument();
    });
  });

  it('shows vote status for active decisions', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("✓ You've Voted")).toBeInTheDocument();
      expect(screen.getByText('Votes: 1 / 2')).toBeInTheDocument();
    });
  });

  it('displays completed decisions with restaurant details', async () => {
    // Mock completed decision data with recent visit date (within 24 hours)
    const completedDecision = {
      ...mockDecisions[1],
      status: 'completed' as const,
      visitDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    };

    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [completedDecision],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });

    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Decision Completed!')).toBeInTheDocument();
      expect(screen.getByText('Selected Restaurant:')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
      expect(screen.getByText('📍 123 Test St, Test City')).toBeInTheDocument();
      expect(screen.getByText('📞 +1-555-0123')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.5/5')).toBeInTheDocument();
      expect(screen.getByText('💰 $$')).toBeInTheDocument();
      expect(
        screen.getByText('Most popular choice among group members')
      ).toBeInTheDocument();
    });
  });

  it('opens create decision modal when start decision is clicked', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Start Decision')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start Decision'));

    await waitFor(() => {
      expect(screen.getByText('Start Group Decision')).toBeInTheDocument();
      expect(screen.getByText('Visit Date')).toBeInTheDocument();
    });
  });

  it('opens voting interface when vote button is clicked', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Re-vote')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Re-vote'));

    await waitFor(() => {
      expect(screen.getByText('Rank Your Preferences')).toBeInTheDocument();
    });
  });

  it('shows complete button for decisions that can be completed', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  it('shows close button for active decisions when user is admin', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  it('does not show close button for non-admins', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });
  });

  it('handles drag and drop for restaurant rankings', async () => {
    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    // Click vote button to open voting interface
    await waitFor(() => {
      expect(screen.getByText('Re-vote')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Re-vote'));

    await waitFor(() => {
      expect(screen.getByText('Rank Your Preferences')).toBeInTheDocument();
    });

    // Check that restaurants are displayed for ranking
    expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
    expect(screen.getByText('Test Restaurant 2')).toBeInTheDocument();
  });

  it('shows loading state while fetching data', () => {
    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [],
      isConnected: false,
      error: null,
      reconnect: jest.fn(),
    });

    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    expect(screen.getByText('Loading decisions...')).toBeInTheDocument();
  });

  it('shows no decisions message when no decisions exist', async () => {
    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });

    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('No active or recent decisions')
      ).toBeInTheDocument();
    });
  });

  it('handles subscription errors gracefully', async () => {
    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [], // Empty array from subscription
      isConnected: false,
      error: new Error('Subscription failed'),
      reconnect: jest.fn(),
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockCurrentUser }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ restaurants: mockRestaurants }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, decisions: mockDecisions }),
      });

    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    // Should show disconnected status
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    // Should show reconnect button
    expect(screen.getByText('Reconnect')).toBeInTheDocument();
  });

  it('filters completed decisions by 24-hour rule', async () => {
    const oldCompletedDecision = {
      ...mockDecisions[1],
      visitDate: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
    };

    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [mockDecisions[0], oldCompletedDecision],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });

    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      // Should only show the active decision, not the old completed one
      expect(screen.getByText('Tiered Choice')).toBeInTheDocument();
      expect(screen.queryByText('Decision Completed!')).not.toBeInTheDocument();
    });
  });

  it('does not show closed decisions', async () => {
    const closedDecision = {
      ...mockDecisions[0],
      status: 'closed' as const,
    };

    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [closedDecision],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });

    renderWithQueryClient(
      <GroupDecisionMaking
        groupId="group_1"
        collectionId="collection_1"
        isAdmin={true}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('No active or recent decisions')
      ).toBeInTheDocument();
    });
  });
});
