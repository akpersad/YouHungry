import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar Date

  type Coordinates {
    lat: Float!
    lng: Float!
  }

  type RestaurantHours {
    Monday: String
    Tuesday: String
    Wednesday: String
    Thursday: String
    Friday: String
    Saturday: String
    Sunday: String
  }

  type Restaurant {
    _id: ID!
    googlePlaceId: String!
    name: String!
    address: String!
    coordinates: Coordinates!
    cuisine: String!
    rating: Float!
    priceRange: String
    timeToPickUp: Int
    photos: [String!]
    phoneNumber: String
    website: String
    hours: RestaurantHours
    cachedAt: Date!
    lastUpdated: Date!
  }

  type RestaurantSearchResult {
    restaurants: [Restaurant!]!
    count: Int!
    hasMore: Boolean!
    nextPageToken: String
  }

  input RestaurantSearchFilters {
    cuisine: String
    minRating: Float
    maxPrice: Int
    minPrice: Int
    radius: Int
  }

  input RestaurantSearchInput {
    query: String!
    location: String
    coordinates: CoordinatesInput
    filters: RestaurantSearchFilters
  }

  input CoordinatesInput {
    lat: Float!
    lng: Float!
  }

  type Decision {
    _id: ID!
    type: String!
    collectionId: ID!
    groupId: ID
    participants: [ID!]!
    method: String!
    status: String!
    deadline: Date!
    visitDate: Date!
    result: DecisionResult
    votes: [Vote!]
    createdAt: Date!
    updatedAt: Date!
  }

  type DecisionResult {
    restaurantId: ID!
    selectedAt: Date!
    reasoning: String!
  }

  type Vote {
    userId: ID!
    rankings: [ID!]!
    submittedAt: Date!
  }

  type DecisionStatistics {
    totalDecisions: Int!
    restaurantStats: [RestaurantStat!]!
  }

  type RestaurantStat {
    restaurantId: ID!
    name: String!
    selectionCount: Int!
    lastSelected: Date
    currentWeight: Float!
  }

  type DecisionResultWithWeights {
    restaurantId: ID!
    selectedAt: Date!
    reasoning: String!
    weights: String! # JSON string of weights
  }

  # Friend Management Types
  type User {
    _id: ID!
    clerkId: String!
    email: String!
    name: String!
    city: String
    profilePicture: String
    smsOptIn: Boolean!
    smsPhoneNumber: String
    createdAt: Date!
    updatedAt: Date!
  }

  type FriendSearchResult {
    _id: ID!
    clerkId: String!
    email: String!
    name: String!
    profilePicture: String
    city: String
  }

  type Friend {
    _id: ID!
    clerkId: String!
    email: String!
    name: String!
    profilePicture: String
    city: String
    friendshipId: ID!
    addedAt: Date!
  }

  type FriendRequest {
    _id: ID!
    requester: User!
    addressee: User!
    status: String!
    createdAt: Date!
    updatedAt: Date!
  }

  type FriendRequests {
    sent: [FriendRequest!]!
    received: [FriendRequest!]!
  }

  type Friendship {
    _id: ID!
    requesterId: ID!
    addresseeId: ID!
    status: String!
    createdAt: Date!
    updatedAt: Date!
  }

  # Group Management Types
  type Group {
    _id: ID!
    name: String!
    description: String
    adminIds: [ID!]!
    memberIds: [ID!]!
    collectionIds: [ID!]!
    members: [User!]!
    createdAt: Date!
    updatedAt: Date!
  }

  type GroupMember {
    _id: ID!
    clerkId: String!
    email: String!
    name: String!
    profilePicture: String
    city: String
    isAdmin: Boolean!
  }

  type Query {
    # Search restaurants with text query
    searchRestaurants(
      query: String!
      location: String
      filters: RestaurantSearchFilters
    ): RestaurantSearchResult!

    # Search restaurants by coordinates
    searchRestaurantsByLocation(
      lat: Float!
      lng: Float!
      radius: Int
      filters: RestaurantSearchFilters
    ): RestaurantSearchResult!

    # Get restaurant details by Google Place ID
    getRestaurantDetails(googlePlaceId: String!): Restaurant

    # Get restaurant by internal ID
    getRestaurant(id: ID!): Restaurant

    # Get restaurants by collection ID
    getRestaurantsByCollection(collectionId: ID!): [Restaurant!]!

    # Get decision history for a collection
    getDecisionHistory(collectionId: ID!, limit: Int): [Decision!]!

    # Get decision statistics for a collection
    getDecisionStatistics(collectionId: ID!): DecisionStatistics!

    # Friend Management Queries
    # Search for users by email or name
    searchUsers(query: String!, userId: ID!): [FriendSearchResult!]!

    # Get all friends for a user
    getFriends(userId: ID!): [Friend!]!

    # Get friend requests for a user
    getFriendRequests(userId: ID!): FriendRequests!

    # Check if two users are friends
    areFriends(userId1: ID!, userId2: ID!): Boolean!

    # Get friendship between two users
    getFriendship(userId1: ID!, userId2: ID!): Friendship

    # Group Management Queries
    # Get all groups for a user
    getGroups(userId: ID!): [Group!]!

    # Get group by ID with members
    getGroup(groupId: ID!): Group

    # Get group members
    getGroupMembers(groupId: ID!): [GroupMember!]!

    # Group Decision Queries
    getGroupDecisions(groupId: ID!): [Decision!]!
    getGroupDecision(decisionId: ID!): Decision
  }

  type Subscription {
    # Group Decision Subscriptions
    groupDecisionUpdated(groupId: ID!): Decision!
    voteSubmitted(decisionId: ID!): Vote!
    decisionCompleted(decisionId: ID!): Decision!
  }

  input CreateDecisionInput {
    collectionId: ID!
    method: String!
    visitDate: Date!
  }

  input CreateGroupDecisionInput {
    collectionId: ID!
    groupId: ID!
    method: String!
    visitDate: Date!
    deadlineHours: Int
  }

  input GroupRandomSelectInput {
    collectionId: ID!
    groupId: ID!
    visitDate: Date!
  }

  input RandomSelectInput {
    collectionId: ID!
    visitDate: Date!
  }

  input CreateGroupInput {
    name: String!
    description: String
  }

  input UpdateGroupInput {
    name: String
    description: String
  }

  input GroupInviteInput {
    groupId: ID!
    email: String!
  }

  type Mutation {
    # Add restaurant to collection
    addRestaurantToCollection(restaurantId: ID!, collectionId: ID!): Boolean!

    # Remove restaurant from collection
    removeRestaurantFromCollection(
      restaurantId: ID!
      collectionId: ID!
    ): Boolean!

    # Update restaurant custom fields
    updateRestaurant(id: ID!, priceRange: String, timeToPickUp: Int): Restaurant

    # Create a new personal decision
    createPersonalDecision(input: CreateDecisionInput!): Decision!

    # Perform random selection with weighted algorithm
    performRandomSelection(
      input: RandomSelectInput!
    ): DecisionResultWithWeights!

    # Group Decision Mutations
    createGroupDecision(input: CreateGroupDecisionInput!): Decision!
    submitGroupVote(decisionId: ID!, rankings: [ID!]!): Boolean!
    completeTieredGroupDecision(decisionId: ID!): DecisionResultWithWeights!
    performGroupRandomSelection(
      input: GroupRandomSelectInput!
    ): DecisionResultWithWeights!

    # Friend Management Mutations
    # Send a friend request
    sendFriendRequest(requesterId: ID!, addresseeId: ID!): Friendship!

    # Accept a friend request
    acceptFriendRequest(friendshipId: ID!, userId: ID!): Friendship!

    # Decline a friend request
    declineFriendRequest(friendshipId: ID!, userId: ID!): Friendship!

    # Remove a friend
    removeFriend(friendshipId: ID!, userId: ID!): Boolean!

    # Group Management Mutations
    # Create a new group
    createGroup(input: CreateGroupInput!, userId: ID!): Group!

    # Update a group
    updateGroup(groupId: ID!, input: UpdateGroupInput!, userId: ID!): Group!

    # Delete a group
    deleteGroup(groupId: ID!, userId: ID!): Boolean!

    # Invite user to group
    inviteUserToGroup(input: GroupInviteInput!, userId: ID!): Boolean!

    # Remove user from group
    removeUserFromGroup(groupId: ID!, email: String!, userId: ID!): Boolean!

    # Promote user to admin
    promoteToAdmin(groupId: ID!, email: String!, userId: ID!): Boolean!

    # Leave group
    leaveGroup(groupId: ID!, userId: ID!): Boolean!
  }
`;

export default typeDefs;
