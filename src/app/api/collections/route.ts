import { NextRequest, NextResponse } from 'next/server';
import { getCollectionsByUserId, createCollection } from '@/lib/collections';
import { validateData, collectionSchema } from '@/lib/validation';
import { ObjectId } from 'mongodb';

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

    // Validate input
    const validation = validateData(collectionSchema, {
      name,
      description,
      type,
    });
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error },
        { status: 400 }
      );
    }

    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    // Create collection
    const collection = await createCollection({
      name: validation.data.name,
      description: validation.data.description,
      type: validation.data.type,
      ownerId: new ObjectId(ownerId),
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
