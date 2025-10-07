import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getActiveGroupDecisions, getGroupDecision } from '@/lib/decisions';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
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
              const transformedDecisions = decisions.map((decision) => ({
                id: decision._id.toString(),
                type: decision.type,
                collectionId: decision.collectionId.toString(),
                groupId: decision.groupId?.toString(),
                method: decision.method,
                status: decision.status,
                deadline: decision.deadline.toISOString(),
                visitDate: decision.visitDate.toISOString(),
                participants: decision.participants,
                votes: decision.votes?.map((vote) => ({
                  userId: vote.userId,
                  submittedAt: vote.submittedAt.toISOString(),
                  hasRankings: vote.rankings.length > 0,
                })),
                result: decision.result
                  ? {
                      restaurantId: decision.result.restaurantId.toString(),
                      selectedAt: decision.result.selectedAt.toISOString(),
                      reasoning: decision.result.reasoning,
                    }
                  : null,
                createdAt: decision.createdAt.toISOString(),
                updatedAt: decision.updatedAt.toISOString(),
              }));
              sendData({ type: 'groupDecisions', data: transformedDecisions });
            }
            if (decisionId) {
              const decision = await getGroupDecision(decisionId);
              if (decision) {
                const transformedDecision = {
                  id: decision._id.toString(),
                  type: decision.type,
                  collectionId: decision.collectionId.toString(),
                  groupId: decision.groupId?.toString(),
                  method: decision.method,
                  status: decision.status,
                  deadline: decision.deadline.toISOString(),
                  visitDate: decision.visitDate.toISOString(),
                  participants: decision.participants,
                  votes: decision.votes?.map((vote) => ({
                    userId: vote.userId,
                    submittedAt: vote.submittedAt.toISOString(),
                    hasRankings: vote.rankings.length > 0,
                  })),
                  result: decision.result
                    ? {
                        restaurantId: decision.result.restaurantId.toString(),
                        selectedAt: decision.result.selectedAt.toISOString(),
                        reasoning: decision.result.reasoning,
                      }
                    : null,
                  createdAt: decision.createdAt.toISOString(),
                  updatedAt: decision.updatedAt.toISOString(),
                };
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
              const transformedDecisions = decisions.map((decision) => ({
                id: decision._id.toString(),
                type: decision.type,
                collectionId: decision.collectionId.toString(),
                groupId: decision.groupId?.toString(),
                method: decision.method,
                status: decision.status,
                deadline: decision.deadline.toISOString(),
                visitDate: decision.visitDate.toISOString(),
                participants: decision.participants,
                votes: decision.votes?.map((vote) => ({
                  userId: vote.userId,
                  submittedAt: vote.submittedAt.toISOString(),
                  hasRankings: vote.rankings.length > 0,
                })),
                result: decision.result
                  ? {
                      restaurantId: decision.result.restaurantId.toString(),
                      selectedAt: decision.result.selectedAt.toISOString(),
                      reasoning: decision.result.reasoning,
                    }
                  : null,
                createdAt: decision.createdAt.toISOString(),
                updatedAt: decision.updatedAt.toISOString(),
              }));
              sendData({ type: 'groupDecisions', data: transformedDecisions });
            }
            if (decisionId) {
              const decision = await getGroupDecision(decisionId);
              if (decision) {
                const transformedDecision = {
                  id: decision._id.toString(),
                  type: decision.type,
                  collectionId: decision.collectionId.toString(),
                  groupId: decision.groupId?.toString(),
                  method: decision.method,
                  status: decision.status,
                  deadline: decision.deadline.toISOString(),
                  visitDate: decision.visitDate.toISOString(),
                  participants: decision.participants,
                  votes: decision.votes?.map((vote) => ({
                    userId: vote.userId,
                    submittedAt: vote.submittedAt.toISOString(),
                    hasRankings: vote.rankings.length > 0,
                  })),
                  result: decision.result
                    ? {
                        restaurantId: decision.result.restaurantId.toString(),
                        selectedAt: decision.result.selectedAt.toISOString(),
                        reasoning: decision.result.reasoning,
                      }
                    : null,
                  createdAt: decision.createdAt.toISOString(),
                  updatedAt: decision.updatedAt.toISOString(),
                };
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
