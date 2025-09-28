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

  // FIXED: First create the decision, then update it with the result
  const decision = await createPersonalDecision(
    collectionId,
    userId,
    'random',
    visitDate
  );

  // Update the specific decision with the result
  await db.collection('decisions').updateOne(
    {
      _id: decision._id, // Use the specific decision ID
    },
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
