import { NextRequest, NextResponse } from 'next/server';
import { getCollectionsByUserId, createCollection } from '@/lib/collections';
import {
  validateCollectionName,
  validateCollectionDescription,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const collections = await getCollectionsByUserId(userId);

    return NextResponse.json({
      success: true,
      collections,
      count: collections.length,
    });
  } catch (error) {
    console.error('Get collections error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, ownerId } = body;

    // Validate required fields
    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    // Validate collection name
    const nameError = validateCollectionName(name || '');
    if (nameError) {
      return NextResponse.json(
        { success: false, error: nameError },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description) {
      const descriptionError = validateCollectionDescription(description);
      if (descriptionError) {
        return NextResponse.json(
          { success: false, error: descriptionError },
          { status: 400 }
        );
      }
    }

    // Create collection
    const collection = await createCollection({
      name: (name || '').trim(),
      description: description?.trim() || undefined,
      type: type || 'personal',
      ownerId: ownerId, // Pass as string, let createCollection handle conversion
      restaurantIds: [],
    });

    return NextResponse.json(
      {
        success: true,
        collection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
