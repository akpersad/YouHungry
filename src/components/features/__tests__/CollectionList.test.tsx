import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionList } from '../CollectionList';

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

const mockCollections = [
  {
    _id: { toString: () => 'collection-1' },
    name: 'Favorite Pizza Places',
    description: 'My go-to pizza spots',
    type: 'personal' as const,
    ownerId: { toString: () => 'test-user-id' },
    restaurantIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: { toString: () => 'collection-2' },
    name: 'Coffee Shops',
    description: 'Best coffee in town',
    type: 'personal' as const,
    ownerId: { toString: () => 'test-user-id' },
    restaurantIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('CollectionList', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, collections: [] }),
    });

    render(<CollectionList />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no collections exist', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, collections: [] }),
    });

    render(<CollectionList />);

    await waitFor(() => {
      expect(
        screen.getByText("You don't have any collections yet.")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Create Your First Collection')
    ).toBeInTheDocument();
  });

  it('renders collections when they exist', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, collections: mockCollections }),
    });

    render(<CollectionList />);

    await waitFor(() => {
      expect(screen.getByText('Favorite Pizza Places')).toBeInTheDocument();
    });

    expect(screen.getByText('Coffee Shops')).toBeInTheDocument();
    expect(screen.getByText('My go-to pizza spots')).toBeInTheDocument();
    expect(screen.getByText('Best coffee in town')).toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, collections: [] }),
    });

    render(<CollectionList />);

    await waitFor(() => {
      expect(
        screen.getByText('Create Your First Collection')
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Your First Collection'));

    await waitFor(() => {
      expect(screen.getByText('Create New Collection')).toBeInTheDocument();
    });
  });

  it('handles delete collection', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ success: true, collections: mockCollections }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<CollectionList />);

    await waitFor(() => {
      expect(screen.getByText('Favorite Pizza Places')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this collection? This action cannot be undone.'
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/collections/collection-1', {
        method: 'DELETE',
      });
    });
  });

  it('handles fetch error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<CollectionList />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch collections')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
