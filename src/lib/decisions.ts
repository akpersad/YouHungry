import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db';
import { Restaurant, Decision } from '@/types/database';

export interface DecisionResult {
  restaurantId: ObjectId;
  selectedAt: Date;
  reasoning: string;
  weights: Record<string, number>;
}

export interface RestaurantWeight {
  restaurantId: ObjectId;
  weight: number;
  lastSelected?: Date;
  selectionCount: number;
}

/**
 * Calculate the weight for a restaurant based on 30-day rolling system
 * Restaurants selected more recently have lower weights (less likely to be selected again)
 * Restaurants not selected in the last 30 days have higher weights
 */
export function calculateRestaurantWeight(
  restaurantId: ObjectId,
  decisionHistory: Decision[],
  baseWeight: number = 1.0
): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Find the most recent selection of this restaurant
  const recentSelections = decisionHistory
    .filter(
      (decision) =>
        decision.result?.restaurantId.toString() === restaurantId.toString() &&
        decision.result.selectedAt >= thirtyDaysAgo
    )
    .sort(
      (a, b) => b.result!.selectedAt.getTime() - a.result!.selectedAt.getTime()
    );

  if (recentSelections.length === 0) {
    // Not selected in the last 30 days - full weight
    return baseWeight;
  }

  const mostRecentSelection = recentSelections[0];
  const daysSinceSelection = Math.floor(
    (now.getTime() - mostRecentSelection.result!.selectedAt.getTime()) /
      (24 * 60 * 60 * 1000)
  );

  // Weight decreases as days since selection decreases
  // After 30 days, weight returns to base weight
  const weightMultiplier = Math.min(daysSinceSelection / 30, 1);
  return baseWeight * (0.1 + 0.9 * weightMultiplier); // Minimum 10% weight
}

/**
 * Get decision history for a collection
 */
