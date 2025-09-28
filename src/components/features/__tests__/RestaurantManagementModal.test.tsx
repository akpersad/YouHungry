import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RestaurantManagementModal } from '../RestaurantManagementModal';
import { Restaurant, Collection } from '@/types/database';
import { ObjectId } from 'mongodb';

// Mock the UI components
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({
    children,
    isOpen,
    onClose,
    title,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: string;
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

jest.mock('@/components/ui/Input', () => ({
  Input: ({
    id,
    type,
    value,
    onChange,
    placeholder,
    min,
  }: {
    id: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    min?: string;
  }) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      data-testid={id}
    />
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

const mockCollection: Collection = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  name: 'My Collection',
  description: 'Test collection',
  type: 'personal',
  ownerId: new ObjectId('507f1f77bcf86cd799439012'),
  restaurantIds: [new ObjectId('507f1f77bcf86cd799439013')],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RestaurantManagementModal', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdateRestaurant = jest.fn();
  const mockOnRemoveFromCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders restaurant information correctly', () => {
    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Italian • 4.5⭐')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText(/Collection:/)).toBeInTheDocument();
    expect(screen.getByText('My Collection')).toBeInTheDocument();
  });

  it('displays current restaurant custom fields', () => {
    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    const priceRangeSelect = screen.getByDisplayValue('$ - Inexpensive');
    const timeToPickUpInput = screen.getByDisplayValue('15');

    expect(priceRangeSelect).toBeInTheDocument();
    expect(timeToPickUpInput).toBeInTheDocument();
  });

  it('updates restaurant when save button is clicked', async () => {
    mockOnUpdateRestaurant.mockResolvedValue(undefined);

    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    // Change the price range
    const priceRangeSelect = screen.getByDisplayValue('$ - Inexpensive');
    fireEvent.change(priceRangeSelect, { target: { value: '$$' } });

    // Change the time to pick up
    const timeToPickUpInput = screen.getByDisplayValue('15');
    fireEvent.change(timeToPickUpInput, { target: { value: '20' } });

    // Click save button
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdateRestaurant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        {
          priceRange: '$$',
          timeToPickUp: 20,
        }
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not call update when no changes are made', async () => {
    mockOnUpdateRestaurant.mockResolvedValue(undefined);

    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    // Click save button without making changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdateRestaurant).not.toHaveBeenCalled();
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('removes restaurant when remove button is clicked', async () => {
    mockOnRemoveFromCollection.mockResolvedValue(undefined);
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    const removeButton = screen.getByText('Remove from Collection');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnRemoveFromCollection).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013'
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not remove restaurant when confirmation is cancelled', async () => {
    mockOnRemoveFromCollection.mockResolvedValue(undefined);
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    const removeButton = screen.getByText('Remove from Collection');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnRemoveFromCollection).not.toHaveBeenCalled();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('displays error message when update fails', async () => {
    const errorMessage = 'Failed to update restaurant';
    mockOnUpdateRestaurant.mockRejectedValue(new Error(errorMessage));

    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    // Change a field
    const priceRangeSelect = screen.getByDisplayValue('$ - Inexpensive');
    fireEvent.change(priceRangeSelect, { target: { value: '$$' } });

    // Click save button
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('displays error message when remove fails', async () => {
    const errorMessage = 'Failed to remove restaurant';
    mockOnRemoveFromCollection.mockRejectedValue(new Error(errorMessage));
    window.confirm = jest.fn(() => true);

    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    const removeButton = screen.getByText('Remove from Collection');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows loading state during operations', async () => {
    mockOnUpdateRestaurant.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    // Change a field
    const priceRangeSelect = screen.getByDisplayValue('$ - Inexpensive');
    fireEvent.change(priceRangeSelect, { target: { value: '$$' } });

    // Click save button
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Check loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('does not render when restaurant or collection is null', () => {
    const { rerender } = render(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={null}
        collection={mockCollection}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

    rerender(
      <RestaurantManagementModal
        isOpen={true}
        onClose={mockOnClose}
        restaurant={mockRestaurant}
        collection={null}
        onUpdateRestaurant={mockOnUpdateRestaurant}
        onRemoveFromCollection={mockOnRemoveFromCollection}
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});
