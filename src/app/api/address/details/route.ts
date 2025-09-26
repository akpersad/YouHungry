import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error('Google Places API key not configured');
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      fields: 'address_components,formatted_address,geometry,place_id',
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Place Details API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Place Details API error: ${data.status}`);
    }

    const result = data.result;

    // Convert Place Details to AddressValidationResult format
    const addressValidationResult = {
      formattedAddress: result.formatted_address,
      postalAddress: {
        addressLines: [result.formatted_address],
        locality: '',
        administrativeArea: '',
        postalCode: '',
        regionCode: '',
      },
      addressComponents: result.address_components.map(
        (component: {
          long_name: string;
          short_name: string;
          types: string[];
        }) => ({
          longText: component.long_name,
          shortText: component.short_name,
          types: component.types,
          languageCode: 'en',
        })
      ),
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

    // Extract specific components
    result.address_components.forEach(
      (component: {
        long_name: string;
        short_name: string;
        types: string[];
      }) => {
        if (component.types.includes('locality')) {
          addressValidationResult.postalAddress.locality = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          addressValidationResult.postalAddress.administrativeArea =
            component.long_name;
          addressValidationResult.postalAddress.regionCode =
            component.short_name;
        }
        if (component.types.includes('postal_code')) {
          addressValidationResult.postalAddress.postalCode =
            component.long_name;
        }
      }
    );

    return NextResponse.json(addressValidationResult);
  } catch (error) {
    console.error('Address details error:', error);
    return NextResponse.json(
      { error: 'Address details failed' },
      { status: 500 }
    );
  }
}
