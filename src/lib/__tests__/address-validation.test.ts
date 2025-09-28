import {
  validateAddress,
  getAddressSuggestions,
  getAddressDetails,
  isAddressValidForSearch,
  getCoordinatesFromValidation,
} from '../address-validation';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Address Validation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';

    // Reset fetch mock to allow individual tests to override
    (global.fetch as jest.Mock).mockReset();
  });

  describe('validateAddress', () => {
    it('should validate a valid address successfully', async () => {
      const mockResponse = {
        result: {
          formattedAddress: '123 Main St, New York, NY 10001, USA',
          postalAddress: {
            addressLines: ['123 Main St'],
            locality: 'New York',
            administrativeArea: 'NY',
            postalCode: '10001',
            regionCode: 'US',
          },
          addressComponents: [
            {
              longText: '123 Main St',
              shortText: '123 Main St',
              types: ['street_number'],
              languageCode: 'en',
            },
          ],
          missingComponentTypes: [],
          unconfirmedComponentTypes: [],
          unresolvedTokens: [],
          metadata: {
            business: false,
            poBox: false,
            residential: true,
          },
          verdict: {
            inputGranularity: 'PREMISE',
            validationGranularity: 'PREMISE',
            geocodeGranularity: 'PREMISE',
            addressComplete: true,
            hasUnconfirmedComponents: false,
            hasInferredComponents: false,
            hasReplacedComponents: false,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await validateAddress('123 Main St, New York, NY');

      expect(result).toEqual(mockResponse.result);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/address/validate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: '123 Main St, New York, NY',
          }),
        })
      );
    });

    it('should return null when API key is not configured', async () => {
      delete process.env.GOOGLE_PLACES_API_KEY;

      const result = await validateAddress('123 Main St');

      expect(result).toBeNull();
    });

    it('should return null when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid address' }),
      } as Response);

      const result = await validateAddress('invalid address');

      expect(result).toBeNull();
    });
  });

  describe('getAddressSuggestions', () => {
    it('should return address suggestions successfully', async () => {
      const mockSuggestions = [
        {
          formattedAddress: '123 Main St, New York, NY, USA',
          placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          addressComponents: [
            {
              longText: '123 Main St',
              shortText: '123 Main St',
              types: ['street_number'],
              languageCode: 'en',
            },
            {
              longText: 'New York',
              shortText: 'New York',
              types: ['locality'],
              languageCode: 'en',
            },
            {
              longText: 'NY',
              shortText: 'NY',
              types: ['administrative_area_level_1'],
              languageCode: 'en',
            },
            {
              longText: 'USA',
              shortText: 'USA',
              types: ['country'],
              languageCode: 'en',
            },
          ],
          confidence: 0.8,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuggestions,
      } as Response);

      const result = await getAddressSuggestions('123 Main St');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        formattedAddress: '123 Main St, New York, NY, USA',
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        addressComponents: [
          {
            longText: '123 Main St',
            shortText: '123 Main St',
            types: ['street_number'],
            languageCode: 'en',
          },
          {
            longText: 'New York',
            shortText: 'New York',
            types: ['locality'],
            languageCode: 'en',
          },
          {
            longText: 'NY',
            shortText: 'NY',
            types: ['administrative_area_level_1'],
            languageCode: 'en',
          },
          {
            longText: 'USA',
            shortText: 'USA',
            types: ['country'],
            languageCode: 'en',
          },
        ],
        confidence: 0.8,
      });
    });

    it('should return empty array when no suggestions found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await getAddressSuggestions('nonexistent address');

      expect(result).toEqual([]);
    });
  });

  describe('getAddressDetails', () => {
    it('should return address details successfully', async () => {
      const mockAddressDetails = {
        formattedAddress: '123 Main St, New York, NY 10001, USA',
        postalAddress: {
          addressLines: ['123 Main St, New York, NY 10001, USA'],
          locality: 'New York',
          administrativeArea: 'New York',
          postalCode: '10001',
          regionCode: '',
        },
        addressComponents: [
          {
            longText: '123 Main St',
            shortText: '123 Main St',
            types: ['street_number'],
            languageCode: 'en',
          },
          {
            longText: 'New York',
            shortText: 'New York',
            types: ['locality'],
            languageCode: 'en',
          },
          {
            longText: 'New York',
            shortText: 'NY',
            types: ['administrative_area_level_1'],
            languageCode: 'en',
          },
          {
            longText: '10001',
            shortText: '10001',
            types: ['postal_code'],
            languageCode: 'en',
          },
        ],
        missingComponentTypes: [],
        unconfirmedComponentTypes: [],
        unresolvedTokens: [],
        metadata: {
          business: false,
          poBox: false,
          residential: false,
        },
        verdict: {
          inputGranularity: 'PREMISE',
          validationGranularity: 'PREMISE',
          geocodeGranularity: 'PREMISE',
          addressComplete: true,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddressDetails,
      } as Response);

      const result = await getAddressDetails('ChIJN1t_tDeuEmsRUsoyG83frY4');

      expect(result).toBeDefined();
      expect(result?.formattedAddress).toBe(
        '123 Main St, New York, NY 10001, USA'
      );
      expect(result?.postalAddress.locality).toBe('New York');
      expect(result?.postalAddress.administrativeArea).toBe('New York');
      expect(result?.postalAddress.postalCode).toBe('10001');
    });
  });

  describe('isAddressValidForSearch', () => {
    it('should return true for valid address', () => {
      const validAddress = {
        formattedAddress: '123 Main St, New York, NY',
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
          inputGranularity: 'PREMISE',
          validationGranularity: 'PREMISE',
          geocodeGranularity: 'PREMISE',
          addressComplete: true,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
        },
      };

      expect(isAddressValidForSearch(validAddress)).toBe(true);
    });

    it('should return false for incomplete address', () => {
      const incompleteAddress = {
        formattedAddress: '123 Main St',
        postalAddress: {
          addressLines: ['123 Main St'],
          locality: '',
          administrativeArea: '',
          postalCode: '',
          regionCode: '',
        },
        addressComponents: [],
        missingComponentTypes: ['locality'],
        unconfirmedComponentTypes: [],
        unresolvedTokens: [],
        metadata: {
          business: false,
          poBox: false,
          residential: true,
        },
        verdict: {
          inputGranularity: 'PREMISE',
          validationGranularity: 'PREMISE',
          geocodeGranularity: 'OTHER',
          addressComplete: false,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
        },
      };

      expect(isAddressValidForSearch(incompleteAddress)).toBe(false);
    });
  });

  describe('getCoordinatesFromValidation', () => {
    it('should return null (not implemented)', () => {
      const validationResult = {
        formattedAddress: '123 Main St, New York, NY',
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
          inputGranularity: 'PREMISE',
          validationGranularity: 'PREMISE',
          geocodeGranularity: 'PREMISE',
          addressComplete: true,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
        },
      };

      expect(getCoordinatesFromValidation(validationResult)).toBeNull();
    });
  });
});
