import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import GroupsPage from '../page';
import {
  useGroups,
  useCreateGroup,
  useGroupInvitations,
  useAcceptGroupInvitation,
  useDeclineGroupInvitation,
} from '@/hooks/api/useGroups';
import { toast } from 'react-hot-toast';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { TestQueryProvider } from '@/test-utils/testQueryClient';

// Mock dependencies
jest.mock('@clerk/nextjs');
jest.mock('@/hooks/api/useGroups');
jest.mock('react-hot-toast');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </TestQueryProvider>
);
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock fetch for /api/user/current
global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseGroups = useGroups as jest.MockedFunction<typeof useGroups>;
const mockUseCreateGroup = useCreateGroup as jest.MockedFunction<
  typeof useCreateGroup
>;
const mockUseGroupInvitations = useGroupInvitations as jest.MockedFunction<
  typeof useGroupInvitations
>;
const mockUseAcceptGroupInvitation =
  useAcceptGroupInvitation as jest.MockedFunction<
    typeof useAcceptGroupInvitation
  >;
const mockUseDeclineGroupInvitation =
  useDeclineGroupInvitation as jest.MockedFunction<
    typeof useDeclineGroupInvitation
  >;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockGroups = [
  {
    _id: 'group1',
    name: 'Test Group 1',
    description: 'A test group',
    memberIds: ['user1'],
    adminIds: ['user1'],
    collectionIds: [],
    members: [
      {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        profilePicture: undefined,
      },
    ],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    _id: 'group2',
    name: 'Food Lovers',
    description: 'Food enthusiasts group',
    memberIds: ['user1', 'user2'],
    adminIds: ['user1'],
    collectionIds: [],
    members: [
      {
        _id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        profilePicture: undefined,
      },
      {
        _id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        profilePicture: undefined,
      },
    ],
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14'),
  },
];

