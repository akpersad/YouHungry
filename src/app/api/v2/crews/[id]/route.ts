import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { requireV2User } from '@/lib/v2/auth';
import { getCrewView, renameCrew } from '@/lib/v2/crews';
import { v2ErrorResponse } from '@/lib/v2/http';
import { objectIdString, renameCrewSchema } from '@/lib/v2/validation';

/**
 * One crew, member-gated (a foreign crew id 404s like a missing one).
 * GET is the crew page payload: members, recent results, and the shared
 * weight board. PATCH renames — any member; the crew belongs to the crew.
 */

async function crewIdFrom(params: Promise<{ id: string }>): Promise<ObjectId> {
  const { id } = await params;
  return new ObjectId(objectIdString.parse(id));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    const crew = await getCrewView(await crewIdFrom(params), user._id);
    return NextResponse.json({ crew });
  } catch (error) {
    return v2ErrorResponse('crews:get', error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireV2User();
    const input = renameCrewSchema.parse(await request.json());
    const crew = await renameCrew(
      await crewIdFrom(params),
      user._id,
      input.name
    );
    return NextResponse.json({
      crew: {
        id: crew._id.toString(),
        name: crew.name,
        memberCount: crew.memberIds.length,
      },
    });
  } catch (error) {
    return v2ErrorResponse('crews:rename', error);
  }
}
