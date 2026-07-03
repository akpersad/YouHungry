import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { removePlaceFromList } from '@/lib/v2/lists';
import { objectIdString } from '@/lib/v2/validation';

/**
 * DELETE /api/v2/lists/[id]/places/[placeId] — take a place off the list.
 * Idempotent; the place stays in the shared cache. Owner-gated in the lib
 * layer.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; placeId: string }> }
) {
  try {
    const user = await requireV2User();
    const { id, placeId } = await params;

    const list = await removePlaceFromList(
      user._id,
      new ObjectId(objectIdString.parse(id)),
      new ObjectId(objectIdString.parse(placeId))
    );
    return NextResponse.json({
      list: {
        id: list._id.toString(),
        name: list.name,
        placeCount: list.placeIds.length,
      },
    });
  } catch (error) {
    return v2ErrorResponse('lists:remove-place', error);
  }
}