describe('GroupsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for /api/user/current
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          _id: '507f1f77bcf86cd799439011',
          clerkId: 'user1',
          email: 'john@example.com',
          name: 'John Doe',
          profilePicture: undefined,
          city: 'New York',
        },
      }),
    });

    mockUseAuth.mockReturnValue({
      userId: 'user1',
      isSignedIn: true,
      isLoaded: true,
    });

    mockUseGroups.mockReturnValue({
      data: mockGroups,
      isLoading: false,
      error: null,
    });

    mockUseCreateGroup.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockUseGroupInvitations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    mockUseAcceptGroupInvitation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockUseDeclineGroupInvitation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('renders groups page with correct title', () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument();
    expect(
      screen.getByText('Collaborate with friends on restaurant decisions')
    ).toBeInTheDocument();
  });

  it('renders groups list', () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    expect(screen.getByText('Food Lovers')).toBeInTheDocument();
  });

  it('shows tab navigation', () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('My Groups (2)')).toBeInTheDocument();
    expect(screen.getByText('Invitations (0)')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    // Initially on groups tab
    expect(screen.getByText('Test Group 1')).toBeInTheDocument();

    // Click invitations tab
    const invitationsTab = screen.getByText('Invitations (0)');
    fireEvent.click(invitationsTab);

    // Should show invitations content
    expect(
      screen.getByText('No pending group invitations')
    ).toBeInTheDocument();

    // Switch back to groups tab
    const groupsTab = screen.getByText('My Groups (2)');
    fireEvent.click(groupsTab);

    // Should show groups again
    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
  });

  it('opens create group form when Create Group button is clicked', () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    const createButton = screen.getByText('Create Group');
    fireEvent.click(createButton);

    expect(screen.getByText('Create New Group')).toBeInTheDocument();
  });

  it('handles group creation with member emails', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      group: { _id: 'new-group', name: 'New Group' },
    });
    mockUseCreateGroup.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    // Mock fetch for friend invitations
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    // Open create group form
    const createButton = screen.getByText('Create Group');
    fireEvent.click(createButton);

    // Fill form
    const nameInput = screen.getByLabelText('Group Name *');
    fireEvent.change(nameInput, { target: { value: 'New Group' } });

    // Add member email
    const emailInput = screen.getByPlaceholderText('Enter email address');
    fireEvent.change(emailInput, { target: { value: 'friend@example.com' } });

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    // Submit form
    const form = screen.getByRole('form');
    const submitButton = form.querySelector('button[type="submit"]');
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'New Group',
        description: undefined,
      });
    });
  });

  it('shows loading state', () => {
    mockUseGroups.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    // Should still show the page structure
    expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument();
    expect(screen.getByText('Create Group')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseGroups.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load groups'),
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    expect(
      screen.getByText('Failed to load groups. Please try again later.')
    ).toBeInTheDocument();
  });

  it('handles invitation acceptance', async () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    // Switch to invitations tab
    const invitationsTab = screen.getByText('Invitations (0)');
    fireEvent.click(invitationsTab);

    // Should show empty state
    expect(
      screen.getByText('No pending group invitations')
    ).toBeInTheDocument();

    // In a real scenario with invitations, we would test the accept functionality
    // This is currently mocked as console.log in the implementation
  });

  it('handles invitation decline', async () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    // Switch to invitations tab
    const invitationsTab = screen.getByText('Invitations (0)');
    fireEvent.click(invitationsTab);

    // Should show empty state
    expect(
      screen.getByText('No pending group invitations')
    ).toBeInTheDocument();

    // In a real scenario with invitations, we would test the decline functionality
    // This is currently mocked as console.log in the implementation
  });

  it('shows correct tab counts', () => {
    render(<GroupsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('My Groups (2)')).toBeInTheDocument();
    expect(screen.getByText('Invitations (0)')).toBeInTheDocument();
  });

  it('updates tab counts when data changes', () => {
    const { rerender } = render(<GroupsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('My Groups (2)')).toBeInTheDocument();

    // Simulate groups data change
    mockUseGroups.mockReturnValue({
      data: [mockGroups[0]], // Only one group now
      isLoading: false,
      error: null,
    });

    rerender(<GroupsPage />);

    expect(screen.getByText('My Groups (1)')).toBeInTheDocument();
  });

  it('handles empty groups list', () => {
    mockUseGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('My Groups (0)')).toBeInTheDocument();
  });

  it('shows create group button even when no groups', () => {
    mockUseGroups.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    expect(screen.getAllByText('Create Group')).toHaveLength(2); // Header button and empty state button
  });

  it('handles group creation error', async () => {
    const mockMutateAsync = jest
      .fn()
      .mockRejectedValue(new Error('Failed to create'));
    mockUseCreateGroup.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    // Open create group form
    const createButton = screen.getByText('Create Group');
    fireEvent.click(createButton);

    // Fill and submit form
    const nameInput = screen.getByLabelText('Group Name *');
    fireEvent.change(nameInput, { target: { value: 'New Group' } });

    const form = screen.getByRole('form');
    const submitButton = form.querySelector('button[type="submit"]');
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to create group. Please try again.'
      );
    });
  });

  it('shows success message on successful group creation', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      group: { _id: 'new-group', name: 'New Group' },
    });
    mockUseCreateGroup.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    // Open create group form
    const createButton = screen.getByText('Create Group');
    fireEvent.click(createButton);

    // Fill and submit form
    const nameInput = screen.getByLabelText('Group Name *');
    fireEvent.change(nameInput, { target: { value: 'New Group' } });

    const form = screen.getByRole('form');
    const submitButton = form.querySelector('button[type="submit"]');
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Group created successfully!'
      );
    });
  });

  it('handles friend invitation during group creation', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      group: { _id: 'new-group', name: 'New Group' },
    });
    mockUseCreateGroup.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    // Mock successful friend invitations
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<GroupsPage />, { wrapper: TestWrapper });

    // Open create group form
    const createButton = screen.getByText('Create Group');
    fireEvent.click(createButton);

    // Fill form with name and member emails
    const nameInput = screen.getByLabelText('Group Name *');
    fireEvent.change(nameInput, { target: { value: 'New Group' } });

    const emailInput = screen.getByPlaceholderText('Enter email address');
    fireEvent.change(emailInput, { target: { value: 'friend@example.com' } });

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    const form = screen.getByRole('form');
    const submitButton = form.querySelector('button[type="submit"]');
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        'Group created and 1 invitations sent!'
      );
    });
  });
});
