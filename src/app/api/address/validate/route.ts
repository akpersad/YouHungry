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
      console.error('Google Places API key not configured');
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
    return NextResponse.json(data.result);
  } catch (error) {
    console.error('Address validation error:', error);
    return NextResponse.json(
      { error: 'Address validation failed' },
      { status: 500 }
    );
  }
}
