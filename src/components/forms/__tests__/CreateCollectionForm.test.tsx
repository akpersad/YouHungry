import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCollectionForm } from '../CreateCollectionForm';
import { useUser } from '@clerk/nextjs';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('CreateCollectionForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockUseUser.mockReturnValue({
      user: { id: 'user123' },
      isLoaded: true,
      isSignedIn: true,
    } as ReturnType<typeof useUser>);

    mockFetch.mockClear();
    mockOnSuccess.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders form fields correctly', () => {
    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
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
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
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
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      collection: { id: 'collection123', name: 'Test Collection' },
    };

    mockFetch.mockResolvedValueOnce({
      json: async () => mockResponse,
    } as Response);

    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
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
      expect(mockFetch).toHaveBeenCalledWith('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Collection',
          description: 'Test description',
          type: 'personal',
          ownerId: 'user123',
        }),
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.collection);
  });

  it('handles API errors', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: false,
      error: 'Collection name already exists',
    };

    mockFetch.mockResolvedValueOnce({
      json: async () => mockResponse,
    } as Response);

    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
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
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      collection: { id: 'collection123', name: 'Test Collection' },
    };

    // Make fetch take some time
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                json: async () => mockResponse,
              } as Response),
            100
          )
        )
    );

    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = screen.getByLabelText('Collection Name');
    const submitButton = screen.getByRole('button', {
      name: 'Create Collection',
    });

    await user.type(nameInput, 'Test Collection');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.collection);
    });
  });
});
