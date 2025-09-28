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
import {
  createPersonalDecision,
  performRandomSelection,
  getDecisionHistory,
  getDecisionStatistics,
} from '../decisions';

export const resolvers = {
  Query: {
    searchRestaurants: async (
      _: unknown,
      {
        query,
        location,
      }: { query: string; location?: string; filters?: Record<string, unknown> }
    ) => {
      try {
        const restaurants = await searchRestaurants(query, location);
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
              typeof filters.cuisine === 'string' &&
              !restaurant.cuisine
                .toLowerCase()
                .includes(filters.cuisine.toLowerCase())
            ) {
              return false;
            }

            if (
              filters.minRating &&
              typeof filters.minRating === 'number' &&
              restaurant.rating < filters.minRating
            ) {
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

              if (
                filters.minPrice &&
                typeof filters.minPrice === 'number' &&
                priceLevel < filters.minPrice
              ) {
                return false;
              }

              if (
                filters.maxPrice &&
                typeof filters.maxPrice === 'number' &&
                priceLevel > filters.maxPrice
              ) {
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

    getDecisionHistory: async (
      _: unknown,
      { collectionId, limit = 50 }: { collectionId: string; limit?: number }
    ) => {
      try {
        return await getDecisionHistory(collectionId, limit);
      } catch (error) {
        console.error('GraphQL getDecisionHistory error:', error);
        throw new Error('Failed to get decision history');
      }
    },

    getDecisionStatistics: async (
      _: unknown,
      { collectionId }: { collectionId: string }
    ) => {
      try {
        return await getDecisionStatistics(collectionId);
      } catch (error) {
        console.error('GraphQL getDecisionStatistics error:', error);
        throw new Error('Failed to get decision statistics');
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
        const validPriceRange = priceRange as
          | '$'
          | '$$'
          | '$$$'
          | '$$$$'
          | undefined;
        return await updateRestaurant(id, {
          priceRange: validPriceRange,
          timeToPickUp,
        });
      } catch (error) {
        console.error('GraphQL updateRestaurant error:', error);
        throw new Error('Failed to update restaurant');
      }
    },

    createPersonalDecision: async (
      _: unknown,
      {
        input,
      }: { input: { collectionId: string; method: string; visitDate: Date } }
    ) => {
      try {
        // For GraphQL, we need to get the current user ID
        // This would typically come from the context
        const userId = 'current-user-id'; // This should be injected from context
        return await createPersonalDecision(
          input.collectionId,
          userId,
          input.method as 'random' | 'tiered',
          input.visitDate
        );
      } catch (error) {
        console.error('GraphQL createPersonalDecision error:', error);
        throw new Error('Failed to create personal decision');
      }
    },

    performRandomSelection: async (
      _: unknown,
      { input }: { input: { collectionId: string; visitDate: Date } }
    ) => {
      try {
        // For GraphQL, we need to get the current user ID
        // This would typically come from the context
        const userId = 'current-user-id'; // This should be injected from context
        const result = await performRandomSelection(
          input.collectionId,
          userId,
          input.visitDate
        );

        return {
          restaurantId: result.restaurantId.toString(),
          selectedAt: result.selectedAt,
          reasoning: result.reasoning,
          weights: JSON.stringify(result.weights),
        };
      } catch (error) {
        console.error('GraphQL performRandomSelection error:', error);
        throw new Error('Failed to perform random selection');
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
