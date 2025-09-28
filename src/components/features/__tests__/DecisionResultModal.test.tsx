import { render, screen, fireEvent } from '@testing-library/react';
import { DecisionResultModal } from '../DecisionResultModal';
import { Restaurant } from '@/types/database';

const mockRestaurant: Restaurant = {
  _id: 'restaurant123' as unknown as import('mongodb').ObjectId,
  googlePlaceId: 'ChIJTest123',
  name: 'Test Restaurant',
  address: '123 Test St, Test City, TC 12345',
  coordinates: { lat: 40.7128, lng: -74.006 },
  cuisine: 'Italian',
  rating: 4.5,
  priceRange: '$$',
  timeToPickUp: 30,
  photos: ['https://example.com/photo1.jpg'],
  phoneNumber: '555-1234',
  website: 'https://testrestaurant.com',
  hours: {
    Monday: '9:00 AM - 10:00 PM',
    Tuesday: '9:00 AM - 10:00 PM',
  },
  cachedAt: new Date('2024-01-01T00:00:00Z'),
  lastUpdated: new Date('2024-01-01T00:00:00Z'),
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  selectedRestaurant: mockRestaurant,
  reasoning:
    'Selected using weighted random algorithm. Weight: 0.85, Previous selections: 2',
  visitDate: new Date('2024-01-02T19:00:00Z'),
  onConfirmVisit: jest.fn(),
  onTryAgain: jest.fn(),
  isLoading: false,
};

describe('DecisionResultModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders restaurant information correctly', () => {
    render(<DecisionResultModal {...defaultProps} />);

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(
      screen.getByText('123 Test St, Test City, TC 12345')
    ).toBeInTheDocument();
    expect(screen.getByText('★ 4.5')).toBeInTheDocument();
    expect(screen.getByText('$$')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('displays visit date correctly', () => {
    render(<DecisionResultModal {...defaultProps} />);

    expect(screen.getByText('Planned Visit')).toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, January 2, 2024 at 7:00 PM')
    ).toBeInTheDocument();
  });

  it('displays reasoning correctly', () => {
    render(<DecisionResultModal {...defaultProps} />);

    expect(screen.getByText('Selection Reasoning')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Selected using weighted random algorithm. Weight: 0.85, Previous selections: 2'
      )
    ).toBeInTheDocument();
  });

  it('calls onConfirmVisit when confirm button is clicked', () => {
    render(<DecisionResultModal {...defaultProps} />);

    const confirmButton = screen.getByText('Confirm Visit');
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirmVisit).toHaveBeenCalledTimes(1);
  });

  it('calls onTryAgain when try again button is clicked', () => {
    render(<DecisionResultModal {...defaultProps} />);

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(defaultProps.onTryAgain).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(<DecisionResultModal {...defaultProps} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    render(<DecisionResultModal {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Confirming...')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeDisabled();
    expect(screen.getByText('Close')).toBeDisabled();
  });

  it('does not render when selectedRestaurant is null', () => {
    render(<DecisionResultModal {...defaultProps} selectedRestaurant={null} />);

    expect(screen.queryByText('Test Restaurant')).not.toBeInTheDocument();
  });

  it('handles restaurant without optional fields', () => {
    const restaurantWithoutOptional: Restaurant = {
      ...mockRestaurant,
      priceRange: undefined,
      timeToPickUp: undefined,
      phoneNumber: undefined,
      website: undefined,
      hours: undefined,
    };

    render(
      <DecisionResultModal
        {...defaultProps}
        selectedRestaurant={restaurantWithoutOptional}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.queryByText('$$')).not.toBeInTheDocument();
    expect(screen.queryByText('30 min')).not.toBeInTheDocument();
  });

  it('formats different price ranges correctly', () => {
    const testCases = [
      { priceRange: '$', expected: '$' },
      { priceRange: '$$', expected: '$$' },
      { priceRange: '$$$', expected: '$$$' },
      { priceRange: '$$$$', expected: '$$$$' },
    ];

    testCases.forEach(({ priceRange, expected }) => {
      const restaurant = {
        ...mockRestaurant,
        priceRange: priceRange as string,
      };
      const { unmount } = render(
        <DecisionResultModal
          {...defaultProps}
          selectedRestaurant={restaurant}
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('displays different visit dates correctly', () => {
    const testDate = new Date('2024-12-25T12:30:00Z');
    render(<DecisionResultModal {...defaultProps} visitDate={testDate} />);

    expect(
      screen.getByText('Wednesday, December 25, 2024 at 12:30 PM')
    ).toBeInTheDocument();
  });
});
