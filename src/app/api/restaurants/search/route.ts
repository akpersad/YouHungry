import { NextRequest, NextResponse } from "next/server";
import { searchRestaurants } from "@/lib/restaurants";
import { validateData, restaurantSearchSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const location = searchParams.get("location");

    // Validate parameters
    const validation = validateData(restaurantSearchSchema, {
      query,
      location,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error },
        { status: 400 }
      );
    }

    // Search restaurants
    const restaurants = await searchRestaurants(query!);

    return NextResponse.json({
      success: true,
      restaurants,
      count: restaurants.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
