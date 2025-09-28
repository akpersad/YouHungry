import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();

    // Clear all restaurantIds from all collections
    const result = await db.collection('collections').updateMany(
      {},
      {
        $set: {
          restaurantIds: [],
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Cleared restaurantIds from ${result.modifiedCount} collections`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Clear collections error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear collections' },
      { status: 500 }
    );
  }
}
