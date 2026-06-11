import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getRestaurantsByCollection,
  addRestaurantToCollection,
  removeRestaurantFromCollection,
  verifyCollectionAccess,
} from '@/lib/collections';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Owner (personal) or group member (group) only
    const collection = await verifyCollectionAccess(id, user, 'member');
    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    const restaurants = await getRestaurantsByCollection(id);

    return NextResponse.json({
      success: true,
      restaurants,
      count: restaurants.length,
    });
  } catch (error) {
    logger.error('Get collection restaurants error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { restaurantId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Owner (personal) or group member (group) can manage restaurants
    const accessibleCollection = await verifyCollectionAccess(
      id,
      user,
      'member'
    );
    if (!accessibleCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Validate restaurant ID format (ObjectId or Google Place ID)
    const isValidObjectId = ObjectId.isValid(restaurantId);
    const isValidGooglePlaceId =
      restaurantId.startsWith('ChIJ') && restaurantId.length > 20;

    if (!isValidObjectId && !isValidGooglePlaceId) {
      return NextResponse.json(
        { success: false, error: 'Invalid restaurant ID format' },
        { status: 400 }
      );
    }

    const result = await addRestaurantToCollection(id, restaurantId);

    if (!result.collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collection: result.collection,
      message: 'Restaurant added to collection successfully',
    });
  } catch (error) {
    logger.error('Add restaurant to collection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Owner (personal) or group member (group) can manage restaurants
    const accessibleCollection = await verifyCollectionAccess(
      id,
      user,
      'member'
    );
    if (!accessibleCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Validate restaurant ID format (ObjectId or Google Place ID)
    const isValidObjectId = ObjectId.isValid(restaurantId);
    const isValidGooglePlaceId =
      restaurantId.startsWith('ChIJ') && restaurantId.length > 20;

    if (!isValidObjectId && !isValidGooglePlaceId) {
      return NextResponse.json(
        { success: false, error: 'Invalid restaurant ID format' },
        { status: 400 }
      );
    }

    const updatedCollection = await removeRestaurantFromCollection(
      id,
      restaurantId
    );

    if (!updatedCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collection: updatedCollection,
      message: 'Restaurant removed from collection successfully',
    });
  } catch (error) {
    logger.error('Remove restaurant from collection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
