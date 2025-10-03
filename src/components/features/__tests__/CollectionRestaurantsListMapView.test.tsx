import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionRestaurantsList } from '../CollectionRestaurantsList';
import { Collection, Restaurant } from '@/types/database';

// Mock the MapView component
jest.mock('../MapView', () => ({
  MapView: ({
    restaurants,
    onRestaurantSelect,
    onRestaurantDetails,
    selectedRestaurant,
  }: {
    restaurants: Restaurant[];
    onRestaurantSelect?: (restaurant: Restaurant) => void;
    onRestaurantDetails?: (restaurant: Restaurant) => void;
    selectedRestaurant?: Restaurant | null;
  }) => (
    <div data-testid="map-view">
      <div>Map View with {restaurants.length} restaurants</div>
      {selectedRestaurant && (
        <div data-testid="selected-restaurant">
          Selected: {selectedRestaurant.name}
        </div>
      )}
      <button
        onClick={() => onRestaurantSelect?.(restaurants[0])}
        data-testid="select-restaurant-button"
      >
        Select First Restaurant
      </button>
      <button
        onClick={() => onRestaurantDetails?.(restaurants[0])}
        data-testid="view-details-button"
      >
        View Details
      </button>
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockCollection: Collection = {
  _id: 'collection-1',
  name: 'Test Collection',
  description: 'Test Description',
  userId: 'user-1',
  isGroup: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRestaurants: Restaurant[] = [
  {
    _id: '1',
    name: 'Test Restaurant 1',
    address: '123 Test St, Test City, TC 12345',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    rating: 4.5,
    priceLevel: 2,
    photos: [{ url: 'https://example.com/photo1.jpg' }],
    cuisine: 'Test Cuisine',
    googlePlaceId: 'test-place-1',
    cachedAt: new Date(),
    lastUpdated: new Date(),
  },
  {
    _id: '2',
    name: 'Test Restaurant 2',
    address: '456 Test Ave, Test City, TC 12345',
    coordinates: { lat: 37.7849, lng: -122.4294 },
    rating: 4.2,
    priceLevel: 3,
    photos: [{ url: 'https://example.com/photo2.jpg' }],
    cuisine: 'Test Cuisine 2',
    googlePlaceId: 'test-place-2',
    cachedAt: new Date(),
    lastUpdated: new Date(),
  },
];

describe('CollectionRestaurantsList Map View', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ restaurants: mockRestaurants }),
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders map view when view type is map', async () => {
    // Mock localStorage to return 'map' as saved view type
    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(<CollectionRestaurantsList collection={mockCollection} />);

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    expect(screen.getByText('Map View with 2 restaurants')).toBeInTheDocument();
  });

  it('switches to map view when map toggle is clicked', async () => {
    render(<CollectionRestaurantsList collection={mockCollection} />);

    // Wait for restaurants to load
    await waitFor(() => {
      expect(
        screen.getByText('Restaurants in Test Collection')
      ).toBeInTheDocument();
    });

    // Find and click the map view toggle button
    const mapToggleButton = screen.getByLabelText('Switch to map view');
    fireEvent.click(mapToggleButton);

    // Should show map view
    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    // Should save view type to localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'collection-view-type',
      'map'
    );
  });

  it('handles restaurant selection in map view', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(<CollectionRestaurantsList collection={mockCollection} />);

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    // Click select restaurant button
    const selectButton = screen.getByTestId('select-restaurant-button');
    fireEvent.click(selectButton);

    // Should show selected restaurant info
    await waitFor(() => {
      expect(screen.getByTestId('selected-restaurant')).toBeInTheDocument();
      expect(
        screen.getByText('Selected: Test Restaurant 1')
      ).toBeInTheDocument();
    });

    // Should show selected restaurant details panel
    expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
    expect(
      screen.getByText('123 Test St, Test City, TC 12345')
    ).toBeInTheDocument();
  });

  it('handles restaurant details request in map view', async () => {
    const onViewDetails = jest.fn();
    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(
      <CollectionRestaurantsList
        collection={mockCollection}
        onViewDetails={onViewDetails}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    // Click view details button
    const detailsButton = screen.getByTestId('view-details-button');
    fireEvent.click(detailsButton);

    // Should call onViewDetails
    expect(onViewDetails).toHaveBeenCalledWith(mockRestaurants[0]);
  });

  it('clears selected restaurant when clear button is clicked', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(<CollectionRestaurantsList collection={mockCollection} />);

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    // Select a restaurant first
    const selectButton = screen.getByTestId('select-restaurant-button');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    // Selected restaurant should be cleared
    expect(
      screen.queryByText('Selected: Test Restaurant 1')
    ).not.toBeInTheDocument();
  });

  it('persists view type selection across renders', async () => {
    // First render with map view
    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    const { rerender } = render(
      <CollectionRestaurantsList collection={mockCollection} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    // Rerender with different collection
    const newCollection = {
      ...mockCollection,
      _id: 'collection-2',
      name: 'New Collection',
    };
    rerender(<CollectionRestaurantsList collection={newCollection} />);

    // Should still show map view
    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });
  });

  it('shows restaurant count in map view', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(<CollectionRestaurantsList collection={mockCollection} />);

    await waitFor(() => {
      expect(screen.getByText('2 restaurants')).toBeInTheDocument();
    });
  });

  it('handles empty restaurants array in map view', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ restaurants: [] }),
    });

    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(<CollectionRestaurantsList collection={mockCollection} />);

    await waitFor(() => {
      expect(
        screen.getByText('No restaurants in this collection yet.')
      ).toBeInTheDocument();
    });
  });

  it('handles API error in map view', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });

    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(<CollectionRestaurantsList collection={mockCollection} />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('switches between all view types correctly', async () => {
    render(<CollectionRestaurantsList collection={mockCollection} />);

    await waitFor(() => {
      expect(
        screen.getByText('Restaurants in Test Collection')
      ).toBeInTheDocument();
    });

    // Test list view
    const listToggle = screen.getByLabelText('Switch to list view');
    fireEvent.click(listToggle);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'collection-view-type',
      'list'
    );

    // Test grid view
    const gridToggle = screen.getByLabelText('Switch to grid view');
    fireEvent.click(gridToggle);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'collection-view-type',
      'grid'
    );

    // Test map view
    const mapToggle = screen.getByLabelText('Switch to map view');
    fireEvent.click(mapToggle);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'collection-view-type',
      'map'
    );
  });

  it('shows proper loading state for map view', async () => {
    // Mock slow API response
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ restaurants: mockRestaurants }),
              }),
            100
          )
        )
    );

    (window.localStorage.getItem as jest.Mock).mockReturnValue('map');

    render(<CollectionRestaurantsList collection={mockCollection} />);

    // Should show loading state
    expect(screen.getAllByTestId('animate-pulse')).toHaveLength(3);

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.getByTestId('map-view')).toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });
});
