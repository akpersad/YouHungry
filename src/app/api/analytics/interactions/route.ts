import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

interface UserInteraction {
  type: string;
  target: string;
  className: string;
  id: string;
  timestamp: number;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const interaction: UserInteraction = await request.json();

    // Validate required fields
    if (!interaction.timestamp || !interaction.url || !interaction.type) {
      return NextResponse.json(
        { error: 'Missing required fields: timestamp, url, type' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await connectToDatabase();

    // Store interaction in database
    await db.collection('user_interactions').insertOne({
      ...interaction,
      createdAt: new Date(),
      date: new Date(interaction.timestamp).toISOString().split('T')[0], // YYYY-MM-DD format
    });

    // Log interaction for debugging
    logger.debug('User interaction recorded:', {
      type: 'interaction',
      timestamp: new Date(interaction.timestamp).toISOString(),
      url: interaction.url,
      interactionType: interaction.type,
      target: interaction.target,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error storing user interaction:', error);
    return NextResponse.json(
      { error: 'Failed to store user interaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await connectToDatabase();

    // Build query
    const query: { date?: string } = {};
    if (date) {
      query.date = date;
    }
    if (type) {
      query.type = type;
    }

    // Get interactions
    const interactions = await db
      .collection('user_interactions')
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Calculate interaction statistics
    const stats = await calculateInteractionStats(db, query);

    return NextResponse.json({
      interactions,
      stats,
      total: interactions.length,
      hasMore: interactions.length === limit,
    });
  } catch (error) {
    logger.error('Error fetching user interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user interactions' },
      { status: 500 }
    );
  }
}

async function calculateInteractionStats(
  db: {
    collection: (name: string) => {
      find: (query: unknown) => { toArray: () => Promise<unknown[]> };
    };
  },
  query: { date?: string; type?: string }
) {
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: {
          type: '$type',
          target: '$target',
        },
        count: { $sum: 1 },
        lastInteraction: { $max: '$timestamp' },
      },
    },
    {
      $group: {
        _id: null,
        totalInteractions: { $sum: '$count' },
        uniqueTargets: { $sum: 1 },
        interactionsByType: {
          $push: {
            type: '$_id.type',
            target: '$_id.target',
            count: '$count',
            lastInteraction: '$lastInteraction',
          },
        },
      },
    },
  ];

  const result = await db
    .collection('user_interactions')
    .aggregate(pipeline)
    .toArray();

  if (result.length === 0) {
    return {
      totalInteractions: 0,
      uniqueTargets: 0,
      interactionsByType: [],
    };
  }

  const stats = result[0];

  // Sort interactions by count
  stats.interactionsByType.sort(
    (a: { count: number }, b: { count: number }) => b.count - a.count
  );

  return {
    totalInteractions: stats.totalInteractions,
    uniqueTargets: stats.uniqueTargets,
    interactionsByType: stats.interactionsByType,
  };
}
