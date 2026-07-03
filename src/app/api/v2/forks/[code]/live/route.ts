import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { getV2User, participantFromUser } from '@/lib/v2/auth';
import { getSettledForkByCode, serializeFork } from '@/lib/v2/forks';

/**
 * GET /api/v2/forks/[code]/live — SSE stream of the serialized fork view.
 * Each poll goes through the settling read, so a quorum-less vote whose
 * timer runs out closes itself while people are watching — the stream IS
 * the auto-close mechanism (no cron). The stream ends one event after the
 * fork reaches a terminal state.
 */

const POLL_MS = 2500;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getV2User();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { code } = await params;

  const initial = await getSettledForkByCode(code);
  if (!initial) {
    return new Response('Fork not found', { status: 404 });
  }

  const viewer = participantFromUser(user);
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
          const view = serializeFork(fork, viewer);
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
