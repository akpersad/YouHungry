import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantCard } from '../RestaurantCard';
import { mockRestaurant } from '@/test-utils/mockData';
import { Restaurant } from '@/types/database';

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
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/\$\$/)).toBeInTheDocument();
    expect(screen.getByText(/25 min/)).toBeInTheDocument();
    expect(screen.getByText(/📞 Available/)).toBeInTheDocument();
    expect(screen.getByText(/🌐 Website/)).toBeInTheDocument();
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
        variant="default"
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
    const restaurantWithoutOptionalFields = {
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
    expect(screen.getByText(/Price N\/A/)).toBeInTheDocument();
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

    const detailsButton = screen.getByText('Details');
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
    expect(screen.getByText('Details')).toBeInTheDocument();
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
        variant="default"
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

  it('displays restaurant address when available', () => {
    render(
      <RestaurantCard
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(
      screen.getByText('📍 123 Test Street, Test City, TC 12345')
    ).toBeInTheDocument();
  });

  it('displays address even when distance is not available', () => {
    const restaurantWithoutDistance: Restaurant = {
      ...mockRestaurant,
      distance: undefined,
    };

    render(
      <RestaurantCard
        restaurant={restaurantWithoutDistance}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(
      screen.getByText('📍 123 Test Street, Test City, TC 12345')
    ).toBeInTheDocument();
  });

  it('does not display address section when address is missing', () => {
    const restaurantWithoutAddress: Restaurant = {
      ...mockRestaurant,
      address: undefined,
    };

    render(
      <RestaurantCard
        restaurant={restaurantWithoutAddress}
        onAddToCollection={mockOnAddToCollection}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
  });
});
