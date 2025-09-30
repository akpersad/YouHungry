import { render, screen, fireEvent } from '@testing-library/react';
import { CollectionList } from '../CollectionList';
import { TestQueryProvider } from '@/test-utils/testQueryClient';

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

    // Setup default mocks for TanStack Query hooks
    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseDeleteCollection.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockUseCreateCollection.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('renders loading state initially', () => {
    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

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
    });

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
    });

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
    });

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
    });

    mockUseDeleteCollection.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(
      <TestQueryProvider>
        <CollectionList />
      </TestQueryProvider>
    );

    expect(screen.getByText('Favorite Pizza Places')).toBeInTheDocument();

    const deleteButtons = screen
      .getAllByRole('button')
      .filter(
        (button) => button.textContent === '' && button.querySelector('svg')
      );

    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this collection? This action cannot be undone.'
    );

    expect(mockMutateAsync).toHaveBeenCalledWith('collection-1');
  });

  it('handles fetch error', () => {
    const mockRefetch = jest.fn();

    mockUseCollections.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

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
