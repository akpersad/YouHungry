import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FriendRequests } from '../FriendRequests';
import {
  useFriendRequests,
  useUpdateFriendRequest,
} from '@/hooks/api/useFriends';

// Mock the hooks
jest.mock('@/hooks/api/useFriends', () => ({
  useFriendRequests: jest.fn(),
  useUpdateFriendRequest: jest.fn(),
}));

const mockUseFriendRequests = useFriendRequests as jest.MockedFunction<
  typeof useFriendRequests
>;
const mockUseUpdateFriendRequest =
  useUpdateFriendRequest as jest.MockedFunction<typeof useUpdateFriendRequest>;

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

describe('FriendRequests', () => {
  const mockUpdateFriendRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFriendRequests.mockReturnValue({
      data: { sent: [], received: [] },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    mockUseUpdateFriendRequest.mockReturnValue({
      mutateAsync: mockUpdateFriendRequest,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    } as ReturnType<typeof useFriendRequests>);
  });

  it('renders friend requests correctly', () => {
    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('Friend Requests')).toBeInTheDocument();
    expect(screen.getByText('0 requests')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseFriendRequests.mockReturnValue({
      data: { sent: [], received: [] },
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('Loading requests...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseFriendRequests.mockReturnValue({
      data: { sent: [], received: [] },
      isLoading: false,
      error: new Error('Failed to load friend requests'),
      isError: true,
      isSuccess: false,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    expect(
      screen.getByText('Failed to load friend requests')
    ).toBeInTheDocument();
  });

  it('shows empty state when no requests', () => {
    mockUseFriendRequests.mockReturnValue({
      data: { sent: [], received: [] },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('No pending friend requests')).toBeInTheDocument();
  });

  it('displays received requests', () => {
    const mockRequests = {
      sent: [],
      received: [
        {
          _id: 'request1',
          requester: {
            _id: 'user2',
            clerkId: 'clerk2',
            email: 'john@example.com',
            name: 'John Doe',
            profilePicture: 'pic1.jpg',
          },
          addressee: {
            _id: 'user1',
            clerkId: 'clerk1',
            email: 'jane@example.com',
            name: 'Jane Smith',
            profilePicture: 'pic2.jpg',
          },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ],
    };

    mockUseFriendRequests.mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('1 request')).toBeInTheDocument();
    expect(screen.getByText('Received Requests (1)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeInTheDocument();
  });

  it('displays sent requests', () => {
    const mockRequests = {
      sent: [
        {
          _id: 'request1',
          requester: {
            _id: 'user1',
            clerkId: 'clerk1',
            email: 'jane@example.com',
            name: 'Jane Smith',
            profilePicture: 'pic2.jpg',
          },
          addressee: {
            _id: 'user2',
            clerkId: 'clerk2',
            email: 'john@example.com',
            name: 'John Doe',
            profilePicture: 'pic1.jpg',
          },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ],
      received: [],
    };

    mockUseFriendRequests.mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('1 request')).toBeInTheDocument();
    expect(screen.getByText('Sent Requests (1)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('handles accepting friend request', async () => {
    const mockRequests = {
      sent: [],
      received: [
        {
          _id: 'request1',
          requester: {
            _id: 'user2',
            clerkId: 'clerk2',
            email: 'john@example.com',
            name: 'John Doe',
            profilePicture: 'pic1.jpg',
          },
          addressee: {
            _id: 'user1',
            clerkId: 'clerk1',
            email: 'jane@example.com',
            name: 'Jane Smith',
            profilePicture: 'pic2.jpg',
          },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ],
    };

    mockUseFriendRequests.mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    mockUpdateFriendRequest.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(mockUpdateFriendRequest).toHaveBeenCalledWith({
        friendshipId: 'request1',
        action: 'accept',
        userId: 'user1',
      });
    });
  });

  it('handles declining friend request', async () => {
    const mockRequests = {
      sent: [],
      received: [
        {
          _id: 'request1',
          requester: {
            _id: 'user2',
            clerkId: 'clerk2',
            email: 'john@example.com',
            name: 'John Doe',
            profilePicture: 'pic1.jpg',
          },
          addressee: {
            _id: 'user1',
            clerkId: 'clerk1',
            email: 'jane@example.com',
            name: 'Jane Smith',
            profilePicture: 'pic2.jpg',
          },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ],
    };

    mockUseFriendRequests.mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    mockUpdateFriendRequest.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    await waitFor(() => {
      expect(mockUpdateFriendRequest).toHaveBeenCalledWith({
        friendshipId: 'request1',
        action: 'decline',
        userId: 'user1',
      });
    });
  });

  it('shows loading state when updating request', () => {
    const mockRequests = {
      sent: [],
      received: [
        {
          _id: 'request1',
          requester: {
            _id: 'user2',
            clerkId: 'clerk2',
            email: 'john@example.com',
            name: 'John Doe',
            profilePicture: 'pic1.jpg',
          },
          addressee: {
            _id: 'user1',
            clerkId: 'clerk1',
            email: 'jane@example.com',
            name: 'Jane Smith',
            profilePicture: 'pic2.jpg',
          },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ],
    };

    mockUseFriendRequests.mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    mockUseUpdateFriendRequest.mockReturnValue({
      mutateAsync: mockUpdateFriendRequest,
      isPending: true,
      isError: false,
      isSuccess: false,
      error: null,
    } as ReturnType<typeof useFriendRequests>);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    expect(screen.getByText('Accept')).toBeDisabled();
    expect(screen.getByText('Decline')).toBeDisabled();
  });

  it('handles user without profile picture', () => {
    const mockRequests = {
      sent: [],
      received: [
        {
          _id: 'request1',
          requester: {
            _id: 'user2',
            clerkId: 'clerk2',
            email: 'john@example.com',
            name: 'John Doe',
            profilePicture: null,
          },
          addressee: {
            _id: 'user1',
            clerkId: 'clerk1',
            email: 'jane@example.com',
            name: 'Jane Smith',
            profilePicture: 'pic2.jpg',
          },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ],
    };

    mockUseFriendRequests.mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as ReturnType<typeof useFriendRequests>);

    render(
      <TestWrapper>
        <FriendRequests userId="user1" />
      </TestWrapper>
    );

    // Should show initials instead of profile picture
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
