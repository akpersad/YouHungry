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
              sendData({ type: 'groupDecisions', data: decisions });
            }
            if (decisionId) {
              const decision = await getGroupDecision(decisionId);
              if (decision) {
                sendData({ type: 'decisionUpdate', data: decision });
              }
            }
          } catch (error) {
            console.error('Error sending initial data:', error);
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
              sendData({ type: 'groupDecisions', data: decisions });
            }
            if (decisionId) {
              const decision = await getGroupDecision(decisionId);
              if (decision) {
                sendData({ type: 'decisionUpdate', data: decision });
              }
            }
          } catch (error) {
            console.error('Error in periodic update:', error);
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
    console.error('SSE error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
