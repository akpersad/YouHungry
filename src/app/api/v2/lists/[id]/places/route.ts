import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { savePlaceToList } from '@/lib/v2/lists';
import { objectIdString, savePlaceSchema } from '@/lib/v2/validation';

/**
 * POST /api/v2/lists/[id]/places — save a place to the list ("Keep this
 * one" from a result, or the save action in search). Idempotent: re-saving
 * is success. Owner-gated in the lib layer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    const { id } = await params;
    const listId = new ObjectId(objectIdString.parse(id));
    const input = savePlaceSchema.parse(await request.json());

    const list = await savePlaceToList(
      user._id,
      listId,
      new ObjectId(input.placeId)
    );
    return NextResponse.json({
      list: {
        id: list._id.toString(),
        name: list.name,
        placeCount: list.placeIds.length,
      },
    });
  } catch (error) {
    return v2ErrorResponse('lists:save-place', error);
  }
}
