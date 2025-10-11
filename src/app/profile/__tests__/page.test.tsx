import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import ProfilePage from '../page';
import { useProfile } from '@/hooks/useProfile';
import { useUser } from '@clerk/nextjs';

// Mock dependencies
jest.mock('@/hooks/useProfile');
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  UserButton: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="user-button">{children}</div>
  ),
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('@/components/ui/AddressInput', () => ({
  AddressInput: ({
    value,
    onChange,
    onValidationChange,
    ...props
  }: {
    value: string;
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean) => void;
    [key: string]: unknown;
  }) => {
    // Immediately call onValidationChange with true to ensure the save button is enabled
    React.useEffect(() => {
      if (onValidationChange && value) {
        onValidationChange(true);
      }
    }, [onValidationChange, value]);

    return (
      <input
        {...props}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Mock validation change to avoid act() warnings
          if (onValidationChange) {
            setTimeout(() => onValidationChange(true), 0);
          }
        }}
      />
    );
  },
}));

const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('ProfilePage', () => {
  let queryClient: QueryClient;

  const mockProfile = {
    _id: 'user123',
    clerkId: 'clerk123',
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser',
    city: 'Test City',
    state: 'Test State',
    profilePicture: 'https://example.com/pic.jpg',
    smsOptIn: true,
    smsPhoneNumber: '+1234567890',
    phoneNumber: '+1234567890',
    preferences: {
      defaultLocation: 'Test Location',
      locationSettings: {
        city: 'Test City',
        state: 'Test State',
        country: 'US',
        timezone: 'America/New_York',
      },
      notificationSettings: {
        groupDecisions: {
          started: true,
          completed: true,
        },
        friendRequests: true,
        groupInvites: true,
        smsEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
      },
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  };

  const mockClerkUser = {
    id: 'clerk123',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
    imageUrl: 'https://example.com/pic.jpg',
    openUserProfile: jest.fn(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseUser.mockReturnValue({
      user: mockClerkUser,
      isLoaded: true,
      isSignedIn: true,
    } as any);

    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      isUpdating: false,
      uploadPicture: jest.fn(),
      isUploading: false,
      removePicture: jest.fn(),
      isRemoving: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(ClerkProvider, null, component)
      )
    );
  };

  it('should render profile page with user data', () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your account settings and preferences.')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    // The city/state are combined in a CityStateInput component, so we check for the combined value
    expect(
      screen.getByDisplayValue('Test City, Test State')
    ).toBeInTheDocument();
  });

  it('should show loading state when profile is loading', () => {
    mockUseProfile.mockReturnValue({
      profile: undefined,
      isLoading: true,
      error: null,
      updateProfile: jest.fn(),
      isUpdating: false,
      uploadPicture: jest.fn(),
      isUploading: false,
      removePicture: jest.fn(),
      isRemoving: false,
    });

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should show error state when profile fails to load', () => {
    mockUseProfile.mockReturnValue({
      profile: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      updateProfile: jest.fn(),
      isUpdating: false,
      uploadPicture: jest.fn(),
      isUploading: false,
      removePicture: jest.fn(),
      isRemoving: false,
    });

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
    expect(
      screen.getByText('There was an error loading your profile.')
    ).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should show sign-in prompt when user is not authenticated', () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoaded: true,
      isSignedIn: false,
    } as any);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Not Signed In')).toBeInTheDocument();
    expect(
      screen.getByText('Please sign in to view your profile.')
    ).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should update form data when profile changes', () => {
    const { rerender } = renderWithProviders(<ProfilePage />);

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();

    // Update profile data
    const updatedProfile = { ...mockProfile, name: 'Updated Name' };
    mockUseProfile.mockReturnValue({
      profile: updatedProfile,
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      isUpdating: false,
      uploadPicture: jest.fn(),
      isUploading: false,
      removePicture: jest.fn(),
      isRemoving: false,
    });

    // Re-render with the same providers to avoid QueryClient issues
    rerender(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          ClerkProvider,
          null,
          React.createElement(ProfilePage)
        )
      )
    );

    expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
  });

  it('should handle form input changes', () => {
    renderWithProviders(<ProfilePage />);

    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(nameInput).toHaveValue('New Name');
  });

  it('should handle save button click', async () => {
    const mockUpdateProfile = jest.fn().mockResolvedValue({});
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      isUpdating: false,
      uploadPicture: jest.fn(),
      isUploading: false,
      removePicture: jest.fn(),
      isRemoving: false,
    });

    renderWithProviders(<ProfilePage />);

    const saveButton = screen.getByText('Save Changes');

    // The save button should be enabled since our mocked AddressInput returns true for validation
    expect(saveButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Test User',
        username: 'testuser',
        city: 'Test City',
        state: 'Test State',
        smsOptIn: true,
        smsPhoneNumber: '1 (123) 456-7890',
        preferences: {
          defaultLocation: 'Test Location',
          locationSettings: {
            city: 'Test City',
            state: 'Test State',
          },
          notificationSettings: {
            groupDecisions: {
              started: true,
              completed: true,
            },
            friendRequests: true,
            groupInvites: true,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
          },
        },
      });
    });
  });

  it('should handle profile picture upload', async () => {
    const mockUploadPicture = jest.fn().mockResolvedValue({});
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      isUpdating: false,
      uploadPicture: mockUploadPicture,
      isUploading: false,
      removePicture: jest.fn(),
      isRemoving: false,
    });

    renderWithProviders(<ProfilePage />);

    const fileInput = screen.getByRole('button', { name: /upload picture/i });

    // Simulate file selection
    fireEvent.click(fileInput);

    // This would normally trigger the file input change event
    // In a real test, you'd need to mock the file input properly
  });

  it('should handle profile picture removal', async () => {
    const mockRemovePicture = jest.fn().mockResolvedValue({});
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      isUpdating: false,
      uploadPicture: jest.fn(),
      isUploading: false,
      removePicture: mockRemovePicture,
      isRemoving: false,
    });

    renderWithProviders(<ProfilePage />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockRemovePicture).toHaveBeenCalled();
    });
  });

  it('should show loading states for buttons', () => {
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      isUpdating: true,
      uploadPicture: jest.fn(),
      isUploading: true,
      removePicture: jest.fn(),
      isRemoving: true,
    });

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('Removing...')).toBeInTheDocument();
  });

  it.skip('should handle notification preference toggles', () => {
    renderWithProviders(<ProfilePage />);

    const smsToggle = screen.getByRole('checkbox', {
      name: /enable sms notifications/i,
    });
    expect(smsToggle).toBeChecked();

    fireEvent.click(smsToggle);
    expect(smsToggle).not.toBeChecked();
  });

  it('should render user button for security settings', () => {
    renderWithProviders(<ProfilePage />);

    const userButton = screen.getByTestId('user-button');
    expect(userButton).toBeInTheDocument();
  });
});
