import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FriendSearch } from '../FriendSearch';
import { useUserSearch, useSendFriendRequest } from '@/hooks/api/useFriends';

// Mock the hooks
jest.mock('@/hooks/api/useFriends', () => ({
  useUserSearch: jest.fn(),
  useSendFriendRequest: jest.fn(),
}));

const mockUseUserSearch = useUserSearch as jest.MockedFunction<
  typeof useUserSearch
>;
const mockUseSendFriendRequest = useSendFriendRequest as jest.MockedFunction<
  typeof useSendFriendRequest
>;

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

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('FriendSearch', () => {
  const mockSendFriendRequest = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUserSearch.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    mockUseSendFriendRequest.mockReturnValue({
      mutateAsync: mockSendFriendRequest,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as ReturnType<typeof useUserSearch>);
  });

  it('renders search form correctly', () => {
    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Add Friends')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search by email, name, or username...')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Search for friends by email, name, or username to send them a friend request.'
      )
    ).toBeInTheDocument();
  });

  it('shows loading state when searching', () => {
    mockUseUserSearch.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows error state when search fails', () => {
    mockUseUserSearch.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Search failed'),
      isError: true,
      isSuccess: false,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('displays search results', () => {
    const mockResults = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
      },
      {
        _id: 'user3',
        clerkId: 'clerk3',
        email: 'jane@example.com',
        name: 'Jane Smith',
        profilePicture: null,
        city: 'Los Angeles',
      },
    ];

    mockUseUserSearch.mockReturnValue({
      data: mockResults,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });

  it('handles sending friend request', async () => {
    const mockResults = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
      },
    ];

    mockUseUserSearch.mockReturnValue({
      data: mockResults,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    mockSendFriendRequest.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add Friend');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockSendFriendRequest).toHaveBeenCalledWith({
        requesterId: 'user1',
        addresseeId: 'clerk2',
      });
    });
  });

  it('shows loading state when sending friend request', () => {
    const mockResults = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
      },
    ];

    mockUseUserSearch.mockReturnValue({
      data: mockResults,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    mockUseSendFriendRequest.mockReturnValue({
      mutateAsync: mockSendFriendRequest,
      isPending: true,
      isError: false,
      isSuccess: false,
      error: null,
    } as ReturnType<typeof useUserSearch>);

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('shows no results message when no users found', () => {
    mockUseUserSearch.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    // Mock search query to simulate a search was performed
    jest.spyOn(React, 'useState').mockImplementation((initial) => {
      if (typeof initial === 'string') {
        return ['test', jest.fn()];
      }
      return [initial, jest.fn()];
    });

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(
      screen.getByText('No users found matching "test"')
    ).toBeInTheDocument();
  });

  it('shows placeholder message when no search query', () => {
    // Mock useState to return empty query
    jest.spyOn(React, 'useState').mockImplementation((initial) => {
      if (typeof initial === 'string') {
        return ['', jest.fn()];
      }
      return [initial, jest.fn()];
    });

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(
      screen.getByText('Enter an email or name to search for friends')
    ).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles user without profile picture', () => {
    const mockResults = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: null,
        city: 'New York',
      },
    ];

    mockUseUserSearch.mockReturnValue({
      data: mockResults,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useUserSearch>);

    render(
      <TestWrapper>
        <FriendSearch userId="user1" onClose={mockOnClose} />
      </TestWrapper>
    );

    // Should show initials instead of profile picture
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
