import { NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { getV2Db } from '@/lib/v2/db';
import { v2ErrorResponse } from '@/lib/v2/http';

/**
 * GET /api/v2/lists — the caller's lists, for the fork-creation source
 * picker. List CRUD proper is Phase 5; a fork only needs to read them.
 */
export async function GET() {
  try {
    const user = await requireV2User();
    const { lists } = await getV2Db();
    const docs = await lists
      .find({ ownerId: user._id })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      lists: docs.map((list) => ({
        id: list._id.toString(),
        name: list.name,
        placeCount: list.placeIds.length,
      })),
    });
  } catch (error) {
    return v2ErrorResponse('lists:list', error);
  }
}
