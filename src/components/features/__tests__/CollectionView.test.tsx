import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionView } from '../CollectionView';
import { Collection, Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock the UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    size,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
    size?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/Card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
}));

jest.mock('@/components/ui/Modal', () => ({
  Modal: ({
    children,
    isOpen,
    onClose,
    title,
    size,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: string;
  }) =>
    isOpen ? (
      <div data-testid="modal" data-size={size}>
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

jest.mock('../RestaurantSearchPage', () => ({
  RestaurantSearchPage: ({
    onAddToCollection,
    collections,
  }: {
    onAddToCollection: () => void;
    collections: Collection[];
  }) => (
    <div data-testid="restaurant-search-page">
      <button onClick={onAddToCollection}>Add Restaurant</button>
      <div>Collections: {collections.length}</div>
    </div>
  ),
}));

jest.mock('../CollectionRestaurantsList', () => ({
  CollectionRestaurantsList: ({
    collection,
    onViewDetails,
    onManageRestaurant,
  }: {
    collection: Collection;
    onViewDetails?: (restaurant: Restaurant) => void;
    onManageRestaurant?: (restaurant: Restaurant) => void;
  }) => (
    <div data-testid="collection-restaurants-list">
      <div>Collection: {collection.name}</div>
      <button
        onClick={() => onViewDetails?.(mockRestaurant)}
        data-testid="view-restaurant"
      >
        View Restaurant
      </button>
      <button
        onClick={() => onManageRestaurant?.(mockRestaurant)}
        data-testid="manage-restaurant"
      >
        Manage Restaurant
      </button>
    </div>
  ),
}));

jest.mock('../RestaurantManagementModal', () => ({
  RestaurantManagementModal: ({
    restaurant,
    onClose,
  }: {
    restaurant: Restaurant | null;
    onClose: () => void;
  }) =>
    restaurant ? (
      <div data-testid="restaurant-management-modal">
        <div>Managing: {restaurant.name}</div>
        <button onClick={onClose}>Close Management</button>
      </div>
    ) : null,
}));

jest.mock('../RestaurantDetailsView', () => ({
  RestaurantDetailsView: ({
    restaurant,
    onManage,
  }: {
    restaurant: Restaurant;
    onManage: () => void;
  }) => (
    <div data-testid="restaurant-details-view">
      <div>Details for: {restaurant.name}</div>
      <button onClick={onManage} data-testid="manage-from-details">
        Manage
      </button>
    </div>
  ),
}));

const mockCollection: Collection = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  name: 'My Test Collection',
  description: 'A test collection',
  type: 'personal',
  ownerId: new ObjectId('507f1f77bcf86cd799439012'),
  restaurantIds: [
    new ObjectId('507f1f77bcf86cd799439013'),
    new ObjectId('507f1f77bcf86cd799439014'),
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockRestaurant: Restaurant = {
  _id: new ObjectId('507f1f77bcf86cd799439013'),
  googlePlaceId: 'place-123',
  name: 'Test Restaurant',
  address: '123 Test St',
  coordinates: { lat: 40.7128, lng: -74.006 },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$',
  timeToPickUp: 15,
  photos: ['https://example.com/photo.jpg'],
  phoneNumber: '+1234567890',
  website: 'https://testrestaurant.com',
  hours: {
    Monday: '9:00 AM - 10:00 PM',
    Tuesday: '9:00 AM - 10:00 PM',
  },
  cachedAt: new Date(),
  lastUpdated: new Date(),
};

const mockRestaurants: Restaurant[] = [
  {
    ...mockRestaurant,
    name: 'Test Restaurant 1',
  },
  {
    ...mockRestaurant,
    _id: new ObjectId('507f1f77bcf86cd799439014'),
    name: 'Test Restaurant 2',
  },
];

describe('CollectionView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    expect(
      screen.getByRole('status', { name: 'Loading collection' })
    ).toBeInTheDocument();
  });

  it('renders collection successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: mockCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    expect(screen.getByText('A test collection')).toBeInTheDocument();
    expect(screen.getByText('2 restaurants')).toBeInTheDocument();
    expect(screen.getByText('Created 12/31/2023')).toBeInTheDocument();
  });

  it('displays error message when fetch fails', async () => {
    const errorMessage = 'Failed to fetch collection';
    (fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('displays error message when API returns error', async () => {
    const errorMessage = 'Collection not found';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: errorMessage,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows collection not found when collection is null', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: null,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('Collection not found')).toBeInTheDocument();
    });
  });

  it('opens add restaurant modal when add restaurant button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: mockCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Restaurant');
    fireEvent.click(addButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(
      screen.getByText('Add Restaurant to Collection')
    ).toBeInTheDocument();
    expect(screen.getByTestId('restaurant-search-page')).toBeInTheDocument();
  });

  it('shows decide for me button when collection has restaurants', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: mockCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    expect(screen.getByText('Decide for Me')).toBeInTheDocument();
  });

  it('does not show decide for me button when collection has no restaurants', async () => {
    const emptyCollection = { ...mockCollection, restaurantIds: [] };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: emptyCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    expect(screen.queryByText('Decide for Me')).not.toBeInTheDocument();
  });

  it('handles random decision when decide for me is clicked', async () => {
    // Mock successful API responses
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          collection: mockCollection,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            restaurantId: mockCollection.restaurantIds[0],
            reasoning: 'Selected using weighted random algorithm',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          restaurant: mockRestaurants[0],
        }),
      });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    const decideButton = screen.getByText('Decide for Me');
    fireEvent.click(decideButton);

    // Wait for the decision result modal to appear
    await waitFor(() => {
      expect(screen.getByText('Decision Made!')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
  });

  it('shows error when decide for me is clicked on empty collection', async () => {
    const emptyCollection = { ...mockCollection, restaurantIds: [] };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: emptyCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    // The decide button should not be visible for empty collections
    expect(screen.queryByText('Decide for Me')).not.toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: mockCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('handles view restaurant details', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: mockCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    const viewButton = screen.getByTestId('view-restaurant');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });
  });

  it('handles manage restaurant', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        collection: mockCollection,
      }),
    });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    const manageButton = screen.getByTestId('manage-restaurant');
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Manage Test Restaurant')).toBeInTheDocument();
    });
  });

  it('handles restaurant added callback', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          collection: mockCollection,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          collection: {
            ...mockCollection,
            restaurantIds: [...mockCollection.restaurantIds, new ObjectId()],
          },
        }),
      });

    render(<CollectionView collectionId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('My Test Collection')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Restaurant');
    fireEvent.click(addButton);

    const addRestaurantButton = screen.getAllByText('Add Restaurant')[1];
    fireEvent.click(addRestaurantButton);

    // The modal should close and collection should refresh
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });
});
