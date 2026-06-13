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

const activeDecision = {
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
  voteBreakdown: {},
  myRankings: ['restaurant_1'],
  createdAt: '2024-01-01T09:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

const completedDecision = {
  id: 'decision_2',
  type: 'group' as const,
  collectionId: 'collection_1',
  groupId: 'group_1',
  method: 'tiered' as const,
  status: 'completed' as const,
  deadline: '2024-01-02T12:00:00Z',
  // Recent visit (within 24h) so it renders as a result card.
  visitDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
  voteBreakdown: {
    restaurant_1: { first: 2, second: 0, third: 0, total: 6 },
    restaurant_2: { first: 0, second: 2, third: 0, total: 4 },
  },
  myRankings: ['restaurant_1', 'restaurant_2'],
  result: {
    restaurantId: 'restaurant_1',
    selectedAt: '2024-01-01T12:00:00Z',
    reasoning: 'Most popular choice among group members',
  },
  createdAt: '2024-01-01T09:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
};

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
    priceRange: '$',
    photos: ['photo2.jpg'],
    cachedAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date('2024-01-01T00:00:00Z'),
  },
];

const mockCurrentUser = {
  _id: 'user_123',
  clerkId: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

/**
 * Route fetch by URL so the three queries (current user, collection
 * restaurants, decision history) resolve regardless of call order.
 */
const installFetchMock = (allDecisions: unknown[] = []) => {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/user/current')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ user: mockCurrentUser }),
      });
    }
    if (url.includes('/restaurants')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ restaurants: mockRestaurants }),
      });
    }
    if (url.includes('/api/decisions/group')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, decisions: allDecisions }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

const renderComponent = (isAdmin = true) =>
  renderWithQueryClient(
    <GroupDecisionMaking
      groupId="group_1"
      collectionId="collection_1"
      isAdmin={isAdmin}
    />
  );

describe('GroupDecisionMaking', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useUser as jest.Mock).mockReturnValue({ user: mockUser, isLoaded: true });

    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [activeDecision],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });

    installFetchMock([activeDecision, completedDecision]);
  });

  it('renders group decision making interface', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Group Decisions')).toBeInTheDocument();
    });
  });

  it('shows live presence status', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('Live').length).toBeGreaterThan(0);
    });
  });

  it('shows start decision button for admins', async () => {
    renderComponent(true);
    await waitFor(() => {
      expect(screen.getByText('Start Decision')).toBeInTheDocument();
    });
  });

  it('does not show start decision button for non-admins', async () => {
    renderComponent(false);
    await waitFor(() => {
      expect(screen.getByText('Group Decisions')).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: 'Start Decision' })
    ).not.toBeInTheDocument();
  });

  it('displays active decisions with a presence line', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Tiered Choice')).toBeInTheDocument();
    });
    // "1 of 2 voted" presence line
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName.toLowerCase() === 'p' &&
          (element?.textContent ?? '').includes('1 of 2 voted')
      )
    ).toBeInTheDocument();
  });

  it('shows the voted badge for the current user', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("✓ You've Voted")).toBeInTheDocument();
    });
  });

  it('displays recently completed decisions with a vote breakdown', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Decision Completed!')).toBeInTheDocument();
    });
    expect(screen.getByText('Selected Restaurant')).toBeInTheDocument();
    expect(screen.getAllByText('Test Restaurant 1').length).toBeGreaterThan(0);
    expect(screen.getByText('How votes fell')).toBeInTheDocument();
    expect(
      screen.getByText('Most popular choice among group members')
    ).toBeInTheDocument();
  });

  it('opens the create decision modal when start decision is clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Start Decision')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start Decision'));

    await waitFor(() => {
      expect(screen.getByText('Start Group Decision')).toBeInTheDocument();
      expect(screen.getByText('Visit Date')).toBeInTheDocument();
    });
  });

  it('opens the full-page voting view when vote is clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Re-vote')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Re-vote'));

    await waitFor(() => {
      expect(screen.getByText('Rank your top 3')).toBeInTheDocument();
    });
    // Restaurants are tappable in the voting view
    expect(screen.getAllByText('Test Restaurant 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Test Restaurant 2').length).toBeGreaterThan(0);
  });

  it('preloads the existing ballot when re-voting (V5)', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Re-vote')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Re-vote'));

    await waitFor(() => {
      // myRankings preloaded -> shows "Your ranking (1/3)"
      expect(screen.getByText(/Your ranking \(1\/3\)/)).toBeInTheDocument();
    });
  });

  it('shows complete button for decisions that can be completed', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  it('shows close button for active decisions when user is admin', async () => {
    renderComponent(true);
    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  it('does not show close button for non-admins', async () => {
    renderComponent(false);
    await waitFor(() => {
      expect(screen.getByText('Tiered Choice')).toBeInTheDocument();
    });
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('shows loading skeleton while fetching data', () => {
    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [],
      isConnected: false,
      error: null,
      reconnect: jest.fn(),
    });
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    renderComponent();

    expect(
      screen.getByLabelText('Loading group decisions')
    ).toBeInTheDocument();
  });

  it('shows a designed empty state when no active decision exists', async () => {
    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });
    installFetchMock([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No active decision')).toBeInTheDocument();
    });
  });

  it('lists older completed/closed decisions under past decisions', async () => {
    const oldCompleted = {
      ...completedDecision,
      id: 'decision_old',
      visitDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    };

    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [activeDecision],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });
    installFetchMock([activeDecision, oldCompleted]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Past decisions')).toBeInTheDocument();
    });
    expect(screen.queryByText('Decision Completed!')).not.toBeInTheDocument();
  });

  it('does not surface closed decisions as active', async () => {
    const closedDecision = {
      ...activeDecision,
      id: 'decision_closed',
      status: 'closed' as const,
    };

    (useGroupDecisionSubscription as jest.Mock).mockReturnValue({
      decisions: [],
      isConnected: true,
      error: null,
      reconnect: jest.fn(),
    });
    installFetchMock([closedDecision]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No active decision')).toBeInTheDocument();
    });
    // Closed decision still appears in the past list
    expect(screen.getByText('Past decisions')).toBeInTheDocument();
  });
});
