import type { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { v2ErrorResponse } from '@/lib/v2/http';
import { createList, getListsForUser } from '@/lib/v2/lists';
import { createListSchema } from '@/lib/v2/validation';
import type { ListDoc } from '@/lib/v2/schema';

/**
 * The caller's lists — their own plus shared-with-them. GET feeds the
 * fork-creation source picker and the Places lane; POST starts a new
 * (empty) list — places arrive via /api/v2/lists/[id]/places.
 */

function listSummary(list: ListDoc, viewerId: ObjectId) {
  return {
    id: list._id.toString(),
    name: list.name,
    placeCount: list.placeIds.length,
    role:
      list.ownerId.toString() === viewerId.toString()
        ? ('owner' as const)
        : ('collaborator' as const),
  };
}

export async function GET() {
  try {
    const user = await requireV2User();
    const docs = await getListsForUser(user._id);
    return NextResponse.json({
      lists: docs.map((doc) => listSummary(doc, user._id)),
    });
  } catch (error) {
    return v2ErrorResponse('lists:list', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();
    const input = createListSchema.parse(await request.json());
    const list = await createList(user._id, input.name);
    return NextResponse.json(
      { list: listSummary(list, user._id) },
      { status: 201 }
    );
  } catch (error) {
    return v2ErrorResponse('lists:create', error);
  }
}
