import { logger } from '@/lib/logger';

// Google Address Validation API integration
// https://developers.google.com/maps/documentation/address-validation

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
  languageCode: string;
}

interface AddressValidationResult {
  formattedAddress: string;
  postalAddress: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  addressComponents: AddressComponent[];
  missingComponentTypes: string[];
  unconfirmedComponentTypes: string[];
  unresolvedTokens: string[];
  uspsData?: {
    standardizedAddress: {
      firstAddressLine: string;
      cityName: string;
      state: string;
      zipCode: string;
    };
  };
  metadata: {
    business: boolean;
    poBox: boolean;
    residential: boolean;
  };
  verdict: {
    inputGranularity:
      | 'SUB_PREMISE'
      | 'PREMISE'
      | 'PREMISE_PROXIMITY'
      | 'BLOCK'
      | 'ROUTE'
      | 'OTHER';
    validationGranularity:
      | 'SUB_PREMISE'
      | 'PREMISE'
      | 'PREMISE_PROXIMITY'
      | 'BLOCK'
      | 'ROUTE'
      | 'OTHER';
    geocodeGranularity:
      | 'SUB_PREMISE'
      | 'PREMISE'
      | 'PREMISE_PROXIMITY'
      | 'BLOCK'
      | 'ROUTE'
      | 'OTHER';
    addressComplete: boolean;
    hasUnconfirmedComponents: boolean;
    hasInferredComponents: boolean;
    hasReplacedComponents: boolean;
  };
}

interface AddressSuggestion {
  formattedAddress: string;
  placeId: string;
  addressComponents: AddressComponent[];
  confidence: number;
}

// Validate an address using Google Address Validation API
export async function validateAddress(
  address: string
): Promise<AddressValidationResult | null> {
  try {
    logger.info('Validating address:', { address });

    const response = await fetch('/api/address/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Address validation API error:', {
        status: response.status,
        error: errorData,
      });
      throw new Error(
        errorData.error || `Address Validation API error: ${response.status}`
      );
    }

    const data = await response.json();
    logger.info('Address validation API response:', {
      hasResult: !!data.result,
      resultType: typeof data.result,
      resultKeys: data.result ? Object.keys(data.result) : [],
    });

    return data.result;
  } catch (error) {
    logger.error('Address validation error:', error);
    return null;
  }
}

// Get address suggestions using Google Places Autocomplete API
export async function getAddressSuggestions(
  input: string,
  sessionToken?: string
): Promise<AddressSuggestion[]> {
  try {
    const params = new URLSearchParams({
      input,
      ...(sessionToken && { sessionToken }),
    });

    const response = await fetch(
      `/api/address/suggestions?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Places Autocomplete API error: ${response.status}`
      );
    }

    const suggestions: AddressSuggestion[] = await response.json();
    return suggestions;
  } catch (error) {
    logger.error('Address suggestions error:', error);
    return [];
  }
}

// Get detailed address information using Place Details API
export async function getAddressDetails(
  placeId: string
): Promise<AddressValidationResult | null> {
  try {
    const params = new URLSearchParams({
      placeId,
    });

    const response = await fetch(`/api/address/details?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Place Details API error: ${response.status}`
      );
    }

    const addressValidationResult: AddressValidationResult =
      await response.json();
    return addressValidationResult;
  } catch (error) {
    logger.error('Address details error:', error);
    return null;
  }
}

// Check if an address is valid for restaurant search
export function isAddressValidForSearch(
  validationResult: AddressValidationResult
): boolean {
  // Log the validation result for debugging
  logger.info('Address validation result:', {
    hasVerdict: !!validationResult.verdict,
    geocodeGranularity: validationResult.verdict?.geocodeGranularity,
    inputGranularity: validationResult.verdict?.inputGranularity,
    validationGranularity: validationResult.verdict?.validationGranularity,
    hasAddressComponents: !!validationResult.addressComponents,
    addressComponentsCount: validationResult.addressComponents?.length || 0,
  });

  // Check if the address has sufficient granularity for restaurant search
  const hasGoodGranularity =
    validationResult.verdict.geocodeGranularity === 'PREMISE' ||
    validationResult.verdict.geocodeGranularity === 'SUB_PREMISE' ||
    validationResult.verdict.geocodeGranularity === 'BLOCK' ||
    validationResult.verdict.geocodeGranularity === 'ROUTE';

  // For restaurant search, we can be more permissive with unconfirmed components
  // as long as we have good geocoding granularity
  return hasGoodGranularity;
}

// Extract coordinates from validation result (if available)
export function getCoordinatesFromValidation(): {
  lat: number;
  lng: number;
} | null {
  // This would need to be enhanced with geocoding if coordinates are needed
  // For now, return null as the validation API doesn't provide coordinates directly
  return null;
}
