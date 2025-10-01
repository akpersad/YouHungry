'use client';

import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useFriends, useRemoveFriend } from '@/hooks/api/useFriends';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { UserAvatar } from '@/components/ui/UserAvatar';

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
        <h2 className="text-xl font-semibold text-gray-900">Friends</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500 mt-2">Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Friends</h2>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load friends'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Friends</h2>
        <span className="text-sm text-gray-500">
          {friends?.length || 0} friend{(friends?.length || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {friends && friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((friend) => (
            <Card key={friend._id} className="p-4">
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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {friend.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {friend.email}
                    </p>
                    {friend.username && (
                      <p className="text-xs text-gray-400 truncate">
                        @{friend.username}
                      </p>
                    )}
                    {friend.city && (
                      <p className="text-xs text-gray-400 truncate">
                        {friend.city}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Added {new Date(friend.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveClick(friend.friendshipId)}
                    disabled={removeFriendMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
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
          <p className="text-sm text-gray-500">No friends yet</p>
          <p className="text-xs text-gray-400 mt-1">
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
          <p className="text-sm text-gray-600">
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removeFriendMutation.isPending ? 'Removing...' : 'Remove Friend'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
