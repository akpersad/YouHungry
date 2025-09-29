import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupInvitations } from '../GroupInvitations';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast');

const mockToast = toast as jest.Mocked<typeof toast>;

const mockInvitations = [
  {
    _id: 'invitation1',
    groupId: 'group1',
    groupName: 'Test Group 1',
    groupDescription: 'A test group for friends',
    inviterName: 'John Doe',
    inviterEmail: 'john@example.com',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    _id: 'invitation2',
    groupId: 'group2',
    groupName: 'Food Lovers',
    groupDescription: undefined,
    inviterName: 'Jane Smith',
    inviterEmail: 'jane@example.com',
    createdAt: '2025-01-14T15:30:00Z',
  },
];

const defaultProps = {
  invitations: mockInvitations,
  onAcceptInvitation: jest.fn(),
  onDeclineInvitation: jest.fn(),
  isLoading: false,
};

describe('GroupInvitations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders invitations list', () => {
    render(<GroupInvitations {...defaultProps} />);

    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    expect(screen.getByText('A test group for friends')).toBeInTheDocument();
    expect(screen.getByText('Food Lovers')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<GroupInvitations {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Loading invitations...')).toBeInTheDocument();
  });

  it('shows empty state when no invitations', () => {
    render(<GroupInvitations {...defaultProps} invitations={[]} />);

    expect(
      screen.getByText('No pending group invitations')
    ).toBeInTheDocument();
    expect(screen.queryByText('Test Group 1')).not.toBeInTheDocument();
  });

  it('handles invitation without description', () => {
    const invitationsWithoutDescription = [mockInvitations[1]]; // Food Lovers has no description
    render(
      <GroupInvitations
        {...defaultProps}
        invitations={invitationsWithoutDescription}
      />
    );

    expect(screen.getByText('Food Lovers')).toBeInTheDocument();
    expect(
      screen.queryByText('A test group for friends')
    ).not.toBeInTheDocument();
  });

  it('accepts invitation successfully', async () => {
    const mockOnAcceptInvitation = jest.fn().mockResolvedValue(undefined);
    render(
      <GroupInvitations
        {...defaultProps}
        onAcceptInvitation={mockOnAcceptInvitation}
      />
    );

    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]); // Accept first invitation

    expect(mockOnAcceptInvitation).toHaveBeenCalledWith('invitation1');

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Successfully joined the group!'
      );
    });
  });

  it('declines invitation successfully', async () => {
    const mockOnDeclineInvitation = jest.fn().mockResolvedValue(undefined);
    render(
      <GroupInvitations
        {...defaultProps}
        onDeclineInvitation={mockOnDeclineInvitation}
      />
    );

    const declineButtons = screen.getAllByText('Decline');
    fireEvent.click(declineButtons[0]); // Decline first invitation

    expect(mockOnDeclineInvitation).toHaveBeenCalledWith('invitation1');

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Invitation declined');
    });
  });

  it('shows error when accepting invitation fails', async () => {
    const mockOnAcceptInvitation = jest
      .fn()
      .mockRejectedValue(new Error('Failed to accept'));
    render(
      <GroupInvitations
        {...defaultProps}
        onAcceptInvitation={mockOnAcceptInvitation}
      />
    );

    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to accept invitation. Please try again.'
      );
    });
  });

  it('shows error when declining invitation fails', async () => {
    const mockOnDeclineInvitation = jest
      .fn()
      .mockRejectedValue(new Error('Failed to decline'));
    render(
      <GroupInvitations
        {...defaultProps}
        onDeclineInvitation={mockOnDeclineInvitation}
      />
    );

    const declineButtons = screen.getAllByText('Decline');
    fireEvent.click(declineButtons[0]);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to decline invitation. Please try again.'
      );
    });
  });

  it('shows loading state on buttons during processing', async () => {
    const mockOnAcceptInvitation = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(
      <GroupInvitations
        {...defaultProps}
        onAcceptInvitation={mockOnAcceptInvitation}
      />
    );

    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    // Button should show loading state (with spinner)
    const updatedAcceptButtons = screen.getAllByText('Accept');
    const firstAcceptButton = updatedAcceptButtons[0];
    expect(firstAcceptButton).toBeDisabled();

    // Other buttons should be disabled
    const declineButtons = screen.getAllByText('Decline');
    expect(declineButtons[0]).toBeDisabled();
  });

  it('disables buttons during processing', async () => {
    const mockOnAcceptInvitation = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(
      <GroupInvitations
        {...defaultProps}
        onAcceptInvitation={mockOnAcceptInvitation}
      />
    );

    const acceptButtons = screen.getAllByText('Accept');
    const declineButtons = screen.getAllByText('Decline');

    fireEvent.click(acceptButtons[0]);

    // All buttons should be disabled during processing
    expect(acceptButtons[0]).toBeDisabled();
    expect(declineButtons[0]).toBeDisabled();
  });

  it('formats dates correctly', () => {
    render(<GroupInvitations {...defaultProps} />);

    // Check that dates are formatted (exact format may vary by locale)
    expect(
      screen.getByText(/1\/15\/2025|15\/1\/2025|2025-01-15/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1\/14\/2025|14\/1\/2025|2025-01-14/)
    ).toBeInTheDocument();
  });

  it('renders user avatars with correct names', () => {
    render(<GroupInvitations {...defaultProps} />);

    // Check that UserAvatar components are rendered (they show initials)
    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
    expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith initials
  });

  it('handles multiple invitations correctly', () => {
    render(<GroupInvitations {...defaultProps} />);

    // Should have 2 invitations
    expect(screen.getAllByText('Accept')).toHaveLength(2);
    expect(screen.getAllByText('Decline')).toHaveLength(2);
    expect(screen.getAllByText('Test Group 1')).toHaveLength(1);
    expect(screen.getAllByText('Food Lovers')).toHaveLength(1);
  });

  it('calls correct handler for each invitation', async () => {
    const mockOnAcceptInvitation = jest.fn().mockResolvedValue(undefined);
    const mockOnDeclineInvitation = jest.fn().mockResolvedValue(undefined);

    render(
      <GroupInvitations
        {...defaultProps}
        onAcceptInvitation={mockOnAcceptInvitation}
        onDeclineInvitation={mockOnDeclineInvitation}
      />
    );

    const acceptButtons = screen.getAllByText('Accept');
    const declineButtons = screen.getAllByText('Decline');

    // Accept first invitation
    fireEvent.click(acceptButtons[0]);
    await waitFor(() => {
      expect(mockOnAcceptInvitation).toHaveBeenCalledWith('invitation1');
    });

    // Decline second invitation
    fireEvent.click(declineButtons[1]);
    await waitFor(() => {
      expect(mockOnDeclineInvitation).toHaveBeenCalledWith('invitation2');
    });
  });

  it('handles async operations properly', async () => {
    const mockOnAcceptInvitation = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 50))
      );

    render(
      <GroupInvitations
        {...defaultProps}
        onAcceptInvitation={mockOnAcceptInvitation}
      />
    );

    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    // Should call the handler
    expect(mockOnAcceptInvitation).toHaveBeenCalledWith('invitation1');

    // Should show success message after completion
    await waitFor(
      () => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Successfully joined the group!'
        );
      },
      { timeout: 1000 }
    );
  });
});
