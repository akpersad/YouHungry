import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantCardCompact } from '../RestaurantCardCompact';
import { Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';

const mockRestaurant: Restaurant = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'Test Restaurant',
  cuisine: 'Italian',
  address: '123 Test St, Test City, TC 12345',
  coordinates: { lat: 40.7128, lng: -74.006 },
  rating: 4.5,
  priceRange: '$$',
  distance: 2.3,
  timeToPickUp: 25,
  phoneNumber: '+1-555-0123',
  website: 'https://testrestaurant.com',
  photos: ['https://example.com/photo1.jpg'],
  hours: {
    Monday: '9:00 AM - 10:00 PM',
    Tuesday: '9:00 AM - 10:00 PM',
    Wednesday: '9:00 AM - 10:00 PM',
  },
  cachedAt: new Date('2024-01-01'),
  lastUpdated: new Date('2024-01-01'),
};

describe('RestaurantCardCompact', () => {
  const mockOnViewDetails = jest.fn();
  const mockOnManageRestaurant = jest.fn();

  beforeEach(() => {
    mockOnViewDetails.mockClear();
    mockOnManageRestaurant.mockClear();
  });

  it('renders restaurant information correctly', () => {
    render(
      <RestaurantCardCompact
        restaurant={mockRestaurant}
        onViewDetails={mockOnViewDetails}
        onManageRestaurant={mockOnManageRestaurant}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(
      screen.getByText('123 Test St, Test City, TC 12345')
    ).toBeInTheDocument();
    expect(screen.getByText('⭐ 4.5')).toBeInTheDocument();
    expect(screen.getByText('💰 $$')).toBeInTheDocument();
    expect(screen.getByText('📍 2.3 mi')).toBeInTheDocument();
    expect(screen.getByText('⏱️ 25 min')).toBeInTheDocument();
  });

  it('renders action buttons when callbacks are provided', () => {
    render(
      <RestaurantCardCompact
        restaurant={mockRestaurant}
        onViewDetails={mockOnViewDetails}
        onManageRestaurant={mockOnManageRestaurant}
      />
    );

    expect(
      screen.getByLabelText('View restaurant details')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Manage restaurant')).toBeInTheDocument();
  });

  it('calls onViewDetails when View button is clicked', () => {
    render(
      <RestaurantCardCompact
        restaurant={mockRestaurant}
        onViewDetails={mockOnViewDetails}
        onManageRestaurant={mockOnManageRestaurant}
      />
    );

    const viewButton = screen.getByLabelText('View restaurant details');
    fireEvent.click(viewButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockRestaurant);
  });

  it('calls onManageRestaurant when Manage button is clicked', () => {
    render(
      <RestaurantCardCompact
        restaurant={mockRestaurant}
        onViewDetails={mockOnViewDetails}
        onManageRestaurant={mockOnManageRestaurant}
      />
    );

    const manageButton = screen.getByLabelText('Manage restaurant');
    fireEvent.click(manageButton);

    expect(mockOnManageRestaurant).toHaveBeenCalledWith(mockRestaurant);
  });

  it('handles missing optional data gracefully', () => {
    const restaurantWithoutOptionalData: Restaurant = {
      ...mockRestaurant,
      rating: 0,
      priceRange: undefined,
      distance: undefined,
      timeToPickUp: undefined,
      address: '123 Test St, Test City, TC 12345', // Keep address for this test
    };

    render(
      <RestaurantCardCompact
        restaurant={restaurantWithoutOptionalData}
        onViewDetails={mockOnViewDetails}
        onManageRestaurant={mockOnManageRestaurant}
      />
    );

    expect(screen.getByText('⭐ N/A')).toBeInTheDocument();
    expect(screen.getByText('💰 N/A')).toBeInTheDocument();
    expect(screen.queryByText(/mi/)).not.toBeInTheDocument();
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('renders without action buttons when callbacks are not provided', () => {
    render(<RestaurantCardCompact restaurant={mockRestaurant} />);

    expect(
      screen.queryByLabelText('View restaurant details')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Manage restaurant')
    ).not.toBeInTheDocument();
  });
});
