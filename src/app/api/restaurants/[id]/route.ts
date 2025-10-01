import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  getRestaurantDetails,
  updateRestaurant,
  deleteRestaurant,
} from '@/lib/restaurants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const restaurant = await getRestaurantDetails(id);

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurant,
    });
  } catch (error) {
    logger.error('Restaurant details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const { priceRange, timeToPickUp } = body;

    // Validate input
    if (priceRange && !['$', '$$', '$$$', '$$$$'].includes(priceRange)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid price range. Must be $, $$, $$$, or $$$$',
        },
        { status: 400 }
      );
    }

    if (
      timeToPickUp !== undefined &&
      (typeof timeToPickUp !== 'number' || timeToPickUp < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time to pick up must be a non-negative number',
        },
        { status: 400 }
      );
    }

    const updatedRestaurant = await updateRestaurant(id, {
      priceRange,
      timeToPickUp,
    });

    if (!updatedRestaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    logger.error('Update restaurant error:', error);
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
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteRestaurant(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    logger.error('Delete restaurant error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
