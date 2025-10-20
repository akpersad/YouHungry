'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useFriends, useRemoveFriend } from '@/hooks/api/useFriends';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';

interface FriendListProps {
  userId: string;
}

export function FriendList({ userId }: FriendListProps) {
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const { data: friends, isLoading, error } = useFriends(userId);
  const removeFriendMutation = useRemoveFriend();

  const handleRemoveClick = (friendshipId: string) => {
    setFriendToRemove(friendshipId);
    setShowRemoveModal(true);
  };

  const handleRemoveConfirm = async () => {
    if (!friendToRemove) return;

    try {
      await removeFriendMutation.mutateAsync({
        friendshipId: friendToRemove,
        userId,
      });
      setShowRemoveModal(false);
      setFriendToRemove(null);
    } catch (error) {
      logger.error('Failed to remove friend:', error);
    }
  };

  const handleRemoveCancel = () => {
    setShowRemoveModal(false);
    setFriendToRemove(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Friends</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="text-sm text-secondary mt-2">Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Friends</h2>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load friends'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Friends</h2>
        <span className="text-sm text-secondary">
          {friends?.length || 0} friend{(friends?.length || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {friends && friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((friend) => (
            <Card key={friend._id} className="p-4 !overflow-visible">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <UserAvatar
                      name={friend.name}
                      profilePicture={friend.profilePicture}
                      size="md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {friend.name}
                    </p>
                    <p className="text-sm text-secondary truncate">
                      {friend.email}
                    </p>
                    {friend.username && (
                      <p className="text-xs text-text-light truncate">
                        @{friend.username}
                      </p>
                    )}
                    {friend.city && (
                      <p className="text-xs text-text-light truncate">
                        {friend.city}
                      </p>
                    )}
                    <p className="text-xs text-text-light">
                      Added {new Date(friend.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Desktop: Show button directly */}
                <div className="hidden md:flex flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveClick(friend.friendshipId)}
                    disabled={removeFriendMutation.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                </div>

                {/* Mobile: Show dropdown menu */}
                <div className="flex md:hidden flex-shrink-0">
                  <DropdownMenu
                    trigger={
                      <button
                        className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                        aria-label="Friend actions"
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
                      onClick={() => handleRemoveClick(friend.friendshipId)}
                      variant="destructive"
                      disabled={removeFriendMutation.isPending}
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove Friend
                    </DropdownMenuItem>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-secondary">No friends yet</p>
          <p className="text-xs text-text-light mt-1">
            Search for friends to add them to your network
          </p>
        </div>
      )}

      {/* Remove Friend Confirmation Modal */}
      <Modal
        isOpen={showRemoveModal}
        onClose={handleRemoveCancel}
        title="Remove Friend"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to remove this friend? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleRemoveCancel}
              disabled={removeFriendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveConfirm}
              disabled={removeFriendMutation.isPending}
              className="bg-destructive hover:bg-destructive text-white"
            >
              {removeFriendMutation.isPending ? 'Removing...' : 'Remove Friend'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