export async function getDecisionHistory(
  collectionId: string,
  limit: number = 100
): Promise<Decision[]> {
  const db = await connectToDatabase();
  const decisions = await db
    .collection('decisions')
    .find({
      collectionId: new ObjectId(collectionId),
      type: 'personal',
      status: 'completed',
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return decisions as Decision[];
}

/**
 * Create a new personal decision
 */
export async function createPersonalDecision(
  collectionId: string,
  userId: string,
  method: 'random' | 'tiered' = 'random',
  visitDate: Date
): Promise<Decision> {
  const db = await connectToDatabase();
  const now = new Date();

  const decision: Omit<Decision, '_id'> = {
    type: 'personal',
    collectionId: new ObjectId(collectionId),
    participants: [userId], // Store userId as string, not ObjectId
    method,
    status: 'active',
    deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
    visitDate,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('decisions').insertOne(decision);
  return { ...decision, _id: result.insertedId } as Decision;
}

/**
 * Create a new group decision
 */
export async function createGroupDecision(
  collectionId: string,
  groupId: string,
  participants: string[], // Array of user IDs
  method: 'random' | 'tiered' = 'tiered',
  visitDate: Date,
  deadlineHours: number = 24
): Promise<Decision> {
  const db = await connectToDatabase();
  const now = new Date();

  const decision: Omit<Decision, '_id'> = {
    type: 'group',
    collectionId: new ObjectId(collectionId),
    groupId: new ObjectId(groupId),
    participants, // Store user IDs as strings
    method,
    status: 'active',
    deadline: new Date(now.getTime() + deadlineHours * 60 * 60 * 1000),
    visitDate,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('decisions').insertOne(decision);
  return { ...decision, _id: result.insertedId } as Decision;
}

/**
 * Perform random selection with weighted algorithm
 */
export async function performRandomSelection(
  collectionId: string,
  userId: string,
  visitDate: Date
): Promise<DecisionResult> {
  const db = await connectToDatabase();

  // Get the collection and its restaurants
  const collection = await db
    .collection('collections')
    .findOne({ _id: new ObjectId(collectionId) });

  if (!collection) {
    throw new Error('Collection not found');
  }

  const restaurants = await getRestaurantsByCollection(collectionId);
  if (restaurants.length === 0) {
    throw new Error('No restaurants in collection');
  }

  // Get decision history for weight calculation
  const decisionHistory = await getDecisionHistory(collectionId);

  // Calculate weights for each restaurant
  const restaurantWeights: RestaurantWeight[] = restaurants.map(
    (restaurant) => {
      const weight = calculateRestaurantWeight(restaurant._id, decisionHistory);
      return {
        restaurantId: restaurant._id,
        weight,
        selectionCount: decisionHistory.filter(
          (d) => d.result?.restaurantId.toString() === restaurant._id.toString()
        ).length,
      };
    }
  );

  // Weighted random selection
  const totalWeight = restaurantWeights.reduce((sum, rw) => sum + rw.weight, 0);
  let randomValue = Math.random() * totalWeight;

  let selectedRestaurant: RestaurantWeight | null = null;
  for (const rw of restaurantWeights) {
    randomValue -= rw.weight;
    if (randomValue <= 0) {
      selectedRestaurant = rw;
      break;
    }
  }

  if (!selectedRestaurant) {
    // Fallback to last restaurant if something goes wrong
    selectedRestaurant = restaurantWeights[restaurantWeights.length - 1];
  }

  // Find the selected restaurant data for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _selectedRestaurantData = restaurants.find(
    (r) => r._id.toString() === selectedRestaurant!.restaurantId.toString()
  )!;

  // Create decision result
  const result: DecisionResult = {
    restaurantId: selectedRestaurant.restaurantId,
    selectedAt: new Date(),
    reasoning: `Selected using weighted random algorithm. Weight: ${selectedRestaurant.weight.toFixed(2)}, Previous selections: ${selectedRestaurant.selectionCount}`,
    weights: restaurantWeights.reduce(
      (acc, rw) => ({
        ...acc,
        [rw.restaurantId.toString()]: rw.weight,
      }),
      {}
    ),
  };

  // Create individual decision
  const decision: Omit<Decision, '_id'> = {
    type: 'personal',
    collectionId: new ObjectId(collectionId),
    participants: [userId],
    method: 'random',
    status: 'completed',
    deadline: new Date(),
    visitDate: visitDate,
    result: {
      restaurantId: result.restaurantId,
      selectedAt: result.selectedAt,
      reasoning: result.reasoning,
      weights: result.weights,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('decisions').insertOne(decision);

  return result;
}

/**
 * Get restaurants by collection (helper function)
 */
async function getRestaurantsByCollection(
  collectionId: string
): Promise<Restaurant[]> {
  const db = await connectToDatabase();
  const collection = await db
    .collection('collections')
    .findOne({ _id: new ObjectId(collectionId) });

  if (!collection) {
    return [];
  }

  // Extract restaurant IDs from the mixed format
  const restaurantIds = collection.restaurantIds
    .map(
      (
        item:
          | ObjectId
          | { _id: ObjectId; googlePlaceId: string }
          | { googlePlaceId: string }
          | string
      ) => {
        if (typeof item === 'string' || item instanceof ObjectId) {
          return item;
        } else if (item && typeof item === 'object' && '_id' in item) {
          return item._id;
        } else if (
          item &&
          typeof item === 'object' &&
          'googlePlaceId' in item
        ) {
          return item.googlePlaceId;
        }
        return null;
      }
    )
    .filter(
      (id: ObjectId | string | null): id is ObjectId | string => id !== null
    );

  if (restaurantIds.length === 0) {
    return [];
  }

  // Query restaurants by both _id and googlePlaceId
  const restaurants = await db
    .collection('restaurants')
    .find({
      $or: [
        {
          _id: {
            $in: restaurantIds.filter(
              (id: ObjectId | string): id is ObjectId => id instanceof ObjectId
            ),
          },
        },
        {
          googlePlaceId: {
            $in: restaurantIds.filter(
              (id: ObjectId | string): id is string => typeof id === 'string'
            ),
          },
        },
      ],
    })
    .toArray();

  return restaurants as Restaurant[];
}

/**
 * Get decision statistics for a collection
 */
export async function getDecisionStatistics(collectionId: string): Promise<{
  totalDecisions: number;
  restaurantStats: Array<{
    restaurantId: ObjectId;
    name: string;
    selectionCount: number;
    lastSelected?: Date;
    currentWeight: number;
  }>;
}> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _db = await connectToDatabase();
  const decisionHistory = await getDecisionHistory(collectionId);
  const restaurants = await getRestaurantsByCollection(collectionId);

  const restaurantStats = restaurants.map((restaurant) => {
    const selections = decisionHistory.filter(
      (d) => d.result?.restaurantId.toString() === restaurant._id.toString()
    );
    const lastSelected =
      selections.length > 0 ? selections[0].result?.selectedAt : undefined;
    const currentWeight = calculateRestaurantWeight(
      restaurant._id,
      decisionHistory
    );

    return {
      restaurantId: restaurant._id,
      name: restaurant.name,
      selectionCount: selections.length,
      lastSelected,
      currentWeight,
    };
  });

  return {
    totalDecisions: decisionHistory.length,
    restaurantStats,
  };
}

/**
 * Submit a vote for a tiered group decision
 */
export async function submitGroupVote(
  decisionId: string,
  userId: string,
  rankings: string[] // Array of restaurant IDs in order of preference
): Promise<{ success: boolean; message: string }> {
  const db = await connectToDatabase();
  const now = new Date();

  // Get the decision
  const decision = await db
    .collection('decisions')
    .findOne({ _id: new ObjectId(decisionId) });

  if (!decision) {
    throw new Error('Decision not found');
  }

  if (decision.type !== 'group') {
    throw new Error('This is not a group decision');
  }

  if (!decision.participants.includes(userId)) {
    throw new Error('User is not a participant in this decision');
  }

  if (decision.status !== 'active') {
    throw new Error('Decision is no longer active');
  }

  if (new Date() > decision.deadline) {
    throw new Error('Decision deadline has passed');
  }

  // Check if user has already voted
  const existingVote = decision.votes?.find(
    (vote: { userId: string }) => vote.userId === userId
  );

  if (existingVote) {
    // Update existing vote
    await db.collection('decisions').updateOne(
      { _id: new ObjectId(decisionId), 'votes.userId': userId },
      {
        $set: {
          'votes.$.rankings': rankings.map((id) => new ObjectId(id)),
          'votes.$.submittedAt': now,
          updatedAt: now,
        },
      }
    );
  } else {
    // Add new vote
    await db
      .collection('decisions')
      .updateOne({ _id: new ObjectId(decisionId) }, {
        $push: {
          votes: {
            userId,
            rankings: rankings.map((id) => new ObjectId(id)),
            submittedAt: now,
          },
        },
        $set: {
          updatedAt: now,
        },
      } as Record<string, unknown>);
  }

  return { success: true, message: 'Vote submitted successfully' };
}

/**
 * Calculate consensus from tiered votes
 */
export function calculateTieredConsensus(
  votes: { userId: string; rankings: ObjectId[]; submittedAt: Date }[],
  restaurants: Restaurant[]
): {
  winner: Restaurant | null;
  reasoning: string;
  voteBreakdown: Record<
    string,
    { first: number; second: number; third: number; total: number }
  >;
} {
  if (votes.length === 0) {
    return { winner: null, reasoning: 'No votes submitted', voteBreakdown: {} };
  }

  // Create a scoring system: 1st choice = 3 points, 2nd choice = 2 points, 3rd choice = 1 point
  const scores: { [restaurantId: string]: number } = {};
  const voteBreakdown: {
    [restaurantId: string]: {
      first: number;
      second: number;
      third: number;
      total: number;
    };
  } = {};

  // Initialize scores and breakdown
  restaurants.forEach((restaurant) => {
    const id = restaurant._id.toString();
    scores[id] = 0;
    voteBreakdown[id] = { first: 0, second: 0, third: 0, total: 0 };
  });

  // Calculate scores from votes
  votes.forEach((vote) => {
    vote.rankings.forEach((restaurantId, index) => {
      const id = restaurantId.toString();
      const points = index === 0 ? 3 : index === 1 ? 2 : 1;
      scores[id] += points;

      if (index < 3) {
        if (index === 0) voteBreakdown[id].first++;
        else if (index === 1) voteBreakdown[id].second++;
        else if (index === 2) voteBreakdown[id].third++;
        voteBreakdown[id].total += points;
      }
    });
  });

  // Find the winner
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const winnerId = sortedScores[0][0];
  const winnerScore = sortedScores[0][1];

  // Check for ties
  const tiedScores = sortedScores.filter(([, score]) => score === winnerScore);

  let winner: Restaurant | null = null;
  let reasoning: string;

  if (tiedScores.length === 1) {
    winner = restaurants.find((r) => r._id.toString() === winnerId) || null;
    reasoning = `Clear winner with ${winnerScore} points (${votes.length} votes total)`;
  } else {
    // Handle tie - select randomly from tied restaurants
    const tiedRestaurantIds = tiedScores.map(([id]) => id);
    const randomIndex = Math.floor(Math.random() * tiedRestaurantIds.length);
    const selectedId = tiedRestaurantIds[randomIndex];
    winner = restaurants.find((r) => r._id.toString() === selectedId) || null;
    reasoning = `Tie between ${tiedScores.length} restaurants with ${winnerScore} points each. Selected ${winner?.name || 'unknown'} randomly.`;
  }

  return { winner, reasoning, voteBreakdown };
}

/**
 * Close a group decision without completing it
 */
export async function closeGroupDecision(
  decisionId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const db = await connectToDatabase();
  const now = new Date();

  // Get the decision
  const decision = await db
    .collection('decisions')
    .findOne({ _id: new ObjectId(decisionId) });

  if (!decision) {
    throw new Error('Decision not found');
  }

  if (decision.type !== 'group') {
    throw new Error('This is not a group decision');
  }

  if (decision.status !== 'active') {
    throw new Error('Decision is not active');
  }

  // Check if user is an admin of the group
  const group = await db
    .collection('groups')
    .findOne({ _id: new ObjectId(decision.groupId) });

  if (!group) {
    throw new Error('Group not found');
  }

  const isAdmin = group.adminIds.some(
    (adminId: ObjectId) => adminId.toString() === userId
  );

  if (!isAdmin) {
    throw new Error('Only group admins can close decisions');
  }

  // Update the decision status to closed
  await db.collection('decisions').updateOne(
    { _id: new ObjectId(decisionId) },
    {
      $set: {
        status: 'closed',
        updatedAt: now,
      },
    }
  );

  return { success: true, message: 'Decision closed successfully' };
}

/**
 * Complete a tiered group decision
 */
export async function completeTieredGroupDecision(
  decisionId: string
): Promise<DecisionResult> {
  const db = await connectToDatabase();
  const now = new Date();

  // Get the decision with votes
  const decision = await db
    .collection('decisions')
    .findOne({ _id: new ObjectId(decisionId) });

  if (!decision) {
    throw new Error('Decision not found');
  }

  if (decision.type !== 'group') {
    throw new Error('This is not a group decision');
  }

  if (decision.method !== 'tiered') {
    throw new Error('This is not a tiered decision');
  }

  if (!decision.votes || decision.votes.length === 0) {
    throw new Error('No votes submitted');
  }

  // Get restaurants for this collection
  const restaurants = await getRestaurantsByCollection(
    decision.collectionId.toString()
  );

  if (restaurants.length === 0) {
    throw new Error('No restaurants in collection');
  }

  // Calculate consensus
  const { winner, reasoning, voteBreakdown } = calculateTieredConsensus(
    decision.votes,
    restaurants
  );

  if (!winner) {
    throw new Error('Unable to determine winner');
  }

  // Create decision result
  const weights: Record<string, number> = {};
  Object.entries(voteBreakdown).forEach(([restaurantId, breakdown]) => {
    weights[restaurantId] = breakdown.total;
  });

  const result: DecisionResult = {
    restaurantId: winner._id,
    selectedAt: now,
    reasoning,
    weights,
  };

  // Update the decision with the result
  await db.collection('decisions').updateOne(
    { _id: new ObjectId(decisionId) },
    {
      $set: {
        result: {
          restaurantId: result.restaurantId,
          selectedAt: result.selectedAt,
          reasoning: result.reasoning,
          weights: result.weights,
        },
        status: 'completed',
        updatedAt: now,
      },
    }
  );

  return result;
}

/**
 * Perform random selection for group collections
 */
export async function performGroupRandomSelection(
  collectionId: string,
  groupId: string,
  participants: string[],
  visitDate: Date
): Promise<DecisionResult> {
  const db = await connectToDatabase();

  // Get the collection and its restaurants
  const collection = await db
    .collection('collections')
    .findOne({ _id: new ObjectId(collectionId) });

  if (!collection) {
    throw new Error('Collection not found');
  }

  const restaurants = await getRestaurantsByCollection(collectionId);
  if (restaurants.length === 0) {
    throw new Error('No restaurants in collection');
  }

  // Get decision history for this group collection (for weight calculation)
  const decisionHistory = (await db
    .collection('decisions')
    .find({
      collectionId: new ObjectId(collectionId),
      type: 'group',
      groupId: new ObjectId(groupId),
      status: 'completed',
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()) as Decision[];

  // Calculate weights for each restaurant
  const restaurantWeights: RestaurantWeight[] = restaurants.map(
    (restaurant) => {
      const weight = calculateRestaurantWeight(restaurant._id, decisionHistory);
      return {
        restaurantId: restaurant._id,
        weight,
        selectionCount: decisionHistory.filter(
          (d) => d.result?.restaurantId.toString() === restaurant._id.toString()
        ).length,
      };
    }
  );

  // Weighted random selection
  const totalWeight = restaurantWeights.reduce((sum, rw) => sum + rw.weight, 0);
  let randomValue = Math.random() * totalWeight;

  let selectedRestaurant: RestaurantWeight | null = null;
  for (const rw of restaurantWeights) {
    randomValue -= rw.weight;
    if (randomValue <= 0) {
      selectedRestaurant = rw;
      break;
    }
  }

  if (!selectedRestaurant) {
    // Fallback to last restaurant if something goes wrong
    selectedRestaurant = restaurantWeights[restaurantWeights.length - 1];
  }

  // Create decision result
  const result: DecisionResult = {
    restaurantId: selectedRestaurant.restaurantId,
    selectedAt: new Date(),
    reasoning: `Selected using weighted random algorithm for group. Weight: ${selectedRestaurant.weight.toFixed(2)}, Previous selections: ${selectedRestaurant.selectionCount}`,
    weights: restaurantWeights.reduce(
      (acc, rw) => ({
        ...acc,
        [rw.restaurantId.toString()]: rw.weight,
      }),
      {}
    ),
  };

  // Create the group decision
  const decision = await createGroupDecision(
    collectionId,
    groupId,
    participants,
    'random',
    visitDate
  );

  // Update the decision with the result
  await db.collection('decisions').updateOne(
    { _id: decision._id },
    {
      $set: {
        result: {
          restaurantId: result.restaurantId,
          selectedAt: result.selectedAt,
          reasoning: result.reasoning,
          weights: result.weights,
        },
        status: 'completed',
        updatedAt: new Date(),
      },
    }
  );

  return result;
}

/**
 * Get group decision details
 */
export async function getGroupDecision(
  decisionId: string
): Promise<Decision | null> {
  const db = await connectToDatabase();
  const decision = await db
    .collection('decisions')
    .findOne({ _id: new ObjectId(decisionId) });

  return decision as Decision | null;
}

/**
 * Get active group decisions for a group
 */
export async function getActiveGroupDecisions(
  groupId: string
): Promise<Decision[]> {
  const db = await connectToDatabase();
  const decisions = await db
    .collection('decisions')
    .find({
      groupId: new ObjectId(groupId),
      type: 'group',
      // Get all decisions regardless of status (active, completed, closed)
    })
    .sort({ createdAt: -1 })
    .toArray();

  return decisions as Decision[];
}
