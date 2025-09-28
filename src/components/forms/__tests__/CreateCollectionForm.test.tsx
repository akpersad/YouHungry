import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCollectionForm } from '../CreateCollectionForm';
import { useUser } from '@clerk/nextjs';
import { TestQueryProvider } from '@/test-utils/testQueryClient';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock TanStack Query hooks
jest.mock('@/hooks/api', () => ({
  useCreateCollection: jest.fn(),
}));

import { useCreateCollection } from '@/hooks/api';

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseCreateCollection = useCreateCollection as jest.MockedFunction<
  typeof useCreateCollection
>;

describe('CreateCollectionForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockUseUser.mockReturnValue({
      user: { id: 'user123' },
      isLoaded: true,
      isSignedIn: true,
    } as ReturnType<typeof useUser>);

    // Setup default mock for TanStack Query hook
    mockUseCreateCollection.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: null,
    });

    mockOnSuccess.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders form fields correctly', () => {
    render(
      <TestQueryProvider>
        <CreateCollectionForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </TestQueryProvider>
    );

    expect(screen.getByLabelText('Collection Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Collection' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <TestQueryProvider>
        <CreateCollectionForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </TestQueryProvider>
    );

    const form = document.querySelector('form');

    // Try to submit with empty form
    fireEvent.submit(form!);

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.getByText('Collection name is required')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockCollection = { id: 'collection123', name: 'Test Collection' };
    const mockMutateAsync = jest.fn().mockResolvedValue(mockCollection);

    mockUseCreateCollection.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    render(
      <TestQueryProvider>
        <CreateCollectionForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </TestQueryProvider>
    );

    const nameInput = screen.getByLabelText('Collection Name');
    const descriptionInput = screen.getByLabelText('Description (Optional)');
    const submitButton = screen.getByRole('button', {
      name: 'Create Collection',
    });

    // Fill in the form fields
    await user.type(nameInput, 'Test Collection');
    await user.type(descriptionInput, 'Test description');

    // Button should be enabled now
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'Test Collection',
        description: 'Test description',
        userId: 'user123',
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockCollection);
  });

  it('handles API errors', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Collection name already exists');

    mockUseCreateCollection.mockReturnValue({
      mutateAsync: jest.fn().mockRejectedValue(mockError),
      isPending: false,
      error: mockError,
    });

    render(
      <TestQueryProvider>
        <CreateCollectionForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </TestQueryProvider>
    );

    const nameInput = screen.getByLabelText('Collection Name');
    const submitButton = screen.getByRole('button', {
      name: 'Create Collection',
    });

    await user.type(nameInput, 'Test Collection');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Collection name already exists')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <TestQueryProvider>
        <CreateCollectionForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </TestQueryProvider>
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockCollection = { id: 'collection123', name: 'Test Collection' };

    mockUseCreateCollection.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(mockCollection),
      isPending: true,
      error: null,
    });

    render(
      <TestQueryProvider>
        <CreateCollectionForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </TestQueryProvider>
    );

    const nameInput = screen.getByLabelText('Collection Name');

    await user.type(nameInput, 'Test Collection');

    // Should show loading state immediately due to isPending: true
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });
});
