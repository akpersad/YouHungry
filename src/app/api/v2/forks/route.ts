import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { participantFromUser, requireV2User } from '@/lib/v2/auth';
import { getV2Db } from '@/lib/v2/db';
import { createFork, getOpenForksForUser, serializeFork } from '@/lib/v2/forks';
import {
  getPlacesByIds,
  placeToOption,
  DEFAULT_RADIUS_M,
} from '@/lib/v2/places';
import { v2ErrorResponse } from '@/lib/v2/http';
import { createForkSchema } from '@/lib/v2/validation';
import type { ForkSource } from '@/lib/v2/schema';

/**
 * POST /api/v2/forks — organize a fork (account required per charter:
 * someone must own the lifecycle). GET returns the caller's open forks for
 * the lane home.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireV2User();
    const input = createForkSchema.parse(await request.json());

    const places = await getPlacesByIds(
      input.optionPlaceIds.map((id) => new ObjectId(id))
    );
    if (places.length !== input.optionPlaceIds.length) {
      return NextResponse.json(
        { error: 'One or more places no longer exist' },
        { status: 400 }
      );
    }

    // A list source must be the caller's own list — provenance is not a
    // place to reference somebody else's data (repo rule: mutations verify
    // ownership, not just authentication).
    if (input.source.kind === 'list') {
      const { lists } = await getV2Db();
      const owned = await lists.findOne({
        _id: new ObjectId(input.source.listId),
        ownerId: user._id,
      });
      if (!owned) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
      }
    }

    const source: ForkSource =
      input.source.kind === 'near-me'
        ? {
            kind: 'near-me',
            center: {
              type: 'Point',
              coordinates: [input.source.lng, input.source.lat],
            },
            radiusM: input.source.radiusM ?? DEFAULT_RADIUS_M,
            vibe: input.source.vibe,
          }
        : input.source.kind === 'list'
          ? { kind: 'list', listId: new ObjectId(input.source.listId) }
          : { kind: 'ad-hoc' };

    const organizer = participantFromUser(user);
    const fork = await createFork({
      organizer,
      source,
      mode: input.mode,
      options: places.map(placeToOption),
      // Quorum is a vote-mode concept; a spin has exactly one decider.
      quorum: input.mode === 'vote' ? input.quorum : undefined,
      closesAt: new Date(Date.now() + input.lifespanMinutes * 60 * 1000),
    });

    return NextResponse.json(
      { fork: serializeFork(fork, organizer) },
      { status: 201 }
    );
  } catch (error) {
    return v2ErrorResponse('forks:create', error);
  }
}

export async function GET() {
  try {
    const user = await requireV2User();
    const forks = await getOpenForksForUser(user._id);
    const viewer = participantFromUser(user);
    return NextResponse.json({
      forks: forks.map((fork) => serializeFork(fork, viewer)),
    });
  } catch (error) {
    return v2ErrorResponse('forks:list', error);
  }
}
