import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantCard } from '../RestaurantCard';
import { Restaurant } from '@/types/database';

const mockRestaurant: Restaurant = {
  _id: '507f1f77bcf86cd799439011' as unknown as string,
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'Test Restaurant',
  address: '123 Test Street, Test City, TC 12345',
  coordinates: {
    lat: 40.7128,
    lng: -74.006,
  },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$$',
  timeToPickUp: 25,
  photos: ['https://example.com/photo1.jpg'],
  phoneNumber: '+1-555-0123',
  website: 'https://testrestaurant.com',
  hours: {
    Monday: '9:00 AM – 10:00 PM',
    Tuesday: '9:00 AM – 10:00 PM',
    Wednesday: '9:00 AM – 10:00 PM',
  },
  cachedAt: new Date('2024-01-01'),
  lastUpdated: new Date('2024-01-01'),
};

describe('RestaurantCard', () => {
  const mockOnAddToCollection = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders restaurant information correctly', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(
      screen.getByText(/123 Test Street, Test City, TC 12345/)
    ).toBeInTheDocument();
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/\$\$/)).toBeInTheDocument();
    expect(screen.getByText(/25.*min/)).toBeInTheDocument();
    expect(screen.getByText(/\+1-555-0123/)).toBeInTheDocument();
    expect(screen.getByText(/Visit Website/)).toBeInTheDocument();
  });

  it('renders restaurant photo when available', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    const photo = screen.getByAltText('Test Restaurant');
    expect(photo).toBeInTheDocument();
    // Next.js Image component transforms the src URL, so we check for the pattern
    expect(photo).toHaveAttribute(
      'src',
      expect.stringContaining('https://example.com/photo1.jpg')
    );
  });

  it('renders hours information when available', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Hours:')).toBeInTheDocument();
    expect(screen.getByText('Monday: 9:00 AM – 10:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Tuesday: 9:00 AM – 10:00 PM')).toBeInTheDocument();
    expect(
      screen.getByText('Wednesday: 9:00 AM – 10:00 PM')
    ).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const restaurantWithoutOptionalFields: Restaurant = {
      ...mockRestaurant,
      rating: 0,
      priceRange: undefined,
      timeToPickUp: undefined,
      photos: undefined,
      phoneNumber: undefined,
      website: undefined,
      hours: undefined,
    };

    render(
      <RestaurantCard
        restaurant={restaurantWithoutOptionalFields}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText(/No rating/)).toBeInTheDocument();
    expect(screen.getByText(/Price not available/)).toBeInTheDocument();
    expect(screen.queryByText('Visit Website')).not.toBeInTheDocument();
    expect(screen.queryByText('Hours:')).not.toBeInTheDocument();
  });

  it('calls onAddToCollection when Add to Collection button is clicked', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    const addButton = screen.getByText('Add to Collection');
    fireEvent.click(addButton);

    expect(mockOnAddToCollection).toHaveBeenCalledWith(mockRestaurant);
  });

  it('calls onViewDetails when View Details button is clicked', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    const detailsButton = screen.getByText('View Details');
    fireEvent.click(detailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockRestaurant);
  });

  it('hides buttons when showAddButton is false', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        showAddButton={false}
      />
    );

    expect(screen.queryByText('Add to Collection')).not.toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('hides buttons when showDetailsButton is false', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
        showDetailsButton={false}
      />
    );

    expect(screen.getByText('Add to Collection')).toBeInTheDocument();
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('handles long hours list by showing only first 3 days', () => {
    const restaurantWithManyHours: Restaurant = {
      ...mockRestaurant,
      hours: {
        Monday: '9:00 AM – 10:00 PM',
        Tuesday: '9:00 AM – 10:00 PM',
        Wednesday: '9:00 AM – 10:00 PM',
        Thursday: '9:00 AM – 10:00 PM',
        Friday: '9:00 AM – 10:00 PM',
        Saturday: '9:00 AM – 10:00 PM',
        Sunday: '9:00 AM – 10:00 PM',
      },
    };

    render(
      <RestaurantCard
        restaurant={restaurantWithManyHours}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Monday: 9:00 AM – 10:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Tuesday: 9:00 AM – 10:00 PM')).toBeInTheDocument();
    expect(
      screen.getByText('Wednesday: 9:00 AM – 10:00 PM')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Thursday: 9:00 AM – 10:00 PM')
    ).not.toBeInTheDocument();
    expect(screen.getByText('+4 more days')).toBeInTheDocument();
  });
});
