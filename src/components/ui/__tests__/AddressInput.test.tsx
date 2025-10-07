import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { AddressInput } from '../AddressInput';
import * as addressValidation from '@/lib/address-validation';

// Mock the address validation module
jest.mock('@/lib/address-validation');
const mockAddressValidation = addressValidation as jest.Mocked<
  typeof addressValidation
>;

describe('AddressInput', () => {
  const mockOnChange = jest.fn();
  const mockOnAddressSelect = jest.fn();
  const mockOnValidationChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddressValidation.getAddressSuggestions.mockResolvedValue([]);
    mockAddressValidation.validateAddress.mockResolvedValue(null);
  });

  it('renders input field correctly', () => {
    render(
      <AddressInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter address..."
      />
    );

    const input = screen.getByPlaceholderText('Enter address...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('calls onChange when user types', async () => {
    render(
      <AddressInput
        value=""
        onChange={mockOnChange}
        onAddressSelect={mockOnAddressSelect}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '123 Main St' } });

    expect(mockOnChange).toHaveBeenCalledWith('123 Main St');
  });

  it('shows loading indicator when fetching suggestions', async () => {
    mockAddressValidation.getAddressSuggestions.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(<AddressInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '123 Main St' } });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('displays address suggestions when available', async () => {
    const mockSuggestions = [
      {
        formattedAddress: '123 Main St, New York, NY, USA',
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        addressComponents: [],
        confidence: 0.9,
      },
      {
        formattedAddress: '123 Main St, Boston, MA, USA',
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY5',
        addressComponents: [],
        confidence: 0.8,
      },
    ];

    mockAddressValidation.getAddressSuggestions.mockResolvedValue(
      mockSuggestions
    );

    render(
      <AddressInput
        value=""
        onChange={mockOnChange}
        onAddressSelect={mockOnAddressSelect}
      />
    );

    const input = screen.getByRole('textbox');

    // Trigger the search by changing the input value (need at least 3 characters)
    fireEvent.change(input, { target: { value: '123 Main St' } });

    await waitFor(
      () => {
        expect(
          screen.getByText('123 Main St, New York, NY, USA')
        ).toBeInTheDocument();
        expect(
          screen.getByText('123 Main St, Boston, MA, USA')
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('calls onAddressSelect when suggestion is clicked', async () => {
    const mockSuggestions = [
      {
        formattedAddress: '123 Main St, New York, NY, USA',
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        addressComponents: [],
        confidence: 0.9,
      },
    ];

    mockAddressValidation.getAddressSuggestions.mockResolvedValue(
      mockSuggestions
    );

    render(
      <AddressInput
        value=""
        onChange={mockOnChange}
        onAddressSelect={mockOnAddressSelect}
      />
    );

    const input = screen.getByRole('textbox');

    // Trigger the search by changing the input value
    fireEvent.change(input, { target: { value: '123 Main St' } });

    await waitFor(
      () => {
        const suggestion = screen.getByText('123 Main St, New York, NY, USA');
        fireEvent.click(suggestion);
      },
      { timeout: 2000 }
    );

    expect(mockOnAddressSelect).toHaveBeenCalledWith(
      '123 Main St, New York, NY, USA',
      'ChIJN1t_tDeuEmsRUsoyG83frY4'
    );
    expect(mockOnChange).toHaveBeenCalledWith('123 Main St, New York, NY, USA');
  });

  it('handles keyboard navigation', async () => {
    const mockSuggestions = [
      {
        formattedAddress: '123 Main St, New York, NY, USA',
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        addressComponents: [],
        confidence: 0.9,
      },
      {
        formattedAddress: '123 Main St, Boston, MA, USA',
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY5',
        addressComponents: [],
        confidence: 0.8,
      },
    ];

    mockAddressValidation.getAddressSuggestions.mockResolvedValue(
      mockSuggestions
    );

    render(
      <AddressInput
        value=""
        onChange={mockOnChange}
        onAddressSelect={mockOnAddressSelect}
      />
    );

    const input = screen.getByRole('textbox');

    // Trigger the search by changing the input value
    fireEvent.change(input, { target: { value: '123 Main St' } });

    await waitFor(
      () => {
        expect(
          screen.getByText('123 Main St, New York, NY, USA')
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Test arrow down navigation
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const firstSuggestion = screen.getByRole('button', {
      name: /123 Main St, New York, NY, USA/,
    });
    expect(firstSuggestion).toHaveFocus();

    // Test arrow up navigation - fire the event on the input, not the suggestion
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    // Wait for focus to return to input
    await waitFor(
      () => {
        expect(input).toHaveFocus();
      },
      { timeout: 1000 }
    );

    // Test escape key
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(
      screen.queryByRole('button', { name: /123 Main St, New York, NY, USA/ })
    ).not.toBeInTheDocument();
  });

  it('validates address and shows validation status', async () => {
    const mockValidationResult = {
      formattedAddress: '123 Main St, New York, NY, USA',
      postalAddress: {
        addressLines: ['123 Main St'],
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
        inputGranularity: 'PREMISE' as const,
        validationGranularity: 'PREMISE' as const,
        geocodeGranularity: 'PREMISE' as const,
        addressComplete: true,
        hasUnconfirmedComponents: false,
        hasInferredComponents: false,
        hasReplacedComponents: false,
      },
    };

    mockAddressValidation.validateAddress.mockResolvedValue(
      mockValidationResult
    );
    mockAddressValidation.isAddressValidForSearch.mockReturnValue(true);

    const { rerender } = render(
      <AddressInput
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');

    // Trigger validation by changing the input value
    await act(async () => {
      fireEvent.change(input, {
        target: { value: '123 Main St, New York, NY' },
      });
    });

    // Update the component with the new value
    rerender(
      <AddressInput
        value="123 Main St, New York, NY"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Wait for validation to complete (1000ms debounce + processing time)
    await waitFor(
      () => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(true);
      },
      { timeout: 3000 }
    );

    // Debug: Check if validation was called
    expect(mockAddressValidation.validateAddress).toHaveBeenCalledWith(
      '123 Main St, New York, NY'
    );

    // Wait for the validation status to appear - check for the checkmark
    await waitFor(
      () => {
        const checkmark = screen.getByText('✓');
        expect(checkmark).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('shows validation error for invalid address', async () => {
    mockAddressValidation.validateAddress.mockResolvedValue(null);

    const { rerender } = render(
      <AddressInput
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');

    // Trigger validation by changing the input value
    await act(async () => {
      fireEvent.change(input, { target: { value: 'invalid address' } });
    });

    // Update the component with the new value
    rerender(
      <AddressInput
        value="invalid address"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(
      () => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      },
      { timeout: 3000 }
    );

    // Wait for the validation status to appear - check for the warning icon
    await waitFor(
      () => {
        const warningIcon = screen.getByText('⚠');
        expect(warningIcon).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    expect(screen.getByText('Unable to validate address')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<AddressInput value="" onChange={mockOnChange} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('handles required state', () => {
    render(<AddressInput value="" onChange={mockOnChange} required={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('debounces suggestion requests', async () => {
    jest.useFakeTimers();

    render(<AddressInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');

    // Type multiple characters quickly
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.change(input, { target: { value: '123' } });

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockAddressValidation.getAddressSuggestions).toHaveBeenCalledTimes(
        1
      );
      expect(mockAddressValidation.getAddressSuggestions).toHaveBeenCalledWith(
        '123',
        expect.any(String)
      );
    });

    jest.useRealTimers();
  });
});
