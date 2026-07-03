import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { placeSummary, v2ErrorResponse } from '@/lib/v2/http';
import { deleteList, getListWithPlaces, renameList } from '@/lib/v2/lists';
import { objectIdString, renameListSchema } from '@/lib/v2/validation';

/**
 * One list. GET resolves its places (creation-flow option review + the
 * Places lane detail); PATCH renames; DELETE removes the list — places
 * themselves live in the shared cache and are untouched. All owner-gated
 * inside the lib layer (a foreign id 404s like a missing one).
 */

async function listIdFrom(params: Promise<{ id: string }>): Promise<ObjectId> {
  const { id } = await params;
  return new ObjectId(objectIdString.parse(id));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    const { list, places } = await getListWithPlaces(
      user._id,
      await listIdFrom(params)
    );
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    const input = renameListSchema.parse(await request.json());
    const list = await renameList(
      user._id,
      await listIdFrom(params),
      input.name
    );
    return NextResponse.json({
      list: {
        id: list._id.toString(),
        name: list.name,
        placeCount: list.placeIds.length,
      },
    });
  } catch (error) {
    return v2ErrorResponse('lists:rename', error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    await deleteList(user._id, await listIdFrom(params));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return v2ErrorResponse('lists:delete', error);
  }
}
