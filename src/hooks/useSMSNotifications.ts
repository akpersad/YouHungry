'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface SMSSendOptions {
  action:
    | 'test'
    | 'group_decision'
    | 'friend_request'
    | 'group_invitation'
    | 'admin_alert'
    | 'custom';
  phoneNumber?: string;
  message?: string;
  groupName?: string;
  decisionType?: 'tiered' | 'random';
  deadline?: Date | string;
  groupId?: string;
  alertType?: 'cost_spike' | 'system_failure' | 'circuit_breaker';
  details?: string;
}

export interface SMSServiceStatus {
  configured: boolean;
  fromNumber?: string;
  messagingServiceSid?: string;
  accountSid?: string;
  hasPhoneNumber?: boolean;
  hasMessagingService?: boolean;
  message: string;
}

export function useSMSNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendSMS = useCallback(async (options: SMSSendOptions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      logger.info('SMS sent successfully:', data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send SMS';
      setError(errorMessage);
      logger.error('SMS send error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTestSMS = useCallback(async () => {
    return sendSMS({ action: 'test' });
  }, [sendSMS]);

  const sendGroupDecisionSMS = useCallback(
    async (
      phoneNumber: string,
      groupName: string,
      decisionType: 'tiered' | 'random',
      deadline: Date,
      groupId?: string
    ) => {
      return sendSMS({
        action: 'group_decision',
        phoneNumber,
        groupName,
        decisionType,
        deadline: deadline.toISOString(),
        groupId,
      });
    },
    [sendSMS]
  );

  const sendFriendRequestSMS = useCallback(
    async (phoneNumber: string, requesterName: string) => {
      return sendSMS({
        action: 'friend_request',
        phoneNumber,
        message: requesterName,
      });
    },
    [sendSMS]
  );

  const sendGroupInvitationSMS = useCallback(
    async (phoneNumber: string, groupName: string, inviterName: string) => {
      return sendSMS({
        action: 'group_invitation',
        phoneNumber,
        groupName,
        message: inviterName,
      });
    },
    [sendSMS]
  );

  const getSMSStatus = useCallback(async (): Promise<SMSServiceStatus> => {
    try {
      const response = await fetch('/api/sms');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get SMS status');
      }

      return data;
    } catch (err) {
      logger.error('SMS status error:', err);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    sendSMS,
    sendTestSMS,
    sendGroupDecisionSMS,
    sendFriendRequestSMS,
    sendGroupInvitationSMS,
    getSMSStatus,
    clearError: () => setError(null),
  };
}
