'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
// import { Card } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useFriends } from '@/hooks/api/useFriends';
import { toast } from 'react-hot-toast';

interface Friend {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  username?: string;
  profilePicture?: string;
  city?: string;
  friendshipId: string;
  addedAt: Date;
}

interface FriendSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteFriends: (friendEmails: string[]) => Promise<void>;
  groupId: string;
  isLoading?: boolean;
}

export function FriendSelectionModal({
  isOpen,
  onClose,
  onInviteFriends,
  groupId, // eslint-disable-line @typescript-eslint/no-unused-vars
  isLoading = false, // eslint-disable-line @typescript-eslint/no-unused-vars
}: FriendSelectionModalProps) {
  const { userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [invitingFriend, setInvitingFriend] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const {
    data: friends,
    isLoading: friendsLoading,
    error: friendsError,
    refetch,
  } = useFriends(userId || undefined);

  // Filter friends based on search term
  const filteredFriends =
    friends?.filter(
      (friend: Friend) =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Paginate filtered friends
  const totalPages = Math.ceil(filteredFriends.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFriends = filteredFriends.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setCurrentPage(1);
      setInvitingFriend(null);
    }
  }, [isOpen]);

  const handleInviteFriend = async (friendEmail: string) => {
    setInvitingFriend(friendEmail);
    try {
      await onInviteFriends([friendEmail]);
      toast.success('Successfully invited friend to the group!');
      onClose();
    } catch (error) {
      logger.error('Error inviting friend:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setInvitingFriend(null);
    }
  };

  const handleClose = () => {
    if (!invitingFriend) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Friends to Group"
    >
      <div className="space-y-6">
        {/* Search */}
        <div>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset pagination on search
            }}
            placeholder="Search friends by name or email..."
            className="w-full text-sm"
          />
        </div>

        {/* Friends List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {friendsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading friends...</p>
            </div>
          ) : friendsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Failed to load friends</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : paginatedFriends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchTerm
                  ? 'No friends found matching your search'
                  : 'No friends available'}
              </p>
            </div>
          ) : (
            paginatedFriends.map((friend: Friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <UserAvatar
                    name={friend.name}
                    profilePicture={friend.profilePicture}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {friend.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {friend.email}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleInviteFriend(friend.email)}
                    isLoading={invitingFriend === friend.email}
                    disabled={invitingFriend !== null}
                    className="whitespace-nowrap min-w-[120px]"
                  >
                    Invite To Group
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || invitingFriend !== null}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages || invitingFriend !== null}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
