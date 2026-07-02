import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { getV2Db } from '@/lib/v2/db';
import { getPlacesByIds } from '@/lib/v2/places';
import { placeSummary, v2ErrorResponse } from '@/lib/v2/http';
import { objectIdString } from '@/lib/v2/validation';

/**
 * GET /api/v2/lists/[id] — one list with its places resolved, for the
 * creation flow's option review. Owner-gated.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    const { id } = await params;
    const listId = new ObjectId(objectIdString.parse(id));

    const { lists } = await getV2Db();
    const list = await lists.findOne({ _id: listId, ownerId: user._id });
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const places = await getPlacesByIds(list.placeIds);
    return NextResponse.json({
      list: {
        id: list._id.toString(),
        name: list.name,
        places: places.map(placeSummary),
      },
    });
  } catch (error) {
    return v2ErrorResponse('lists:get', error);
  }
}
