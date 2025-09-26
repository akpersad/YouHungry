import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateCollectionForm } from '../CreateCollectionForm';

// Mock the useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
    },
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockCollection = {
  _id: { toString: () => 'new-collection-id' },
  name: 'Test Collection',
  description: 'Test Description',
  type: 'personal' as const,
  ownerId: { toString: () => 'test-user-id' },
  restaurantIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CreateCollectionForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders form fields correctly', () => {
    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    expect(screen.getByLabelText('Collection Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Collection')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const submitButton = screen.getByText('Create Collection');
    expect(submitButton).toBeDisabled();

    const nameInput = screen.getByLabelText('Collection Name');
    fireEvent.change(nameInput, { target: { value: 'Test Collection' } });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('submits form with valid data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, collection: mockCollection }),
    });

    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = screen.getByLabelText('Collection Name');
    const descriptionInput = screen.getByLabelText('Description (Optional)');
    const submitButton = screen.getByText('Create Collection');

    fireEvent.change(nameInput, { target: { value: 'Test Collection' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test Description' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Collection',
          description: 'Test Description',
          type: 'personal',
          ownerId: 'test-user-id',
        }),
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockCollection);
  });

  it('handles submission error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Collection name already exists',
      }),
    });

    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = screen.getByLabelText('Collection Name');
    const submitButton = screen.getByText('Create Collection');

    fireEvent.change(nameInput, { target: { value: 'Test Collection' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Collection name already exists')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('handles network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = screen.getByLabelText('Collection Name');
    const submitButton = screen.getByText('Create Collection');

    fireEvent.change(nameInput, { target: { value: 'Test Collection' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to create collection')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('trims whitespace from inputs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, collection: mockCollection }),
    });

    render(
      <CreateCollectionForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nameInput = screen.getByLabelText('Collection Name');
    const descriptionInput = screen.getByLabelText('Description (Optional)');
    const submitButton = screen.getByText('Create Collection');

    fireEvent.change(nameInput, { target: { value: '  Test Collection  ' } });
    fireEvent.change(descriptionInput, {
      target: { value: '  Test Description  ' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Collection',
          description: 'Test Description',
          type: 'personal',
          ownerId: 'test-user-id',
        }),
      });
    });
  });
});
