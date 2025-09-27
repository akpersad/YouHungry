import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RestaurantSearchForm } from '../RestaurantSearchForm';

// Mock AddressInput component
jest.mock('@/components/ui/AddressInput', () => ({
  AddressInput: ({
    onAddressSelect,
    onValidationChange,
    ...props
  }: Record<string, unknown>) => (
    <input
      {...props}
      data-testid="address-input"
      onChange={(e) => {
        if (props.onChange) props.onChange(e);
        onValidationChange(true); // Mock validation success
      }}
    />
  ),
}));

describe('RestaurantSearchForm', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('renders form fields correctly', () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    expect(screen.getByText('Location (required)')).toBeInTheDocument();
    expect(screen.getByText('Search Radius')).toBeInTheDocument();
    expect(
      screen.getByText('Restaurant name or cuisine (optional)')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Search Restaurants' })
    ).toBeInTheDocument();
  });

  it('shows and hides filters', () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const toggleButton = screen.getByRole('button', { name: 'Show Filters' });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Cuisine Type')).toBeInTheDocument();
    expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
    expect(screen.getByText('Min Price Level')).toBeInTheDocument();
    expect(screen.getByText('Max Price Level')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Filters' }));

    expect(screen.queryByText('Cuisine Type')).not.toBeInTheDocument();
  });

  it('submits form with search data', async () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const addressInput = screen.getByTestId('address-input');
    const queryInput = screen.getByLabelText(
      'Restaurant name or cuisine (optional)'
    );
    const submitButton = screen.getByRole('button', {
      name: 'Search Restaurants',
    });

    fireEvent.change(addressInput, {
      target: { value: '123 Main St, City, State' },
    });
    fireEvent.change(queryInput, { target: { value: 'Italian' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        '123 Main St, City, State',
        'Italian',
        {
          distance: 10,
          cuisine: undefined,
          minRating: undefined,
          minPrice: undefined,
          maxPrice: undefined,
        }
      );
    });
  });

  it('handles current location button click', () => {
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn(),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });

    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const currentLocationButton = screen.getByRole('button', {
      name: '📍 Use Current Location',
    });
    fireEvent.click(currentLocationButton);

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('disables submit button when address is invalid', () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const submitButton = screen.getByRole('button', {
      name: 'Search Restaurants',
    });
    expect(submitButton).toBeDisabled();
  });
});
