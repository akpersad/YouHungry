import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    const sessionToken = searchParams.get('sessionToken');

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      logger.error('Google Places API key not configured');
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    const baseUrl =
      'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const params = new URLSearchParams({
      input,
      key: apiKey,
      types: 'address',
      language: 'en',
      ...(sessionToken && { sessiontoken: sessionToken }),
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Response error text:', errorText);
      throw new Error(
        `Places Autocomplete API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logger.error(
        'API returned error status:',
        data.status,
        data.error_message
      );
      throw new Error(
        `Places Autocomplete API error: ${data.status} - ${data.error_message || 'Unknown error'}`
      );
    }

    // Convert predictions to our format
    const suggestions = data.predictions.map(
      (prediction: {
        description: string;
        place_id: string;
        terms?: Array<{ value: string }>;
        types?: string[];
      }) => ({
        formattedAddress: prediction.description,
        placeId: prediction.place_id,
        addressComponents: prediction.terms
          ? prediction.terms.map((term: { value: string }) => ({
              longText: term.value,
              shortText: term.value,
              types: prediction.types || ['geocode'], // Use prediction types or default
              languageCode: 'en',
            }))
          : [],
        confidence: 0.8, // Default confidence for autocomplete
      })
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    logger.error('Address suggestions error:', error);
    logger.error(
      'Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    logger.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Address suggestions failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
