import {
  searchRestaurants,
  searchRestaurantsByCoordinates,
  getRestaurantDetails,
  getRestaurantById,
  updateRestaurant,
} from '../restaurants';
import { User } from '../../types/database';
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
import {
  searchUsers,
  getFriends,
  getFriendRequests,
  areFriends,
  getFriendship,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../friends';
import {
  getGroupsByUserId,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  inviteUserToGroup,
  removeUserFromGroup,
  promoteToAdmin,
  leaveGroup,
  getGroupMembers,
} from '../groups';

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

    // Friend Management Queries
    searchUsers: async (
      _: unknown,
      { query, userId }: { query: string; userId: string }
    ) => {
      try {
        return await searchUsers(query, userId);
      } catch (error) {
        console.error('GraphQL searchUsers error:', error);
        throw new Error('Failed to search users');
      }
    },

    getFriends: async (_: unknown, { userId }: { userId: string }) => {
      try {
        return await getFriends(userId);
      } catch (error) {
        console.error('GraphQL getFriends error:', error);
        throw new Error('Failed to get friends');
      }
    },

    getFriendRequests: async (_: unknown, { userId }: { userId: string }) => {
      try {
        return await getFriendRequests(userId);
      } catch (error) {
        console.error('GraphQL getFriendRequests error:', error);
        throw new Error('Failed to get friend requests');
      }
    },

    areFriends: async (
      _: unknown,
      { userId1, userId2 }: { userId1: string; userId2: string }
    ) => {
      try {
        return await areFriends(userId1, userId2);
      } catch (error) {
        console.error('GraphQL areFriends error:', error);
        throw new Error('Failed to check friendship status');
      }
    },

    getFriendship: async (
      _: unknown,
      { userId1, userId2 }: { userId1: string; userId2: string }
    ) => {
      try {
        return await getFriendship(userId1, userId2);
      } catch (error) {
        console.error('GraphQL getFriendship error:', error);
        throw new Error('Failed to get friendship');
      }
    },

    // Group Management Queries
    getGroups: async (_: unknown, { userId }: { userId: string }) => {
      try {
        const groups = await getGroupsByUserId(userId);
        return groups.map((group) => ({
          ...group,
          members: [], // Will be populated by the Group type resolver
        }));
      } catch (error) {
        console.error('GraphQL getGroups error:', error);
        throw new Error('Failed to get groups');
      }
    },

    getGroup: async (_: unknown, { groupId }: { groupId: string }) => {
      try {
        const group = await getGroupById(groupId);
        if (!group) {
          throw new Error('Group not found');
        }
        return {
          ...group,
          members: [], // Will be populated by the Group type resolver
        };
      } catch (error) {
        console.error('GraphQL getGroup error:', error);
        throw new Error('Failed to get group');
      }
    },

    getGroupMembers: async (_: unknown, { groupId }: { groupId: string }) => {
      try {
        const members = await getGroupMembers(groupId);
        const group = await getGroupById(groupId);
        if (!group) {
          throw new Error('Group not found');
        }

        return members.map((member) => ({
          ...member,
          isAdmin: group.adminIds.some(
            (adminId) => adminId.toString() === member._id.toString()
          ),
        }));
      } catch (error) {
        console.error('GraphQL getGroupMembers error:', error);
        throw new Error('Failed to get group members');
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

    // Friend Management Mutations
    sendFriendRequest: async (
      _: unknown,
      { requesterId, addresseeId }: { requesterId: string; addresseeId: string }
    ) => {
      try {
        return await sendFriendRequest(requesterId, addresseeId);
      } catch (error) {
        console.error('GraphQL sendFriendRequest error:', error);
        throw new Error('Failed to send friend request');
      }
    },

    acceptFriendRequest: async (
      _: unknown,
      { friendshipId, userId }: { friendshipId: string; userId: string }
    ) => {
      try {
        return await acceptFriendRequest(friendshipId, userId);
      } catch (error) {
        console.error('GraphQL acceptFriendRequest error:', error);
        throw new Error('Failed to accept friend request');
      }
    },

    declineFriendRequest: async (
      _: unknown,
      { friendshipId, userId }: { friendshipId: string; userId: string }
    ) => {
      try {
        return await declineFriendRequest(friendshipId, userId);
      } catch (error) {
        console.error('GraphQL declineFriendRequest error:', error);
        throw new Error('Failed to decline friend request');
      }
    },

    removeFriend: async (
      _: unknown,
      { friendshipId, userId }: { friendshipId: string; userId: string }
    ) => {
      try {
        return await removeFriend(friendshipId, userId);
      } catch (error) {
        console.error('GraphQL removeFriend error:', error);
        throw new Error('Failed to remove friend');
      }
    },

    // Group Management Mutations
    createGroup: async (
      _: unknown,
      {
        input,
        userId,
      }: { input: { name: string; description?: string }; userId: string }
    ) => {
      try {
        return await createGroup(input.name, input.description, userId);
      } catch (error) {
        console.error('GraphQL createGroup error:', error);
        throw new Error('Failed to create group');
      }
    },

    updateGroup: async (
      _: unknown,
      {
        groupId,
        input,
        userId,
      }: {
        groupId: string;
        input: { name?: string; description?: string };
        userId: string;
      }
    ) => {
      try {
        const group = await updateGroup(groupId, input, userId);
        if (!group) {
          throw new Error('Group not found or user is not an admin');
        }
        return group;
      } catch (error) {
        console.error('GraphQL updateGroup error:', error);
        throw new Error('Failed to update group');
      }
    },

    deleteGroup: async (
      _: unknown,
      { groupId, userId }: { groupId: string; userId: string }
    ) => {
      try {
        return await deleteGroup(groupId, userId);
      } catch (error) {
        console.error('GraphQL deleteGroup error:', error);
        throw new Error('Failed to delete group');
      }
    },

    inviteUserToGroup: async (
      _: unknown,
      {
        input,
        userId,
      }: { input: { groupId: string; email: string }; userId: string }
    ) => {
      try {
        // Find user by email first
        const { connectToDatabase } = await import('../db');
        const db = await connectToDatabase();
        const usersCollection = db.collection<User>('users');
        const targetUser = await usersCollection.findOne({
          email: input.email,
        });

        if (!targetUser) {
          throw new Error('User not found');
        }

        return await inviteUserToGroup(
          input.groupId,
          targetUser._id.toString(),
          userId
        );
      } catch (error) {
        console.error('GraphQL inviteUserToGroup error:', error);
        throw new Error('Failed to invite user to group');
      }
    },

    removeUserFromGroup: async (
      _: unknown,
      {
        groupId,
        email,
        userId,
      }: { groupId: string; email: string; userId: string }
    ) => {
      try {
        // Find user by email first
        const { connectToDatabase } = await import('../db');
        const db = await connectToDatabase();
        const usersCollection = db.collection<User>('users');
        const targetUser = await usersCollection.findOne({ email });

        if (!targetUser) {
          throw new Error('User not found');
        }

        return await removeUserFromGroup(
          groupId,
          targetUser._id.toString(),
          userId
        );
      } catch (error) {
        console.error('GraphQL removeUserFromGroup error:', error);
        throw new Error('Failed to remove user from group');
      }
    },

    promoteToAdmin: async (
      _: unknown,
      {
        groupId,
        email,
        userId,
      }: { groupId: string; email: string; userId: string }
    ) => {
      try {
        // Find user by email first
        const { connectToDatabase } = await import('../db');
        const db = await connectToDatabase();
        const usersCollection = db.collection<User>('users');
        const targetUser = await usersCollection.findOne({ email });

        if (!targetUser) {
          throw new Error('User not found');
        }

        return await promoteToAdmin(groupId, targetUser._id.toString(), userId);
      } catch (error) {
        console.error('GraphQL promoteToAdmin error:', error);
        throw new Error('Failed to promote user to admin');
      }
    },

    leaveGroup: async (
      _: unknown,
      { groupId, userId }: { groupId: string; userId: string }
    ) => {
      try {
        return await leaveGroup(groupId, userId);
      } catch (error) {
        console.error('GraphQL leaveGroup error:', error);
        throw new Error('Failed to leave group');
      }
    },
  },

  // Type resolvers
  Group: {
    members: async (parent: { _id: string; memberIds: string[] }) => {
      try {
        return await getGroupMembers(parent._id.toString());
      } catch (error) {
        console.error('GraphQL Group.members resolver error:', error);
        return [];
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
