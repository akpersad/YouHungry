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
  }

  input CreateDecisionInput {
    collectionId: ID!
    method: String!
    visitDate: Date!
  }

  input RandomSelectInput {
    collectionId: ID!
    visitDate: Date!
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
  }
`;

export default typeDefs;
