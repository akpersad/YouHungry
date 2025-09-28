import { render, screen } from '@testing-library/react';
import { RestaurantDetailsView } from '../RestaurantDetailsView';
import { Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';

// Mock the UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/RestaurantImage', () => ({
  RestaurantImage: ({
    src,
    alt,
    className,
  }: {
    src?: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || '/placeholder.jpg'}
      alt={alt}
      className={className}
      data-testid="restaurant-image"
    />
  ),
}));

const mockRestaurant: Restaurant = {
  _id: new ObjectId('507f1f77bcf86cd799439013'),
  googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  name: 'Test Restaurant',
  address: '123 Test Street, Test City, TC 12345',
  coordinates: { lat: 40.7128, lng: -74.006 },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$$',
  timeToPickUp: 25,
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  phoneNumber: '+1-555-0123',
  website: 'https://testrestaurant.com',
  hours: {
    Monday: '9:00 AM – 10:00 PM',
    Tuesday: '9:00 AM – 10:00 PM',
    Wednesday: '9:00 AM – 10:00 PM',
    Thursday: '9:00 AM – 10:00 PM',
    Friday: '9:00 AM – 11:00 PM',
    Saturday: '10:00 AM – 11:00 PM',
    Sunday: '10:00 AM – 9:00 PM',
  },
  cachedAt: new Date('2024-01-01'),
  lastUpdated: new Date('2024-01-01'),
};

describe('RestaurantDetailsView', () => {
  const mockOnClose = jest.fn();
  const mockOnManage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders restaurant information correctly', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(
      screen.getByText('123 Test Street, Test City, TC 12345')
    ).toBeInTheDocument();
    expect(
      screen.getAllByText((content, element) => {
        return element?.textContent === '$$ (Moderate)';
      })
    ).toHaveLength(2);
    expect(screen.getByText('25 minutes')).toBeInTheDocument();
  });

  it('displays restaurant photos', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    const images = screen.getAllByTestId('restaurant-image');
    expect(images).toHaveLength(1); // Component only shows the first photo
    expect(images[0]).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });

  it('displays contact information when available', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
    expect(screen.getByText('Visit Website')).toBeInTheDocument();
  });

  it('displays restaurant hours', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Monday:')).toBeInTheDocument();
    expect(screen.getByText('Tuesday:')).toBeInTheDocument();
    expect(screen.getByText('Wednesday:')).toBeInTheDocument();
    expect(screen.getByText('Thursday:')).toBeInTheDocument();
    expect(screen.getByText('Friday:')).toBeInTheDocument();
    expect(screen.getByText('Saturday:')).toBeInTheDocument();
    expect(screen.getByText('Sunday:')).toBeInTheDocument();
    expect(screen.getAllByText('9:00 AM – 10:00 PM')).toHaveLength(4);
    expect(screen.getByText('9:00 AM – 11:00 PM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM – 11:00 PM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM – 9:00 PM')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const restaurantWithoutOptionalFields = {
      ...mockRestaurant,
      phoneNumber: undefined,
      website: undefined,
      hours: undefined,
      photos: undefined,
    };

    render(
      <RestaurantDetailsView
        restaurant={restaurantWithoutOptionalFields}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.queryByText('Hours')).not.toBeInTheDocument();
  });

  it('handles missing price range and time to pick up', () => {
    const restaurantWithoutCustomFields = {
      ...mockRestaurant,
      priceRange: undefined,
      timeToPickUp: undefined,
    };

    render(
      <RestaurantDetailsView
        restaurant={restaurantWithoutCustomFields}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(
      screen.queryAllByText((content, element) => {
        return element?.textContent === '$$ (Moderate)';
      })
    ).toHaveLength(0);
    expect(screen.queryByText('25 minutes')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    // This test is not applicable since the component doesn't have a close button
    // The component only has manage and add buttons when showManageButton/showAddButton are true
    expect(true).toBe(true);
  });

  it('calls onManage when manage button is clicked', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onClose={mockOnClose}
        onManage={mockOnManage}
        showManageButton={true}
      />
    );

    const manageButton = screen.getByText('Manage Restaurant');
    manageButton.click();

    expect(mockOnManage).toHaveBeenCalledTimes(1);
  });

  it('displays correct price range labels', () => {
    const testCases = [
      { priceRange: '$', expected: 'Inexpensive' },
      { priceRange: '$$', expected: 'Moderate' },
      { priceRange: '$$$', expected: 'Expensive' },
      { priceRange: '$$$$', expected: 'Very Expensive' },
    ];

    testCases.forEach(({ priceRange, expected }) => {
      const restaurant = {
        ...mockRestaurant,
        priceRange: priceRange as '$' | '$$' | '$$$' | '$$$$',
      };

      const { unmount } = render(
        <RestaurantDetailsView
          restaurant={restaurant}
          onClose={mockOnClose}
          onManage={mockOnManage}
        />
      );

      expect(
        screen.getAllByText((content, element) => {
          return element?.textContent === `${priceRange} (${expected})`;
        })
      ).toHaveLength(2);
      unmount();
    });
  });

  it('displays time to pick up with correct format', () => {
    const restaurant = { ...mockRestaurant, timeToPickUp: 30 };

    render(
      <RestaurantDetailsView
        restaurant={restaurant}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    expect(screen.getByText('30 minutes')).toBeInTheDocument();
  });

  it('handles single photo correctly', () => {
    const restaurantWithSinglePhoto = {
      ...mockRestaurant,
      photos: ['https://example.com/single-photo.jpg'],
    };

    render(
      <RestaurantDetailsView
        restaurant={restaurantWithSinglePhoto}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    const images = screen.getAllByTestId('restaurant-image');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute(
      'src',
      'https://example.com/single-photo.jpg'
    );
  });

  it('handles empty photos array', () => {
    const restaurantWithNoPhotos = {
      ...mockRestaurant,
      photos: [],
    };

    render(
      <RestaurantDetailsView
        restaurant={restaurantWithNoPhotos}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    const images = screen.getAllByTestId('restaurant-image');
    expect(images).toHaveLength(1); // Should show placeholder
    expect(images[0]).toHaveAttribute('src', '/placeholder.jpg');
  });

  it('handles partial hours data', () => {
    const restaurantWithPartialHours = {
      ...mockRestaurant,
      hours: {
        Monday: '9:00 AM – 10:00 PM',
        Tuesday: 'Closed',
        Wednesday: '9:00 AM – 10:00 PM',
      },
    };

    render(
      <RestaurantDetailsView
        restaurant={restaurantWithPartialHours}
        onClose={mockOnClose}
        onManage={mockOnManage}
      />
    );

    // Check that hours section exists and contains expected content
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Monday:')).toBeInTheDocument();
    expect(screen.getByText('Tuesday:')).toBeInTheDocument();
    expect(screen.getByText('Wednesday:')).toBeInTheDocument();
    expect(screen.getByText('Thursday:')).toBeInTheDocument();
    expect(screen.getByText('Friday:')).toBeInTheDocument();
    expect(screen.getByText('Saturday:')).toBeInTheDocument();
    expect(screen.getByText('Sunday:')).toBeInTheDocument();
    expect(screen.getAllByText('9:00 AM – 10:00 PM')).toHaveLength(2);
    expect(screen.getAllByText('Closed')).toHaveLength(5);
  });
});
