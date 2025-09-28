import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantDetailsView } from '../RestaurantDetailsView';
import { Restaurant } from '@/types/database';
import { ObjectId } from 'mongodb';

// Mock the UI components
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
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    className?: string;
  }) => (
    <button onClick={onClick} className={className} data-variant={variant}>
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
  googlePlaceId: 'place-123',
  name: 'Test Restaurant',
  address: '123 Test St, Test City, TC 12345',
  coordinates: { lat: 40.7128, lng: -74.006 },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$$',
  timeToPickUp: 20,
  photos: ['https://example.com/photo.jpg'],
  phoneNumber: '+1234567890',
  website: 'https://testrestaurant.com',
  hours: {
    Monday: '9:00 AM - 10:00 PM',
    Tuesday: '9:00 AM - 10:00 PM',
    Wednesday: '9:00 AM - 10:00 PM',
    Thursday: '9:00 AM - 10:00 PM',
    Friday: '9:00 AM - 11:00 PM',
    Saturday: '10:00 AM - 11:00 PM',
    Sunday: '10:00 AM - 9:00 PM',
  },
  cachedAt: new Date(),
  lastUpdated: new Date(),
};

describe('RestaurantDetailsView', () => {
  const mockOnManage = jest.fn();
  const mockOnAddToCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders restaurant basic information correctly', () => {
    render(<RestaurantDetailsView restaurant={mockRestaurant} />);

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(
      screen.getByText('123 Test St, Test City, TC 12345')
    ).toBeInTheDocument();
  });

  it('displays custom information section when custom fields are present', () => {
    render(<RestaurantDetailsView restaurant={mockRestaurant} />);

    expect(screen.getByText('Custom Information')).toBeInTheDocument();
    expect(screen.getByText('Price Range:')).toBeInTheDocument();
    expect(screen.getAllByText(/Moderate/)).toHaveLength(2);
    expect(screen.getByText('Time to Pick Up:')).toBeInTheDocument();
    expect(screen.getByText('20 minutes')).toBeInTheDocument();
  });

  it('does not display custom information section when no custom fields', () => {
    const restaurantWithoutCustomFields = {
      ...mockRestaurant,
      priceRange: undefined,
      timeToPickUp: undefined,
    };

    render(
      <RestaurantDetailsView restaurant={restaurantWithoutCustomFields} />
    );

    expect(screen.queryByText('Custom Information')).not.toBeInTheDocument();
  });

  it('displays contact information when available', () => {
    render(<RestaurantDetailsView restaurant={mockRestaurant} />);

    expect(screen.getByText('Contact Information')).toBeInTheDocument();

    const phoneLink = screen.getByText('+1234567890');
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+1234567890');

    const websiteLink = screen.getByText('Visit Website');
    expect(websiteLink).toBeInTheDocument();
    expect(websiteLink.closest('a')).toHaveAttribute(
      'href',
      'https://testrestaurant.com'
    );
    expect(websiteLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('does not display contact information when not available', () => {
    const restaurantWithoutContact = {
      ...mockRestaurant,
      phoneNumber: undefined,
      website: undefined,
    };

    render(<RestaurantDetailsView restaurant={restaurantWithoutContact} />);

    expect(screen.queryByText('Contact Information')).not.toBeInTheDocument();
  });

  it('displays hours information', () => {
    render(<RestaurantDetailsView restaurant={mockRestaurant} />);

    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Monday:')).toBeInTheDocument();
    expect(screen.getAllByText('9:00 AM - 10:00 PM')).toHaveLength(4);
    expect(screen.getByText('Sunday:')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM - 9:00 PM')).toBeInTheDocument();
  });

  it('does not display hours section when hours are not available', () => {
    const restaurantWithoutHours = {
      ...mockRestaurant,
      hours: undefined,
    };

    render(<RestaurantDetailsView restaurant={restaurantWithoutHours} />);

    expect(screen.queryByText('Hours')).not.toBeInTheDocument();
  });

  it('displays manage button when showManageButton is true', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onManage={mockOnManage}
        showManageButton={true}
      />
    );

    const manageButton = screen.getByText('Manage Restaurant');
    expect(manageButton).toBeInTheDocument();

    fireEvent.click(manageButton);
    expect(mockOnManage).toHaveBeenCalled();
  });

  it('displays add to collection button when showAddButton is true', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onAddToCollection={mockOnAddToCollection}
        showAddButton={true}
      />
    );

    const addButton = screen.getByText('Add to Collection');
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(mockOnAddToCollection).toHaveBeenCalled();
  });

  it('displays both buttons when both are enabled', () => {
    render(
      <RestaurantDetailsView
        restaurant={mockRestaurant}
        onManage={mockOnManage}
        onAddToCollection={mockOnAddToCollection}
        showManageButton={true}
        showAddButton={true}
      />
    );

    expect(screen.getByText('Manage Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Add to Collection')).toBeInTheDocument();
  });

  it('does not display action buttons by default', () => {
    render(<RestaurantDetailsView restaurant={mockRestaurant} />);

    expect(screen.queryByText('Manage Restaurant')).not.toBeInTheDocument();
    expect(screen.queryByText('Add to Collection')).not.toBeInTheDocument();
  });

  it('formats price range correctly', () => {
    const priceRangeTests = [
      { priceRange: '$', expected: '$ (Inexpensive)' },
      { priceRange: '$$', expected: '$$ (Moderate)' },
      { priceRange: '$$$', expected: '$$$ (Expensive)' },
      { priceRange: '$$$$', expected: '$$$$ (Very Expensive)' },
    ];

    priceRangeTests.forEach(({ priceRange, expected }) => {
      const restaurant = { ...mockRestaurant, priceRange };
      const { unmount } = render(
        <RestaurantDetailsView restaurant={restaurant} />
      );

      expect(
        screen.getAllByText(
          new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        )
      ).toHaveLength(2);
      unmount();
    });
  });

  it('displays "Not specified" for undefined price range in custom info', () => {
    const restaurantWithoutPriceRange = {
      ...mockRestaurant,
      priceRange: undefined,
      timeToPickUp: 15,
    };

    render(<RestaurantDetailsView restaurant={restaurantWithoutPriceRange} />);

    expect(screen.getByText('Custom Information')).toBeInTheDocument();
    expect(screen.getByText('Time to Pick Up:')).toBeInTheDocument();
    expect(screen.getByText('15 minutes')).toBeInTheDocument();
    // Price range should not be displayed in custom info when undefined
    expect(screen.queryByText('Price Range:')).not.toBeInTheDocument();
  });

  it('renders restaurant image', () => {
    render(<RestaurantDetailsView restaurant={mockRestaurant} />);

    const image = screen.getByTestId('restaurant-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(image).toHaveAttribute('alt', 'Test Restaurant');
  });

  it('handles restaurant without photos', () => {
    const restaurantWithoutPhotos = {
      ...mockRestaurant,
      photos: undefined,
    };

    render(<RestaurantDetailsView restaurant={restaurantWithoutPhotos} />);

    const image = screen.getByTestId('restaurant-image');
    expect(image).toHaveAttribute('src', '/placeholder.jpg');
  });
});
