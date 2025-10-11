import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManualDecisionForm } from '../ManualDecisionForm';
import { useManualDecision } from '@/hooks/api/useHistory';
import { useProfile } from '@/hooks/useProfile';

// Mock dependencies
jest.mock('@/hooks/api/useHistory');
jest.mock('@/hooks/useProfile');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseManualDecision = useManualDecision as jest.MockedFunction<
  typeof useManualDecision
>;
const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;

describe('ManualDecisionForm', () => {
  let queryClient: QueryClient;
  const mockOnSuccess = jest.fn();
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseProfile.mockReturnValue({
      profile: {
        _id: 'user1',
        clerkId: 'clerk123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      uploadPicture: jest.fn(),
      removePicture: jest.fn(),
      isUpdating: false,
      isUploading: false,
      isRemoving: false,
    } as any);

    mockUseManualDecision.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ManualDecisionForm onSuccess={mockOnSuccess} />
      </QueryClientProvider>
    );
  };

  it('should render the form with initial personal type', () => {
    renderComponent();

    expect(screen.getByText('Decision Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Personal')).toBeChecked();
    expect(screen.getByLabelText('Group')).not.toBeChecked();
  });

  it('should switch to group type when selected', () => {
    renderComponent();

    const groupRadio = screen.getByLabelText('Group');
    fireEvent.click(groupRadio);

    expect(groupRadio).toBeChecked();
    expect(screen.getByLabelText('Personal')).not.toBeChecked();
  });

  it('should display group selection dropdown when group type is selected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [] }),
    });

    renderComponent();

    const groupRadio = screen.getByLabelText('Group');
    fireEvent.click(groupRadio);

    await waitFor(() => {
      // Check that group select dropdown is rendered
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(1); // Should have Group and Restaurant selects
      // Check for the "Select a group" option
      expect(screen.getByText('Select a group')).toBeInTheDocument();
    });
  });

  it('should disable restaurant selection when group type is selected but no group chosen', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [] }),
    });

    renderComponent();

    const groupRadio = screen.getByLabelText('Group');
    fireEvent.click(groupRadio);

    await waitFor(() => {
      const restaurantSelect = screen
        .getAllByRole('combobox')
        .find((el) => el.closest('div')?.textContent?.includes('Restaurant'));
      expect(restaurantSelect).toBeDisabled();
    });
  });

  it('should validate form before submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [] }),
    });

    renderComponent();

    // Initially, submit button should be disabled
    const submitButton = screen.getByRole('button', { name: /add decision/i });
    expect(submitButton).toBeDisabled();

    // Add visit date only - should still be disabled (needs restaurant)
    const dateInput = screen.getByLabelText(/visit date/i);
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

    // Submit button should still be disabled because no restaurant is selected
    expect(submitButton).toBeDisabled();
  });

  it('should require group selection for group type decisions', async () => {
    const mockGroups = [
      {
        _id: 'group1',
        name: 'My Group',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collections: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: mockGroups }),
      });

    renderComponent();

    // Switch to group type
    const groupRadio = screen.getByLabelText('Group');
    fireEvent.click(groupRadio);

    // Wait for groups to load
    await waitFor(() => {
      const groupSelect = screen
        .getAllByRole('combobox')
        .find((el) => el.closest('div')?.textContent?.includes('Group'));
      expect(groupSelect).toBeInTheDocument();
    });

    // Restaurant selection should be disabled until a group is selected
    const restaurantSelect = screen
      .getAllByRole('combobox')
      .find((el) => el.closest('div')?.textContent?.includes('Restaurant'));
    expect(restaurantSelect).toBeDisabled();
  });

  it('should allow entering notes in the form', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [] }),
    });

    renderComponent();

    // Add notes
    const notesInput = screen.getByPlaceholderText(
      /add any notes about this visit/i
    );
    fireEvent.change(notesInput, { target: { value: 'Great food!' } });

    expect(notesInput).toHaveValue('Great food!');
  });

  it('should disable submit button when form is invalid', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [] }),
    });

    renderComponent();

    await waitFor(() => {
      const submitButton = screen.getByRole('button', {
        name: /add decision/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  it('should reset restaurant selection when switching types', async () => {
    const mockCollections = [
      {
        _id: 'collection1',
        name: 'My Favorites',
        type: 'personal',
        ownerId: 'clerk123',
        restaurantIds: ['restaurant1'],
      },
    ];

    const mockRestaurants = [
      {
        _id: 'restaurant1',
        name: 'Test Restaurant',
        address: '123 Main St',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collections: mockCollections }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ restaurants: mockRestaurants }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collections: mockCollections }),
      });

    renderComponent();

    // Wait for restaurants to load
    await waitFor(() => {
      const restaurantSelect = screen
        .getAllByRole('combobox')
        .find((el) => el.closest('div')?.textContent?.includes('Restaurant'));
      expect(restaurantSelect).not.toBeDisabled();
    });

    // Select restaurant
    const restaurantSelect = screen
      .getAllByRole('combobox')
      .find((el) => el.closest('div')?.textContent?.includes('Restaurant'));
    fireEvent.change(restaurantSelect!, { target: { value: 'restaurant1' } });

    // Switch to group type
    const groupRadio = screen.getByLabelText('Group');
    fireEvent.click(groupRadio);

    // Restaurant selection should be reset
    await waitFor(() => {
      const restaurantSelectAfter = screen
        .getAllByRole('combobox')
        .find((el) => el.closest('div')?.textContent?.includes('Restaurant'));
      expect(restaurantSelectAfter).toHaveValue('');
    });
  });

  it('should show loading state while pending', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [] }),
    });

    mockUseManualDecision.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any);

    renderComponent();

    const submitButton = screen.getByRole('button', { name: /adding/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Adding...');
  });
});
