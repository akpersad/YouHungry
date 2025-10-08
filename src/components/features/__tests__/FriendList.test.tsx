import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FriendList } from '../FriendList';
import { useFriends, useRemoveFriend } from '@/hooks/api/useFriends';

// Mock the hooks
jest.mock('@/hooks/api/useFriends', () => ({
  useFriends: jest.fn(),
  useRemoveFriend: jest.fn(),
}));

const mockUseFriends = useFriends as jest.MockedFunction<typeof useFriends>;
const mockUseRemoveFriend = useRemoveFriend as jest.MockedFunction<
  typeof useRemoveFriend
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

describe('FriendList', () => {
  const mockRemoveFriend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFriends.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    mockUseRemoveFriend.mockReturnValue({
      mutateAsync: mockRemoveFriend,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as any);
  });

  it('renders friends list correctly', () => {
    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('Friends')).toBeInTheDocument();
    expect(screen.getByText('0 friends')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseFriends.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('Loading friends...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseFriends.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load friends'),
      isError: true,
      isSuccess: false,
      refetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load friends')).toBeInTheDocument();
  });

  it('displays friends list', () => {
    const mockFriends = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        friendshipId: 'friendship1',
        addedAt: new Date('2023-01-01'),
      },
      {
        _id: 'user3',
        clerkId: 'clerk3',
        email: 'jane@example.com',
        name: 'Jane Smith',
        profilePicture: null,
        city: 'Los Angeles',
        friendshipId: 'friendship2',
        addedAt: new Date('2023-01-02'),
      },
    ];

    mockUseFriends.mockReturnValue({
      data: mockFriends,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('2 friends')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });

  it('shows empty state when no friends', () => {
    mockUseFriends.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('No friends yet')).toBeInTheDocument();
    expect(
      screen.getByText('Search for friends to add them to your network')
    ).toBeInTheDocument();
  });

  it('handles remove friend click', async () => {
    const mockFriends = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        friendshipId: 'friendship1',
        addedAt: new Date('2023-01-01'),
      },
    ];

    mockUseFriends.mockReturnValue({
      data: mockFriends,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(screen.getAllByText('Remove Friend')).toHaveLength(2); // Modal title and button
    expect(
      screen.getByText(
        'Are you sure you want to remove this friend? This action cannot be undone.'
      )
    ).toBeInTheDocument();
  });

  it('handles remove friend confirmation', async () => {
    const mockFriends = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        friendshipId: 'friendship1',
        addedAt: new Date('2023-01-01'),
      },
    ];

    mockUseFriends.mockReturnValue({
      data: mockFriends,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    mockRemoveFriend.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    const confirmButton = screen.getAllByText('Remove Friend')[1]; // Get the modal button
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRemoveFriend).toHaveBeenCalledWith({
        friendshipId: 'friendship1',
        userId: 'user1',
      });
    });
  });

  it.skip('handles remove friend cancellation', () => {
    const mockFriends = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        friendshipId: 'friendship1',
        addedAt: new Date('2023-01-01'),
      },
    ];

    mockUseFriends.mockReturnValue({
      data: mockFriends,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading state when removing friend', () => {
    const mockFriends = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: 'pic1.jpg',
        city: 'New York',
        friendshipId: 'friendship1',
        addedAt: new Date('2023-01-01'),
      },
    ];

    mockUseFriends.mockReturnValue({
      data: mockFriends,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    mockUseRemoveFriend.mockReturnValue({
      mutateAsync: mockRemoveFriend,
      isPending: true,
      isError: false,
      isSuccess: false,
      error: null,
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.getByText('Remove').closest('button')).toHaveAttribute(
      'disabled'
    );
  });

  it('handles user without profile picture', () => {
    const mockFriends = [
      {
        _id: 'user2',
        clerkId: 'clerk2',
        email: 'john@example.com',
        name: 'John Doe',
        profilePicture: null,
        city: 'New York',
        friendshipId: 'friendship1',
        addedAt: new Date('2023-01-01'),
      },
    ];

    mockUseFriends.mockReturnValue({
      data: mockFriends,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);

    render(
      <TestWrapper>
        <FriendList userId="user1" />
      </TestWrapper>
    );

    // Should show initials instead of profile picture
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
