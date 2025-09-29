import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FriendSelectionModal } from '../FriendSelectionModal';
import { useFriends } from '@/hooks/api/useFriends';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('@/hooks/api/useFriends');
jest.mock('@clerk/nextjs');
jest.mock('react-hot-toast');

const mockUseFriends = useFriends as jest.MockedFunction<typeof useFriends>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockFriends = [
  {
    _id: 'friend1',
    clerkId: 'clerk1',
    name: 'John Doe',
    email: 'john@example.com',
    profilePicture: undefined,
    friendshipId: 'friendship1',
    addedAt: new Date(),
  },
  {
    _id: 'friend2',
    clerkId: 'clerk2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    profilePicture: undefined,
    friendshipId: 'friendship2',
    addedAt: new Date(),
  },
  {
    _id: 'friend3',
    clerkId: 'clerk3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    profilePicture: undefined,
    friendshipId: 'friendship3',
    addedAt: new Date(),
  },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onInviteFriends: jest.fn(),
  groupId: 'test-group-id',
  isLoading: false,
};

describe('FriendSelectionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      userId: 'user1',
      isSignedIn: true,
      isLoaded: true,
    });
    mockUseFriends.mockReturnValue({
      data: mockFriends,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders modal when open', () => {
    render(<FriendSelectionModal {...defaultProps} />);

    expect(screen.getByText('Invite Friends to Group')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search friends by name or email...')
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<FriendSelectionModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText('Invite Friends to Group')
    ).not.toBeInTheDocument();
  });

  it('displays friends list', () => {
    render(<FriendSelectionModal {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('filters friends by search term', async () => {
    render(<FriendSelectionModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'Search friends by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: 'john' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('handles empty search results', async () => {
    render(<FriendSelectionModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'Search friends by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(
        screen.getByText('No friends found matching your search')
      ).toBeInTheDocument();
    });
  });

  it('shows Invite To Group button for each friend', () => {
    render(<FriendSelectionModal {...defaultProps} />);

    const inviteButtons = screen.getAllByText('Invite To Group');
    expect(inviteButtons).toHaveLength(3);
  });

  it('invites individual friend when Invite To Group button is clicked', async () => {
    const mockOnInviteFriends = jest.fn().mockResolvedValue(undefined);
    render(
      <FriendSelectionModal
        {...defaultProps}
        onInviteFriends={mockOnInviteFriends}
      />
    );

    const inviteButtons = screen.getAllByText('Invite To Group');
    fireEvent.click(inviteButtons[0]);

    await waitFor(() => {
      expect(mockOnInviteFriends).toHaveBeenCalledWith(['john@example.com']);
      expect(mockToast.success).toHaveBeenCalledWith(
        'Successfully invited friend to the group!'
      );
    });
  });

  it('shows pagination when there are many friends', () => {
    const manyFriends = Array.from({ length: 25 }, (_, i) => ({
      _id: `friend${i}`,
      clerkId: `clerk${i}`,
      name: `Friend ${i}`,
      email: `friend${i}@example.com`,
      profilePicture: undefined,
      friendshipId: `friendship${i}`,
      addedAt: new Date(),
    }));

    mockUseFriends.mockReturnValue({
      data: manyFriends,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<FriendSelectionModal {...defaultProps} />);

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('navigates between pages', () => {
    const manyFriends = Array.from({ length: 25 }, (_, i) => ({
      _id: `friend${i}`,
      clerkId: `clerk${i}`,
      name: `Friend ${i}`,
      email: `friend${i}@example.com`,
      profilePicture: undefined,
      friendshipId: `friendship${i}`,
      addedAt: new Date(),
    }));

    mockUseFriends.mockReturnValue({
      data: manyFriends,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<FriendSelectionModal {...defaultProps} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('shows error when invitation fails', async () => {
    const mockOnInviteFriends = jest
      .fn()
      .mockRejectedValue(new Error('Failed to invite'));
    render(
      <FriendSelectionModal
        {...defaultProps}
        onInviteFriends={mockOnInviteFriends}
      />
    );

    // Click invite button for first friend
    const inviteButtons = screen.getAllByText('Invite To Group');
    fireEvent.click(inviteButtons[0]);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to send invitation. Please try again.'
      );
    });
  });

  it('shows loading state on individual invite button during invitation', async () => {
    const mockOnInviteFriends = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(
      <FriendSelectionModal
        {...defaultProps}
        onInviteFriends={mockOnInviteFriends}
      />
    );

    const inviteButtons = screen.getAllByText('Invite To Group');
    fireEvent.click(inviteButtons[0]);

    // All buttons should be disabled during invitation
    const allButtons = screen.getAllByText('Invite To Group');
    allButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });

    // The first button should have loading state (spinner)
    const firstButton = allButtons[0];
    expect(firstButton).toBeDisabled();
    // Button should still show the original text but be disabled
    expect(firstButton).toHaveTextContent('Invite To Group');
  });

  it('shows loading state', () => {
    mockUseFriends.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<FriendSelectionModal {...defaultProps} />);

    expect(screen.getByText('Loading friends...')).toBeInTheDocument();
  });

  it('shows error state and retry button', () => {
    const mockRefetch = jest.fn();
    mockUseFriends.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
    });

    render(<FriendSelectionModal {...defaultProps} />);

    expect(screen.getByText('Failed to load friends')).toBeInTheDocument();

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('resets state when modal opens', () => {
    const { rerender } = render(
      <FriendSelectionModal {...defaultProps} isOpen={false} />
    );

    // Open modal
    rerender(<FriendSelectionModal {...defaultProps} isOpen={true} />);

    // Search should be empty
    const searchInput = screen.getByPlaceholderText(
      'Search friends by name or email...'
    );
    expect(searchInput).toHaveValue('');
  });

  it('handles Enter key in search input', async () => {
    render(<FriendSelectionModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'Search friends by name or email...'
    );
    fireEvent.change(searchInput, { target: { value: 'john@example.com' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

    // Should not trigger any errors
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<FriendSelectionModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('disables pagination buttons during invitation', async () => {
    const mockOnInviteFriends = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

    // Use many friends to ensure pagination is shown
    const manyFriends = Array.from({ length: 25 }, (_, i) => ({
      _id: `friend${i}`,
      clerkId: `clerk${i}`,
      name: `Friend ${i}`,
      email: `friend${i}@example.com`,
      profilePicture: undefined,
      friendshipId: `friendship${i}`,
      addedAt: new Date(),
    }));

    mockUseFriends.mockReturnValue({
      data: manyFriends,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <FriendSelectionModal
        {...defaultProps}
        onInviteFriends={mockOnInviteFriends}
      />
    );

    const inviteButtons = screen.getAllByText('Invite To Group');
    fireEvent.click(inviteButtons[0]);

    // Pagination buttons should be disabled during invitation
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('prevents closing modal during invitation', async () => {
    const mockOnInviteFriends = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(
      <FriendSelectionModal
        {...defaultProps}
        onInviteFriends={mockOnInviteFriends}
      />
    );

    const inviteButtons = screen.getAllByText('Invite To Group');
    fireEvent.click(inviteButtons[0]);

    // Try to close modal
    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);

    // Modal should still be open
    expect(screen.getByText('Invite Friends to Group')).toBeInTheDocument();
  });
});
