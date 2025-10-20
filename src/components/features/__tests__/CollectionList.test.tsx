import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionList } from '../CollectionList';
import { TestQueryProvider } from '@/test-utils/testQueryClient';
import { ObjectId } from 'mongodb';

// Mock the useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
    },
  }),
}));

// Mock Next.js router
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

// Mock fetch
global.fetch = jest.fn();

// Mock TanStack Query hooks
jest.mock('@/hooks/api', () => ({
  useCollections: jest.fn(),
  useDeleteCollection: jest.fn(),
  useCreateCollection: jest.fn(),
}));

import {
  useCollections,
  useDeleteCollection,
  useCreateCollection,
} from '@/hooks/api';

const mockUseCollections = useCollections as jest.MockedFunction<
  typeof useCollections
>;
const mockUseDeleteCollection = useDeleteCollection as jest.MockedFunction<
  typeof useDeleteCollection
>;
const mockUseCreateCollection = useCreateCollection as jest.MockedFunction<
  typeof useCreateCollection
>;

const mockCollections = [
  {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    name: 'Favorite Pizza Places',
    description: 'My go-to pizza spots',
    type: 'personal' as const,
    ownerId: new ObjectId('507f1f77bcf86cd799439010'),
    restaurantIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId('507f1f77bcf86cd799439012'),
    name: 'Coffee Shops',
    description: 'Best coffee in town',
    type: 'personal' as const,
    ownerId: new ObjectId('507f1f77bcf86cd799439010'),
    restaurantIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('CollectionList', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();

    // Setup default mocks for TanStack Query hooks
    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseDeleteCollection.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);

    mockUseCreateCollection.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);
  });

  it('renders loading state initially', () => {
    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(
      <TestQueryProvider>
        <CollectionList />
      </TestQueryProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no collections exist', () => {
    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(
      <TestQueryProvider>
        <CollectionList />
      </TestQueryProvider>
    );

    expect(
      screen.getByText("You don't have any collections yet.")
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create Your First Collection')
    ).toBeInTheDocument();
  });

  it('renders collections when they exist', () => {
    mockUseCollections.mockReturnValue({
      data: mockCollections,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(
      <TestQueryProvider>
        <CollectionList />
      </TestQueryProvider>
    );

    expect(screen.getByText('Favorite Pizza Places')).toBeInTheDocument();
    expect(screen.getByText('Coffee Shops')).toBeInTheDocument();
    expect(screen.getByText('My go-to pizza spots')).toBeInTheDocument();
    expect(screen.getByText('Best coffee in town')).toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', () => {
    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(
      <TestQueryProvider>
        <CollectionList />
      </TestQueryProvider>
    );

    expect(
      screen.getByText('Create Your First Collection')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Create Your First Collection'));

    expect(screen.getByText('Create New Collection')).toBeInTheDocument();
  });

  it('handles delete collection', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);

    mockUseCollections.mockReturnValue({
      data: mockCollections,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseDeleteCollection.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    render(
      <TestQueryProvider>
        <CollectionList />
      </TestQueryProvider>
    );

    expect(screen.getByText('Favorite Pizza Places')).toBeInTheDocument();

    // Find and click the menu button (three dots icon) for the first collection
    const menuButtons = screen.getAllByRole('button', {
      name: 'Collection actions',
    });
    fireEvent.click(menuButtons[0]);

    // Wait for dropdown menu and click "Delete Collection"
    await waitFor(() => {
      expect(screen.getByText('Delete Collection')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete Collection');
    fireEvent.click(deleteButton);

    // Wait for the confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Collection?')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Are you sure you want to delete this collection? This action cannot be undone.'
        )
      ).toBeInTheDocument();
    });

    // Click the confirm delete button in the modal
    const confirmButton = screen.getByRole('button', {
      name: /delete collection/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  it('handles fetch error', () => {
    const mockRefetch = jest.fn();

    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as any);

    render(
      <TestQueryProvider>
        <CollectionList />
      </TestQueryProvider>
    );

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
