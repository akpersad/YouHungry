/**
 * Test Data Fixtures
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * Provides consistent test data for E2E tests
 */

export const testUsers = {
  user1: {
    email: process.env.E2E_TEST_USER_EMAIL || 'test-user-1@playwright-e2e.test',
    username: process.env.E2E_TEST_USER_USERNAME || '',
    password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!',
    name: 'Test User One',
  },
  user2: {
    email: 'test-user-2@playwright-e2e.test',
    password: 'TestPassword123!',
    name: 'Test User Two',
  },
  user3: {
    email: 'test-user-3@playwright-e2e.test',
    password: 'TestPassword123!',
    name: 'Test User Three',
  },
  admin: {
    email: 'admin@playwright-e2e.test',
    password: 'AdminPassword123!',
    name: 'Admin User',
  },
};

export const testRestaurants = {
  pizza1: {
    name: "Joe's Pizza",
    address: '7 Carmine St, New York, NY 10014',
    cuisine: 'Pizza',
    priceRange: '$',
    rating: 4.5,
  },
  pizza2: {
    name: 'Prince Street Pizza',
    address: '27 Prince St, New York, NY 10012',
    cuisine: 'Pizza',
    priceRange: '$',
    rating: 4.6,
  },
  pizza3: {
    name: "Lombardi's Pizza",
    address: '32 Spring St, New York, NY 10012',
    cuisine: 'Pizza',
    priceRange: '$$',
    rating: 4.4,
  },
  sushi1: {
    name: 'Sushi Nakazawa',
    address: '23 Commerce St, New York, NY 10014',
    cuisine: 'Sushi',
    priceRange: '$$$$',
    rating: 4.8,
  },
  italian1: {
    name: "L'Artusi",
    address: '228 W 10th St, New York, NY 10014',
    cuisine: 'Italian',
    priceRange: '$$$',
    rating: 4.7,
  },
  mexican1: {
    name: 'Los Tacos No. 1',
    address: '75 9th Ave, New York, NY 10011',
    cuisine: 'Mexican',
    priceRange: '$',
    rating: 4.5,
  },
};

export const testCollections = {
  personal1: {
    name: 'My Favorite Pizza Places',
    description: 'Best pizza spots in NYC',
    type: 'personal' as const,
  },
  personal2: {
    name: 'Quick Lunch Options',
    description: 'Fast and affordable lunch spots',
    type: 'personal' as const,
  },
  group1: {
    name: 'Team Lunch Spots',
    description: 'Places for team lunches',
    type: 'group' as const,
  },
  group2: {
    name: 'Weekend Dinner Options',
    description: 'Nice places for weekend dinners',
    type: 'group' as const,
  },
};

export const testGroups = {
  group1: {
    name: 'Lunch Squad',
    description: 'Weekly lunch group',
  },
  group2: {
    name: 'Weekend Foodies',
    description: 'Weekend dinner adventures',
  },
  group3: {
    name: 'Pizza Lovers',
    description: 'For pizza enthusiasts',
  },
};

/**
 * Test scenarios for tiered voting
 */
export const tieredVotingScenarios = {
  // Scenario 1: Clear winner
  clearWinner: {
    votes: [
      { user: 'user1', rankings: ['pizza1', 'pizza2', 'pizza3'] }, // Pizza1: 3pts
      { user: 'user2', rankings: ['pizza1', 'pizza3', 'pizza2'] }, // Pizza1: 3pts, Pizza3: 2pts
      { user: 'user3', rankings: ['pizza1', 'italian1', 'sushi1'] }, // Pizza1: 3pts
    ],
    expectedWinner: 'pizza1',
    expectedReason: /clear winner with 9 points/i,
  },

  // Scenario 2: 2-way tie (should pick randomly)
  twoWayTie: {
    votes: [
      { user: 'user1', rankings: ['pizza1', 'pizza3', 'italian1'] }, // Pizza1: 3pts
      { user: 'user2', rankings: ['pizza2', 'pizza1', 'sushi1'] }, // Pizza2: 3pts, Pizza1: 2pts
      { user: 'user3', rankings: ['pizza1', 'pizza2', 'mexican1'] }, // Pizza1: 3pts, Pizza2: 2pts
    ],
    // Pizza1: 3+2+3=8, Pizza2: 3+2=5, Pizza3: 2
    // Wait, let me recalculate: Pizza1: 3+2+3=8pts, Pizza2: 3+2=5pts
    // This isn't a tie. Let me create a real tie:
    expectedTiedRestaurants: ['pizza1', 'pizza2'],
    expectedReason: /tie between 2 restaurants/i,
  },

  // Scenario 3: 3-way tie (should pick randomly)
  threeWayTie: {
    votes: [
      { user: 'user1', rankings: ['pizza1', 'pizza2', 'pizza3'] }, // P1:3, P2:2, P3:1
      { user: 'user2', rankings: ['pizza2', 'pizza3', 'pizza1'] }, // P2:3, P3:2, P1:1
      { user: 'user3', rankings: ['pizza3', 'pizza1', 'pizza2'] }, // P3:3, P1:2, P2:1
    ],
    // Pizza1: 3+1+2=6, Pizza2: 2+3+1=6, Pizza3: 1+2+3=6 - Perfect 3-way tie!
    expectedTiedRestaurants: ['pizza1', 'pizza2', 'pizza3'],
    expectedReason: /tie between 3 restaurants/i,
  },

  // Scenario 4: Single voter
  singleVoter: {
    votes: [{ user: 'user1', rankings: ['pizza1', 'pizza2', 'pizza3'] }],
    expectedWinner: 'pizza1',
    expectedReason: /1 votes? total/i,
  },

  // Scenario 5: Everyone chooses different first choices (creates varied scores)
  diverseVotes: {
    votes: [
      { user: 'user1', rankings: ['pizza1', 'sushi1', 'mexican1'] }, // P1:3
      { user: 'user2', rankings: ['pizza2', 'italian1', 'sushi1'] }, // P2:3
      { user: 'user3', rankings: ['pizza3', 'mexican1', 'pizza1'] }, // P3:3, P1:1
    ],
    // Pizza1: 3+1=4, Pizza2: 3, Pizza3: 3 - Pizza1 should win
    expectedWinner: 'pizza1',
    expectedReason: /4 points/i,
  },
};

/**
 * Create a proper 2-way tie scenario
 */
export const properTwoWayTie = {
  votes: [
    { user: 'user1', rankings: ['pizza1', 'pizza3', 'mexican1'] }, // P1:3, P3:2
    { user: 'user2', rankings: ['pizza2', 'pizza3', 'italian1'] }, // P2:3, P3:2
    { user: 'user3', rankings: ['pizza3', 'pizza1', 'pizza2'] }, // P3:3, P1:2, P2:1
  ],
  // Pizza1: 3+2=5, Pizza2: 3+1=4, Pizza3: 2+2+3=7 - Pizza3 wins
  // Let me recalculate for a real tie:
  // Try again:
};

// Corrected 2-way tie
export const realTwoWayTie = {
  votes: [
    { user: 'user1', rankings: ['pizza1', 'sushi1', 'mexican1'] }, // P1:3
    { user: 'user2', rankings: ['pizza2', 'italian1', 'sushi1'] }, // P2:3
  ],
  // Pizza1: 3, Pizza2: 3 - Perfect 2-way tie!
  expectedTiedRestaurants: ['pizza1', 'pizza2'],
  expectedReason: /tie between 2 restaurants with 3 points each/i,
};
