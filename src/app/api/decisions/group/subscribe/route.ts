import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getActiveGroupDecisions,
  getGroupDecision,
  serializeGroupDecision,
} from '@/lib/decisions';
import { isGroupMemberOrAdmin } from '@/lib/groups';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const decisionId = searchParams.get('decisionId');

    if (!groupId && !decisionId) {
      return new Response('Group ID or Decision ID is required', {
        status: 400,
      });
    }

    // SECURITY: only group members may subscribe to a group's decision stream
    const userId = user._id.toString();
    if (groupId) {
      const isMember = await isGroupMemberOrAdmin(groupId, userId);
      if (!isMember) {
        return new Response('Forbidden', { status: 403 });
      }
    }
    if (decisionId) {
      const decision = await getGroupDecision(decisionId);
      if (!decision) {
        return new Response('Decision not found', { status: 404 });
      }
      // Group decision participants are stored as Mongo ObjectId strings
      const isParticipant = decision.participants?.includes(userId);
      const isMember = decision.groupId
        ? await isGroupMemberOrAdmin(decision.groupId.toString(), userId)
        : false;
      if (!isParticipant && !isMember) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial data
        const sendData = (data: Record<string, unknown>) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Send keep-alive message
        const keepAlive = setInterval(() => {
          sendData({ type: 'ping', timestamp: new Date().toISOString() });
        }, 30000); // Every 30 seconds

        // Send initial data
        const sendInitialData = async () => {
          try {
            if (groupId) {
              const decisions = await getActiveGroupDecisions(groupId);
              const transformedDecisions = decisions.map((decision) =>
                serializeGroupDecision(decision, userId)
              );
              sendData({ type: 'groupDecisions', data: transformedDecisions });
            }
            if (decisionId) {
              const decision = await getGroupDecision(decisionId);
              if (decision) {
                const transformedDecision = serializeGroupDecision(
                  decision,
                  userId
                );
                sendData({ type: 'decisionUpdate', data: transformedDecision });
              }
            }
          } catch (error) {
            logger.error('Error sending initial data:', error);
            sendData({ type: 'error', message: 'Failed to load data' });
          }
        };

        sendInitialData();

        // Cleanup function
        const cleanup = () => {
          clearInterval(keepAlive);
          controller.close();
        };

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup);

        // Set up periodic updates (every 5 seconds)
        const updateInterval = setInterval(async () => {
          try {
            if (groupId) {
              const decisions = await getActiveGroupDecisions(groupId);
              const transformedDecisions = decisions.map((decision) =>
                serializeGroupDecision(decision, userId)
              );
              sendData({ type: 'groupDecisions', data: transformedDecisions });
            }
            if (decisionId) {
              const decision = await getGroupDecision(decisionId);
              if (decision) {
                const transformedDecision = serializeGroupDecision(
                  decision,
                  userId
                );
                sendData({ type: 'decisionUpdate', data: transformedDecision });
              }
            }
          } catch (error) {
            logger.error('Error in periodic update:', error);
          }
        }, 5000);

        // Cleanup on close
        const cleanupAll = () => {
          clearInterval(keepAlive);
          clearInterval(updateInterval);
          controller.close();
        };

        // Handle cleanup
        request.signal.addEventListener('abort', cleanupAll);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    logger.error('SSE error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
