import { NextRequest, NextResponse } from 'next/server';
import { participantFromUser, requireV2User } from '@/lib/v2/auth';
import {
  getForkByCode,
  getSettledForkByCode,
  participantKey,
  serializeFork,
  spinFork,
} from '@/lib/v2/forks';
import { v2ErrorResponse } from '@/lib/v2/http';
import { enrichForkView } from '@/lib/v2/places';

/**
 * POST /api/v2/forks/[code]/spin — the organizer commits a spin fork to
 * fate. Organizer-only: a shared spin fork is "let fate decide", and the
 * person who owns the lifecycle pulls the lever.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireV2User();
    const { code } = await params;

    const fork = await getSettledForkByCode(code);
    if (!fork) {
      return NextResponse.json({ error: 'Fork not found' }, { status: 404 });
    }

    const viewer = participantFromUser(user);
    if (participantKey(fork.organizer) !== participantKey(viewer)) {
      return NextResponse.json(
        { error: 'Only the organizer can spin this fork' },
        { status: 403 }
      );
    }

    await spinFork(fork._id);
    const spun = await getForkByCode(code);

    return NextResponse.json({
      fork: await enrichForkView(serializeFork(spun ?? fork, viewer)),
    });
  } catch (error) {
    return v2ErrorResponse('forks:spin', error);
  }
}
