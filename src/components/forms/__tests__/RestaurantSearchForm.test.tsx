import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RestaurantSearchForm } from '../RestaurantSearchForm';
import * as addressValidation from '@/lib/address-validation';

// Mock the address validation module
jest.mock('@/lib/address-validation');
const mockAddressValidation = addressValidation as jest.Mocked<
  typeof addressValidation
>;

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('RestaurantSearchForm', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock address validation to return valid by default
    mockAddressValidation.getAddressSuggestions.mockResolvedValue([]);
    mockAddressValidation.validateAddress.mockResolvedValue({
      formattedAddress: 'New York, NY, USA',
      postalAddress: {
        addressLines: ['New York'],
        locality: 'New York',
        administrativeArea: 'NY',
        postalCode: '10001',
        regionCode: 'US',
      },
      addressComponents: [],
      missingComponentTypes: [],
      unconfirmedComponentTypes: [],
      unresolvedTokens: [],
      metadata: {
        business: false,
        poBox: false,
        residential: true,
      },
      verdict: {
        inputGranularity: 'LOCALITY' as const,
        validationGranularity: 'LOCALITY' as const,
        geocodeGranularity: 'LOCALITY' as const,
        addressComplete: true,
        hasUnconfirmedComponents: false,
        hasInferredComponents: false,
        hasReplacedComponents: false,
      },
    });
    mockAddressValidation.isAddressValidForSearch.mockReturnValue(true);
  });

  it('renders search form correctly', () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    expect(
      screen.getByLabelText('Restaurant name or cuisine (optional)')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Location (required)')).toBeInTheDocument();
    expect(screen.getByText(/Use Current Location/)).toBeInTheDocument();
    expect(screen.getByText('Show Filters')).toBeInTheDocument();
    expect(screen.getByText('Search Restaurants')).toBeInTheDocument();
  });

  it('calls onSearch with correct parameters when form is submitted', async () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const queryInput = screen.getByLabelText(
      'Restaurant name or cuisine (optional)'
    );
    const locationInput = screen.getByLabelText('Location (required)');
    const submitButton = screen.getByText('Search Restaurants');

    fireEvent.change(queryInput, { target: { value: 'pizza' } });
    fireEvent.change(locationInput, { target: { value: 'New York' } });

    // Wait for address validation to complete
    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 3000 }
    );

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('New York', 'pizza', {});
    });
  });

  it('does not call onSearch when location is empty', async () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const queryInput = screen.getByLabelText(
      'Restaurant name or cuisine (optional)'
    );
    const submitButton = screen.getByText('Search Restaurants');

    fireEvent.change(queryInput, { target: { value: 'sushi' } });
    fireEvent.click(submitButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('does not submit form when location is empty', () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const submitButton = screen.getByText('Search Restaurants');
    fireEvent.click(submitButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
    expect(submitButton).toBeDisabled();
  });

  it('trims whitespace from query before submitting', async () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const queryInput = screen.getByLabelText(
      'Restaurant name or cuisine (optional)'
    );
    const locationInput = screen.getByLabelText('Location (required)');
    const submitButton = screen.getByText('Search Restaurants');

    fireEvent.change(queryInput, { target: { value: '  pizza  ' } });
    fireEvent.change(locationInput, { target: { value: 'New York' } });

    // Wait for address validation to complete
    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 3000 }
    );

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('New York', 'pizza', {});
    });
  });

  it('toggles filters visibility when Show/Hide Filters button is clicked', () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const toggleButton = screen.getByText('Show Filters');
    expect(screen.queryByLabelText('Cuisine Type')).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText('Hide Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Cuisine Type')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide Filters'));
    expect(screen.getByText('Show Filters')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cuisine Type')).not.toBeInTheDocument();
  });

  it('calls onSearch with filters when filters are applied', async () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    // Show filters
    fireEvent.click(screen.getByText('Show Filters'));

    const queryInput = screen.getByLabelText(
      'Restaurant name or cuisine (optional)'
    );
    const locationInput = screen.getByLabelText('Location (required)');
    const cuisineInput = screen.getByLabelText('Cuisine Type');
    const minRatingInput = screen.getByLabelText('Minimum Rating');
    const submitButton = screen.getByText('Search Restaurants');

    fireEvent.change(queryInput, { target: { value: 'restaurant' } });
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    fireEvent.change(cuisineInput, { target: { value: 'Italian' } });
    fireEvent.change(minRatingInput, { target: { value: '4.0' } });

    // Wait for address validation to complete
    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 3000 }
    );

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('New York', 'restaurant', {
        cuisine: 'Italian',
        minRating: 4.0,
      });
    });
  });

  it('handles geolocation success correctly', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const useCurrentLocationButton = screen.getByText(/Use Current Location/);
    fireEvent.click(useCurrentLocationButton);

    await waitFor(() => {
      expect(screen.getByText('✓ Using current location')).toBeInTheDocument();
    });

    const locationInput = screen.getByLabelText(
      'Location (required)'
    ) as HTMLInputElement;
    expect(locationInput.value).toBe('40.7128,-74.006');
  });

  it('handles geolocation error correctly', async () => {
    const mockError = new Error('Geolocation error');
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    // Mock alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const useCurrentLocationButton = screen.getByText(/Use Current Location/);
    fireEvent.click(useCurrentLocationButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Unable to get your location. Please enter an address manually.'
      );
    });

    alertSpy.mockRestore();
  });

  it('handles geolocation not supported', async () => {
    // Mock navigator.geolocation as undefined
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    const useCurrentLocationButton = screen.getByText(/Use Current Location/);
    fireEvent.click(useCurrentLocationButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Geolocation is not supported by this browser.'
      );
    });

    alertSpy.mockRestore();
  });

  it('resets current location when location input is changed', () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    // Use current location
    fireEvent.click(screen.getByText(/Use Current Location/));

    // Change location input
    const locationInput = screen.getByLabelText('Location (required)');
    fireEvent.change(locationInput, { target: { value: 'New York' } });

    expect(
      screen.queryByText('✓ Using current location')
    ).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} isLoading={true} />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Searching/ })).toBeDisabled();
  });

  it('clears filter values when they are set to empty string', async () => {
    render(<RestaurantSearchForm onSearch={mockOnSearch} />);

    // Show filters
    fireEvent.click(screen.getByText('Show Filters'));

    const queryInput = screen.getByLabelText(
      'Restaurant name or cuisine (optional)'
    );
    const locationInput = screen.getByLabelText('Location (required)');
    const cuisineInput = screen.getByLabelText('Cuisine Type');
    const submitButton = screen.getByText('Search Restaurants');

    fireEvent.change(queryInput, { target: { value: 'restaurant' } });
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    fireEvent.change(cuisineInput, { target: { value: 'Italian' } });
    fireEvent.change(cuisineInput, { target: { value: '' } }); // Clear cuisine

    // Wait for address validation to complete
    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 3000 }
    );

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('New York', 'restaurant', {
        cuisine: undefined,
      });
    });
  });
});
