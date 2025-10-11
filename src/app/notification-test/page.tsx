'use client';

import { useState } from 'react';
import {
  useSMSNotifications,
  SMSServiceStatus,
} from '@/hooks/useSMSNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useURLShortener } from '@/hooks/useURLShortener';
import { ToastNotificationService } from '@/lib/toast-notifications';
// Removed direct import of notificationService to avoid server-side dependencies in client bundle
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import { logger } from '@/lib/logger';

export default function NotificationTestPage() {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // SMS notifications
  const {
    loading: smsLoading,
    error: smsError,
    sendTestSMS,
    sendGroupDecisionSMS,
    sendFriendRequestSMS,
    getSMSStatus,
  } = useSMSNotifications();

  // Push notifications
  const {
    status: pushStatus,
    loading: pushLoading,
    sendTestNotification,
    sendGroupDecisionNotification,
    sendFriendRequestNotification,
  } = usePushNotifications();

  // In-app notifications
  const { notifications, stats, markAsRead, markAllAsRead } =
    useInAppNotifications();

  // URL shortener
  const {
    loading: urlLoading,
    error: urlError,
    shortenUrl,
  } = useURLShortener();

  // Email notifications
  const { testEmail, validateConfig } = useEmailNotifications();

  const [smsStatus, setSmsStatus] = useState<SMSServiceStatus | null>(null);
  const [urlToShorten, setUrlToShorten] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');

  const handleSMSStatus = async () => {
    try {
      const status = await getSMSStatus();
      setSmsStatus(status);
      ToastNotificationService.info('SMS Status', {
        description: status.configured
          ? 'SMS service is configured'
          : 'SMS service not configured',
      });
    } catch {
      ToastNotificationService.error('Failed to get SMS status');
    }
  };

  const handleTestSMS = async () => {
    try {
      await sendTestSMS();
      ToastNotificationService.success('Test SMS sent', {
        description: 'Check the development phone number',
      });
    } catch {
      ToastNotificationService.error('Failed to send test SMS');
    }
  };

  const handleShortenUrl = async () => {
    if (!urlToShorten) {
      ToastNotificationService.error('Please enter a URL to shorten');
      return;
    }

    try {
      const result = await shortenUrl({ url: urlToShorten });
      if (result.success && result.shortUrl) {
        setShortenedUrl(result.shortUrl);
        ToastNotificationService.success('URL shortened successfully', {
          description: `Shortened: ${result.shortUrl}`,
        });
      } else {
        ToastNotificationService.error('Failed to shorten URL', {
          description: result.error,
        });
      }
    } catch {
      ToastNotificationService.error('Failed to shorten URL');
    }
  };

  const handleTestPush = async () => {
    try {
      await sendTestNotification();
      ToastNotificationService.success('Test push notification sent');
    } catch {
      ToastNotificationService.error('Failed to send test push notification');
    }
  };

  const handleTestGroupDecision = async () => {
    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 2);

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'group-decision',
          data: {
            groupName: 'Test Group',
            groupId: '507f1f77bcf86cd799439011',
            decisionId: '507f1f77bcf86cd799439012',
            decisionType: 'tiered',
            deadline,
          },
          options: {
            userId: '507f1f77bcf86cd799439013',
            smsEnabled: true,
            pushEnabled: true,
            inAppEnabled: true,
            toastEnabled: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send group decision notifications');
      }

      ToastNotificationService.success('Group decision notifications sent');
    } catch (error) {
      logger.error('Failed to send group decision notifications:', error);
      ToastNotificationService.error(
        'Failed to send group decision notifications'
      );
    }
  };

  const handleTestFriendRequest = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'friend-request',
          data: {
            requesterName: 'John Doe',
            requesterId: '507f1f77bcf86cd799439014',
          },
          options: {
            userId: '507f1f77bcf86cd799439013',
            smsEnabled: true,
            pushEnabled: true,
            inAppEnabled: true,
            toastEnabled: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send friend request notifications');
      }

      ToastNotificationService.success('Friend request notifications sent');
    } catch (error) {
      logger.error('Failed to send friend request notifications:', error);
      ToastNotificationService.error(
        'Failed to send friend request notifications'
      );
    }
  };

  const handleTestGroupInvitation = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'group-invitation',
          data: {
            groupName: 'Food Lovers',
            groupId: '507f1f77bcf86cd799439015',
            inviterName: 'Jane Smith',
            inviterId: '507f1f77bcf86cd799439016',
          },
          options: {
            userId: '507f1f77bcf86cd799439013',
            smsEnabled: true,
            pushEnabled: true,
            inAppEnabled: true,
            toastEnabled: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send group invitation notifications');
      }

      ToastNotificationService.success('Group invitation notifications sent');
    } catch (error) {
      logger.error('Failed to send group invitation notifications:', error);
      ToastNotificationService.error(
        'Failed to send group invitation notifications'
      );
    }
  };

  const handleTestDecisionResult = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'decision-result',
          data: {
            groupName: 'Test Group',
            groupId: '507f1f77bcf86cd799439011',
            decisionId: '507f1f77bcf86cd799439012',
            restaurantName: 'Pizza Palace',
            restaurantId: '507f1f77bcf86cd799439017',
          },
          options: {
            userId: '507f1f77bcf86cd799439013',
            smsEnabled: true,
            pushEnabled: true,
            inAppEnabled: true,
            toastEnabled: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send decision result notifications');
      }

      ToastNotificationService.success('Decision result notifications sent');
    } catch (error) {
      logger.error('Failed to send decision result notifications:', error);
      ToastNotificationService.error(
        'Failed to send decision result notifications'
      );
    }
  };

  const handleToastSuccess = () => {
    ToastNotificationService.success('Success notification', {
      description: 'This is a success toast notification',
    });
  };

  const handleToastError = () => {
    ToastNotificationService.error('Error notification', {
      description: 'This is an error toast notification',
    });
  };

  const handleToastInfo = () => {
    ToastNotificationService.info('Info notification', {
      description: 'This is an info toast notification',
    });
  };

  const handleToastWarning = () => {
    ToastNotificationService.warning('Warning notification', {
      description: 'This is a warning toast notification',
    });
  };

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">
              Notification Test Center
            </h1>
            <p className="text-text-light">
              Test all notification systems: SMS, Push, In-App, and Toast
            </p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              onClick={() => setShowNotificationPanel(true)}
              size="lg"
            />
            <Badge
              variant={stats.unreadCount > 0 ? 'destructive' : 'secondary'}
            >
              {stats.unreadCount} unread
            </Badge>
          </div>
        </div>

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={showNotificationPanel}
          onClose={() => setShowNotificationPanel(false)}
        />

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <h3 className="font-semibold text-text">SMS Notifications</h3>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-text-light">
                Status:{' '}
                {smsLoading ? 'Loading...' : smsError ? 'Error' : 'Ready'}
              </div>
              {smsStatus && (
                <div className="space-y-1 text-xs text-text-light">
                  <div>Account SID: {smsStatus.accountSid || 'Not set'}</div>
                  <div>Phone Number: {smsStatus.fromNumber || 'Not set'}</div>
                  <div>
                    Messaging Service:{' '}
                    {smsStatus.messagingServiceSid || 'Not set'}
                  </div>
                  <div className="flex gap-2">
                    {smsStatus.hasPhoneNumber && (
                      <Badge variant="secondary">Phone</Badge>
                    )}
                    {smsStatus.hasMessagingService && (
                      <Badge variant="secondary">Service</Badge>
                    )}
                  </div>
                </div>
              )}
              <Button
                onClick={handleSMSStatus}
                variant="outline"
                size="sm"
                disabled={smsLoading}
              >
                Check Status
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-text">Push Notifications</h3>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-text-light">
                Status: {pushStatus.supported ? 'Supported' : 'Not Supported'}
              </div>
              <div className="text-sm text-text-light">
                Permission: {pushStatus.permission}
              </div>
              <div className="text-sm text-text-light">
                Subscribed: {pushStatus.subscribed ? 'Yes' : 'No'}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-text">In-App Notifications</h3>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-text-light">
                Total: {stats.total}
              </div>
              <div className="text-sm text-text-light">
                Unread: {stats.unreadCount}
              </div>
              {stats.unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm">
                  Mark All Read
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-text">Email Notifications</h3>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-text-light">
                Status:{' '}
                {validateConfig.isLoading
                  ? 'Checking...'
                  : validateConfig.isError
                    ? 'Error'
                    : validateConfig.data?.valid
                      ? 'Configured'
                      : 'Not Configured'}
              </div>
              {validateConfig.data?.error && (
                <div className="text-xs text-destructive">
                  {validateConfig.data.error}
                </div>
              )}
              <div className="flex gap-2">
                {validateConfig.data?.valid && (
                  <Badge variant="secondary">Resend API</Badge>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* SMS Tests */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-text">
            SMS Notification Tests
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={handleTestSMS}
              disabled={smsLoading}
              className="w-full"
            >
              {smsLoading ? 'Sending...' : 'Send Test SMS'}
            </Button>

            <Button
              onClick={() =>
                sendGroupDecisionSMS(
                  '+18777804236',
                  'Test Group',
                  'tiered',
                  new Date(Date.now() + 2 * 60 * 60 * 1000),
                  '507f1f77bcf86cd799439011' // Test group ID for URL shortening
                )
              }
              disabled={smsLoading}
              variant="outline"
              className="w-full"
            >
              Group Decision SMS (with URL)
            </Button>

            <Button
              onClick={() => sendFriendRequestSMS('+18777804236', 'John Doe')}
              disabled={smsLoading}
              variant="outline"
              className="w-full"
            >
              Friend Request SMS
            </Button>
          </div>
        </Card>

        {/* URL Shortener Tests */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-text">
            URL Shortener Tests
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                URL to Shorten
              </label>
              <input
                type="url"
                value={urlToShorten}
                onChange={(e) => setUrlToShorten(e.target.value)}
                placeholder="https://example.com/very/long/url"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              onClick={handleShortenUrl}
              disabled={urlLoading || !urlToShorten}
              className="w-full"
            >
              {urlLoading ? 'Shortening...' : 'Shorten URL'}
            </Button>

            {shortenedUrl && (
              <div className="p-3 bg-success/10 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Shortened URL:</strong>
                </p>
                <p className="text-sm text-green-700 break-all">
                  {shortenedUrl}
                </p>
              </div>
            )}

            {urlError && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {urlError}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Email Notification Tests */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-text">
            Email Notification Tests
          </h2>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  placeholder="test@example.com"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="test@example.com"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    const emailInput = document.querySelector(
                      'input[type="email"]'
                    ) as HTMLInputElement;
                    const email = emailInput?.value || 'test@example.com';
                    testEmail.mutate({ email });
                  }}
                  disabled={testEmail.isLoading}
                  className="w-full"
                >
                  {testEmail.isLoading ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </div>

            {testEmail.isSuccess && (
              <div className="p-3 bg-success/10 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Success:</strong> {testEmail.data?.message}
                </p>
                {testEmail.data?.emailId && (
                  <p className="text-xs text-success mt-1">
                    Email ID: {testEmail.data.emailId}
                  </p>
                )}
              </div>
            )}

            {testEmail.isError && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {testEmail.error?.message}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-text">Email Configuration</h4>
                  <p className="text-sm text-text-light">
                    Status:{' '}
                    {validateConfig.isLoading
                      ? 'Checking...'
                      : validateConfig.isError
                        ? 'Error'
                        : validateConfig.data?.valid
                          ? 'Valid'
                          : 'Invalid'}
                  </p>
                  {validateConfig.data?.error && (
                    <p className="text-xs text-destructive mt-1">
                      {validateConfig.data.error}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => validateConfig.refetch()}
                  variant="outline"
                  size="sm"
                  disabled={validateConfig.isLoading}
                >
                  Validate Config
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Push Notification Tests */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-text">
            Push Notification Tests
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={handleTestPush}
              disabled={pushLoading || !pushStatus.supported}
              className="w-full"
            >
              {pushLoading ? 'Sending...' : 'Send Test Push'}
            </Button>

            <Button
              onClick={() =>
                sendGroupDecisionNotification(
                  'Test Group',
                  'tiered',
                  new Date(Date.now() + 2 * 60 * 60 * 1000)
                )
              }
              disabled={pushLoading || !pushStatus.supported}
              variant="outline"
              className="w-full"
            >
              Group Decision Push
            </Button>

            <Button
              onClick={() => sendFriendRequestNotification('John Doe')}
              disabled={pushLoading || !pushStatus.supported}
              variant="outline"
              className="w-full"
            >
              Friend Request Push
            </Button>
          </div>
        </Card>

        {/* Toast Notification Tests */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-text">
            Toast Notification Tests
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={handleToastSuccess}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Success Toast
            </Button>

            <Button
              onClick={handleToastError}
              variant="outline"
              className="w-full"
            >
              Error Toast
            </Button>

            <Button
              onClick={handleToastInfo}
              variant="outline"
              className="w-full"
            >
              Info Toast
            </Button>

            <Button
              onClick={handleToastWarning}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Warning Toast
            </Button>
          </div>
        </Card>

        {/* Integrated Notification Tests */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-text">
            Integrated Notification Tests
          </h2>
          <p className="mb-4 text-text-light">
            These tests send notifications through all channels simultaneously
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={handleTestGroupDecision}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Group Decision (All Channels)
            </Button>

            <Button
              onClick={handleTestFriendRequest}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Friend Request (All Channels)
            </Button>

            <Button
              onClick={handleTestGroupInvitation}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Group Invitation (All Channels)
            </Button>

            <Button
              onClick={handleTestDecisionResult}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Decision Result (All Channels)
            </Button>
          </div>
        </Card>

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-text">
              Recent In-App Notifications
            </h2>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification._id.toString()}
                  className={`rounded-lg border p-3 ${!notification.read ? 'bg-primary/10 border-primary' : 'bg-surface border-border'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-text">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-text-light">
                        {notification.message}
                      </p>
                      <p className="text-xs text-text-light mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification._id.toString())}
                        size="sm"
                        variant="outline"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Development Notes */}
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h2 className="mb-4 text-xl font-semibold text-yellow-800">
            Development Notes
          </h2>
          <div className="space-y-2 text-sm text-yellow-700">
            <p>
              • SMS notifications are sent to +18777804236 (development number)
            </p>
            <p>
              • Push notifications require HTTPS in production to work properly
            </p>
            <p>
              • In-app notifications are stored in the database and persist
              across sessions
            </p>
            <p>
              • Toast notifications are temporary and disappear after 4 seconds
            </p>
            <p>• All notification channels can be toggled independently</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
