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
  }
`;

export default typeDefs;
