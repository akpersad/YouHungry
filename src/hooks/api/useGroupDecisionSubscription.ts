import { logger } from '@/lib/logger';
import { useEffect, useRef, useState } from 'react';

interface GroupDecision {
  id: string;
  type: 'personal' | 'group';
  collectionId: string;
  groupId?: string;
  method: 'tiered' | 'random';
  status: 'active' | 'completed' | 'expired';
  deadline: string;
  visitDate: string;
  participants: string[];
  votes?: Array<{
    userId: string;
    submittedAt: string;
    hasRankings: boolean;
  }>;
  result?: {
    restaurantId: string;
    selectedAt: string;
    reasoning: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionMessage {
  type: 'ping' | 'groupDecisions' | 'decisionUpdate' | 'error';
  data?: GroupDecision[] | GroupDecision;
  message?: string;
  timestamp?: string;
}

export function useGroupDecisionSubscription(
  groupId?: string,
  decisionId?: string,
  enabled: boolean = true
) {
  const [decisions, setDecisions] = useState<GroupDecision[]>([]);
  const [currentDecision, setCurrentDecision] = useState<GroupDecision | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || (!groupId && !decisionId)) {
      return;
    }

    // Create URL with parameters
    const params = new URLSearchParams();
    if (groupId) params.append('groupId', groupId);
    if (decisionId) params.append('decisionId', decisionId);

    const url = `/api/decisions/group/subscribe?${params.toString()}`;

    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SubscriptionMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'ping':
            // Keep-alive message, no action needed
            break;

          case 'groupDecisions':
            if (message.data && Array.isArray(message.data)) {
              setDecisions(message.data as GroupDecision[]);
            }
            break;

          case 'decisionUpdate':
            if (message.data && !Array.isArray(message.data)) {
              setCurrentDecision(message.data as GroupDecision);
            }
            break;

          case 'error':
            setError(message.message || 'Unknown error');
            break;
        }
      } catch (err) {
        logger.error('Error parsing SSE message:', err);
        setError('Failed to parse server message');
      }
    };

    eventSource.onerror = (event) => {
      logger.error('SSE connection error:', event);
      setIsConnected(false);
      setError('Connection lost. Attempting to reconnect...');

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource.close();
          // The useEffect will recreate the connection
        }
      }, 5000);
    };

    // Cleanup function
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, groupId, decisionId]);

  // Manual reconnection function
  const reconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setError(null);
    setIsConnected(false);
    // The useEffect will recreate the connection
  };

  return {
    decisions,
    currentDecision,
    isConnected,
    error,
    reconnect,
  };
}
