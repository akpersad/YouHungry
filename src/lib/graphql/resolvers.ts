import {
  searchRestaurants,
  searchRestaurantsByCoordinates,
  getRestaurantDetails,
  getRestaurantById,
  updateRestaurant,
} from '../restaurants';
import {
  getRestaurantsByCollection,
  addRestaurantToCollection,
  removeRestaurantFromCollection,
} from '../collections';

export const resolvers = {
  Query: {
    searchRestaurants: async (
      _: unknown,
      {
        query,
        location,
        filters,
      }: { query: string; location?: string; filters?: Record<string, unknown> }
    ) => {
      try {
        const restaurants = await searchRestaurants(query, location, filters);
        return {
          restaurants,
          count: restaurants.length,
          hasMore: false, // Google Places API doesn't provide pagination info in this implementation
          nextPageToken: null,
        };
      } catch (error) {
        console.error('GraphQL searchRestaurants error:', error);
        throw new Error('Failed to search restaurants');
      }
    },

    searchRestaurantsByLocation: async (
      _: unknown,
      {
        lat,
        lng,
        radius = 5000,
        filters,
      }: {
        lat: number;
        lng: number;
        radius?: number;
        filters?: Record<string, unknown>;
      }
    ) => {
      try {
        const restaurants = await searchRestaurantsByCoordinates(
          lat,
          lng,
          radius
        );

        // Apply filters if provided
        let filteredRestaurants = restaurants;
        if (filters) {
          filteredRestaurants = restaurants.filter((restaurant) => {
            if (
              filters.cuisine &&
              !restaurant.cuisine
                .toLowerCase()
                .includes(filters.cuisine.toLowerCase())
            ) {
              return false;
            }

            if (filters.minRating && restaurant.rating < filters.minRating) {
              return false;
            }

            if (filters.minPrice || filters.maxPrice) {
              const priceLevel = restaurant.priceRange
                ? restaurant.priceRange === '$'
                  ? 1
                  : restaurant.priceRange === '$$'
                    ? 2
                    : restaurant.priceRange === '$$$'
                      ? 3
                      : 4
                : 0;

              if (filters.minPrice && priceLevel < filters.minPrice) {
                return false;
              }

              if (filters.maxPrice && priceLevel > filters.maxPrice) {
                return false;
              }
            }

            return true;
          });
        }

        return {
          restaurants: filteredRestaurants,
          count: filteredRestaurants.length,
          hasMore: false,
          nextPageToken: null,
        };
      } catch (error) {
        console.error('GraphQL searchRestaurantsByLocation error:', error);
        throw new Error('Failed to search restaurants by location');
      }
    },

    getRestaurantDetails: async (
      _: unknown,
      { googlePlaceId }: { googlePlaceId: string }
    ) => {
      try {
        return await getRestaurantDetails(googlePlaceId);
      } catch (error) {
        console.error('GraphQL getRestaurantDetails error:', error);
        throw new Error('Failed to get restaurant details');
      }
    },

    getRestaurant: async (_: unknown, { id }: { id: string }) => {
      try {
        return await getRestaurantById(id);
      } catch (error) {
        console.error('GraphQL getRestaurant error:', error);
        throw new Error('Failed to get restaurant');
      }
    },

    getRestaurantsByCollection: async (
      _: unknown,
      { collectionId }: { collectionId: string }
    ) => {
      try {
        return await getRestaurantsByCollection(collectionId);
      } catch (error) {
        console.error('GraphQL getRestaurantsByCollection error:', error);
        throw new Error('Failed to get restaurants by collection');
      }
    },
  },

  Mutation: {
    addRestaurantToCollection: async (
      _: unknown,
      {
        restaurantId,
        collectionId,
      }: { restaurantId: string; collectionId: string }
    ) => {
      try {
        return await addRestaurantToCollection(restaurantId, collectionId);
      } catch (error) {
        console.error('GraphQL addRestaurantToCollection error:', error);
        throw new Error('Failed to add restaurant to collection');
      }
    },

    removeRestaurantFromCollection: async (
      _: unknown,
      {
        restaurantId,
        collectionId,
      }: { restaurantId: string; collectionId: string }
    ) => {
      try {
        return await removeRestaurantFromCollection(restaurantId, collectionId);
      } catch (error) {
        console.error('GraphQL removeRestaurantFromCollection error:', error);
        throw new Error('Failed to remove restaurant from collection');
      }
    },

    updateRestaurant: async (
      _: unknown,
      {
        id,
        priceRange,
        timeToPickUp,
      }: { id: string; priceRange?: string; timeToPickUp?: number }
    ) => {
      try {
        return await updateRestaurant(id, { priceRange, timeToPickUp });
      } catch (error) {
        console.error('GraphQL updateRestaurant error:', error);
        throw new Error('Failed to update restaurant');
      }
    },
  },

  // Custom scalar resolvers
  Date: {
    serialize: (date: Date) => date.toISOString(),
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast: { value: string }) => new Date(ast.value),
  },
};
