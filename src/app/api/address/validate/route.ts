import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
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
      'https://addressvalidation.googleapis.com/v1:validateAddress';
    const params = new URLSearchParams({
      key: apiKey,
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: {
          addressLines: [address],
        },
        enableUspsCass: true, // Enable USPS CASS validation
      }),
    });

    if (!response.ok) {
      throw new Error(`Address Validation API error: ${response.status}`);
    }

    const data = await response.json();

    // Log the response for debugging
    logger.info('Address validation response:', {
      address,
      hasResult: !!data.result,
      resultKeys: data.result ? Object.keys(data.result) : [],
    });

    return NextResponse.json({ result: data.result });
  } catch (error) {
    logger.error('Address validation error:', error);
    return NextResponse.json(
      { error: 'Address validation failed' },
      { status: 500 }
    );
  }
}
