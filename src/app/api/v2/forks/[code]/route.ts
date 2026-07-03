import { NextRequest, NextResponse } from 'next/server';
import { participantFromUser, requireV2User } from '@/lib/v2/auth';
import { getSettledForkByCode, serializeFork } from '@/lib/v2/forks';
import { v2ErrorResponse } from '@/lib/v2/http';

/**
 * GET /api/v2/forks/[code] — current fork state for a signed-in viewer.
 * Link-bearer semantics: knowing the (unguessable, ~49-bit) code is the
 * capability, matching how fork links travel through a group chat. Phase 4
 * extends this exact surface to guests with signed fork tokens.
 *
 * Reads settle overdue forks (lazy timer close) — a fork page left open
 * past `closesAt` resolves itself on the next fetch.
 */
export async function GET(
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

    return NextResponse.json({
      fork: serializeFork(fork, participantFromUser(user)),
    });
  } catch (error) {
    return v2ErrorResponse('forks:get', error);
  }
}
