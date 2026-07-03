import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, ipRateLimitKey } from '@/lib/rate-limit';
import { getSettledForkByCode, serializeFork } from '@/lib/v2/forks';
import { GUEST_COOKIE } from '@/lib/v2/guests';
import { resolveForkViewer } from '@/lib/v2/viewer';

/**
 * GET /api/v2/forks/[code]/live — SSE stream of the serialized fork view.
 * Link-bearer access like the sibling GET (Phase 4): guests and anonymous
 * watchers see the same aggregates a signed-in member does, never ballots.
 * Viewer identity is resolved once at connect; the fork token isn't needed
 * here (the stream is read-only — writes carry the token).
 *
 * Each poll goes through the settling read, so a quorum-less vote whose
 * timer runs out closes itself while people are watching — the stream IS
 * the auto-close mechanism (no cron). The stream ends one event after the
 * fork reaches a terminal state.
 */

const POLL_MS = 2500;

/** Streams are long-lived; reconnect churn beyond this is not a human. */
const CONNECTS_PER_IP_PER_MIN = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const rate = await checkRateLimit({
    key: ipRateLimitKey('v2-fork-live', request),
    limit: CONNECTS_PER_IP_PER_MIN,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return new Response('Too many requests', { status: 429 });
  }

  const viewer = await resolveForkViewer(
    request.cookies.get(GUEST_COOKIE)?.value
  );

  const initial = await getSettledForkByCode(code);
  if (!initial) {
    return new Response('Fork not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // Already closed by the runtime on abort.
        }
      };

      const send = (payload: unknown): boolean => {
        if (closed) return false;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
          return true;
        } catch {
          cleanup();
          return false;
        }
      };

      const pushState = async () => {
        try {
          const fork = await getSettledForkByCode(code);
          if (!fork) {
            send({ type: 'gone' });
            cleanup();
            return;
          }
          const view = serializeFork(
            fork,
            viewer.participant,
            viewer.claimedGuestIds
          );
          if (send({ type: 'fork', fork: view }) && view.status !== 'open') {
            cleanup();
          }
        } catch (error) {
          logger.error('v2 forks:live poll failed', { error });
        }
      };

      const timer = setInterval(pushState, POLL_MS);
      request.signal.addEventListener('abort', cleanup);
      void pushState();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
