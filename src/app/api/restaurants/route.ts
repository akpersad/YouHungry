import { NextRequest, NextResponse } from 'next/server';
import { createRestaurant, getRestaurantDetails } from '@/lib/restaurants';
import { addRestaurantToCollection } from '@/lib/collections';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantData, collectionId } = body;

    // Validate required fields
    if (!restaurantData) {
      return NextResponse.json(
        { success: false, error: 'Restaurant data is required' },
        { status: 400 }
      );
    }

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Validate required restaurant fields
    const { name, googlePlaceId, address, coordinates, cuisine, rating } =
      restaurantData;

    if (
      !name ||
      !googlePlaceId ||
      !coordinates ||
      !cuisine ||
      rating === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required restaurant fields' },
        { status: 400 }
      );
    }

    // Check if restaurant already exists in database
    let restaurant = await getRestaurantDetails(googlePlaceId);

    // If restaurant doesn't exist, create it
    if (!restaurant) {
      try {
        restaurant = await createRestaurant({
          googlePlaceId,
          name,
          address: address || 'Address not available',
          coordinates,
          cuisine,
          rating,
          priceRange: restaurantData.priceRange,
          timeToPickUp: restaurantData.timeToPickUp,
          photos: restaurantData.photos,
          phoneNumber: restaurantData.phoneNumber,
          website: restaurantData.website,
          hours: restaurantData.hours,
        });
      } catch (createError) {
        console.error('Error creating restaurant:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create restaurant' },
          { status: 500 }
        );
      }
    }

    // Ensure restaurant was created/found successfully
    if (!restaurant || !restaurant._id) {
      return NextResponse.json(
        { success: false, error: 'Failed to create or find restaurant' },
        { status: 500 }
      );
    }

    // Add restaurant to collection
    // Use googlePlaceId if _id is not available (for search results)
    const restaurantId = restaurant._id || restaurant.googlePlaceId;
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const { collection: updatedCollection, wasAdded } =
      await addRestaurantToCollection(collectionId, restaurantId.toString());

    if (!updatedCollection) {
      return NextResponse.json(
        { success: false, error: 'Failed to add restaurant to collection' },
        { status: 500 }
      );
    }

    if (!wasAdded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Restaurant is already in this collection',
          alreadyExists: true,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurant,
      collection: updatedCollection,
    });
  } catch (error) {
    console.error('Add restaurant to collection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
