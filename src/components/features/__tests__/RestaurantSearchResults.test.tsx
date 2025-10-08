import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantSearchResults } from '../RestaurantSearchResults';
import { Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';

const mockRestaurants: Restaurant[] = [
  {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    name: 'Test Restaurant 1',
    address: '123 Test Street, Test City, TC 12345',
    coordinates: { lat: 40.7128, lng: -74.006 },
    cuisine: 'Italian',
    rating: 4.5,
    priceRange: '$$',
    timeToPickUp: 25,
    photos: ['https://example.com/photo1.jpg'],
    phoneNumber: '+1-555-0123',
    website: 'https://testrestaurant1.com',
    hours: {
      Monday: '9:00 AM – 10:00 PM',
    },
    cachedAt: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-01'),
  },
  {
    _id: new ObjectId('507f1f77bcf86cd799439012'),
    googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY5',
    name: 'Test Restaurant 2',
    address: '456 Test Avenue, Test City, TC 12345',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    cuisine: 'Chinese',
    rating: 4.2,
    priceRange: '$',
    timeToPickUp: 15,
    photos: ['https://example.com/photo2.jpg'],
    phoneNumber: '+1-555-0124',
    website: 'https://testrestaurant2.com',
    hours: {
      Tuesday: '10:00 AM – 9:00 PM',
    },
    cachedAt: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-01'),
  },
];

describe('RestaurantSearchResults', () => {
  const mockOnAddToCollection = jest.fn();
  const mockOnViewDetails = jest.fn();
  const mockOnLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(
      <RestaurantSearchResults
        restaurants={[]}
        isLoading={true}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(
      screen.getByText('Searching for restaurants...')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Searching for restaurants...')
    ).toBeInTheDocument();
  });

  it('renders empty state when no restaurants found', () => {
    render(
      <RestaurantSearchResults
        restaurants={[]}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        searchQuery="pizza"
      />
    );

    expect(screen.getByText('No restaurants found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No restaurants found for "pizza". Try a different search term.'
      )
    ).toBeInTheDocument();
  });

  it('renders empty state without search query', () => {
    render(
      <RestaurantSearchResults
        restaurants={[]}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('No restaurants found')).toBeInTheDocument();
    expect(
      screen.getByText('Try searching for restaurants in your area.')
    ).toBeInTheDocument();
  });

  it('renders restaurants correctly', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        searchQuery="test"
      />
    );

    expect(screen.getByText('Results for "test"')).toBeInTheDocument();
    expect(screen.getByText('2 restaurants found')).toBeInTheDocument();
    expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
    expect(screen.getByText('Test Restaurant 2')).toBeInTheDocument();
  });

  it('renders restaurants without search query', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Restaurants')).toBeInTheDocument();
    expect(screen.getByText('2 restaurants found')).toBeInTheDocument();
  });

  it('calls onAddToCollection when Add to Collection is clicked', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    const addButtons = screen.getAllByText('Add to Collection');
    fireEvent.click(addButtons[0]);

    expect(mockOnAddToCollection).toHaveBeenCalledWith(mockRestaurants[0]);
  });

  it('calls onViewDetails when View Details is clicked', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockRestaurants[0]);
  });

  it('renders Load More button when hasMore is true', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        onLoadMore={mockOnLoadMore}
        hasMore={true}
      />
    );

    const loadMoreButton = screen.getByText('Load More Restaurants');
    expect(loadMoreButton).toBeInTheDocument();
  });

  it('calls onLoadMore when Load More button is clicked', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        onLoadMore={mockOnLoadMore}
        hasMore={true}
      />
    );

    const loadMoreButton = screen.getByText('Load More Restaurants');
    fireEvent.click(loadMoreButton);

    expect(mockOnLoadMore).toHaveBeenCalled();
  });

  it('shows loading state when loading', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={true}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        onLoadMore={mockOnLoadMore}
        hasMore={true}
      />
    );

    expect(
      screen.getByText('Searching for restaurants...')
    ).toBeInTheDocument();
  });

  it('does not render Load More button when hasMore is false', () => {
    render(
      <RestaurantSearchResults
        restaurants={mockRestaurants}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
      />
    );

    expect(screen.queryByText('Load More Restaurants')).not.toBeInTheDocument();
  });

  it('handles singular restaurant count correctly', () => {
    const singleRestaurant = [mockRestaurants[0]];

    render(
      <RestaurantSearchResults
        restaurants={singleRestaurant}
        isLoading={false}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('1 restaurant found')).toBeInTheDocument();
  });
});
