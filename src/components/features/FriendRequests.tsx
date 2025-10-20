'use client';

import { logger } from '@/lib/logger';
import {
  useFriendRequests,
  useUpdateFriendRequest,
} from '@/hooks/api/useFriends';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';

interface FriendRequestsProps {
  userId: string;
}

export function FriendRequests({ userId }: FriendRequestsProps) {
  const { data: requests, isLoading, error } = useFriendRequests(userId);
  const updateRequestMutation = useUpdateFriendRequest();

  const handleRequestAction = async (
    friendshipId: string,
    action: 'accept' | 'decline'
  ) => {
    try {
      await updateRequestMutation.mutateAsync({
        friendshipId,
        action,
        userId,
      });
    } catch (error) {
      logger.error(`Failed to ${action} friend request:`, error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Friend Requests</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-sm text-text-light mt-2">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Friend Requests</h2>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : 'Failed to load friend requests'}
          </p>
        </div>
      </div>
    );
  }

  const receivedRequests = requests?.received || [];
  const sentRequests = requests?.sent || [];
  const totalRequests = receivedRequests.length + sentRequests.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">Friend Requests</h2>
        <span className="text-sm text-text-light">
          {totalRequests} request{totalRequests !== 1 ? 's' : ''}
        </span>
      </div>

      {totalRequests === 0 ? (
        <div className="text-center py-8">
          <div className="text-text-light mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-text-light">No pending friend requests</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Received Requests */}
          {receivedRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text">
                Received Requests ({receivedRequests.length})
              </h3>
              <div className="space-y-2">
                {receivedRequests.map((request) => (
                  <Card key={request._id} className="p-4 !overflow-visible">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <UserAvatar
                            name={request.requester.name}
                            profilePicture={request.requester.profilePicture}
                            size="md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">
                            {request.requester.name}
                          </p>
                          <p className="text-sm text-text-light truncate">
                            {request.requester.email}
                          </p>
                          <p className="text-xs text-text-light">
                            Sent{' '}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Desktop: Show buttons directly */}
                      <div className="hidden md:flex flex-shrink-0 space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRequestAction(request._id, 'accept')
                          }
                          disabled={updateRequestMutation.isPending}
                          className="bg-success hover:bg-success text-white"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRequestAction(request._id, 'decline')
                          }
                          disabled={updateRequestMutation.isPending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Decline
                        </Button>
                      </div>

                      {/* Mobile: Show dropdown menu */}
                      <div className="flex md:hidden flex-shrink-0">
                        <DropdownMenu
                          trigger={
                            <button
                              className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                              aria-label="Request actions"
                            >
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>
                          }
                          align="right"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              handleRequestAction(request._id, 'accept')
                            }
                            disabled={updateRequestMutation.isPending}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Accept Request
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRequestAction(request._id, 'decline')
                            }
                            variant="destructive"
                            disabled={updateRequestMutation.isPending}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Decline Request
                          </DropdownMenuItem>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text">
                Sent Requests ({sentRequests.length})
              </h3>
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <Card key={request._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <UserAvatar
                            name={request.addressee.name}
                            profilePicture={request.addressee.profilePicture}
                            size="md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">
                            {request.addressee.name}
                          </p>
                          <p className="text-sm text-text-light truncate">
                            {request.addressee.email}
                          </p>
                          <p className="text-xs text-text-light">
                            Sent{' '}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning">
                          Pending
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
