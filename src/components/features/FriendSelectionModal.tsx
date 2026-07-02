'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
// import { Card } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useFriends } from '@/hooks/api/useFriends';
import { toast } from 'sonner';

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
  // Invite anyone by email — the single flow folds the old standalone
  // "Invite by Email" modal into this one. Optional so older callers keep
  // working without an email affordance.
  onInviteByEmail?: (email: string) => Promise<void>;
  groupId: string;
  isLoading?: boolean;
}

export function FriendSelectionModal({
  isOpen,
  onClose,
  onInviteFriends,
  onInviteByEmail,
  groupId, // eslint-disable-line @typescript-eslint/no-unused-vars
  isLoading = false, // eslint-disable-line @typescript-eslint/no-unused-vars
}: FriendSelectionModalProps) {
  const { userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [invitingFriend, setInvitingFriend] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [invitingEmail, setInvitingEmail] = useState(false);

  // Reset state when the modal opens (render-time reset instead of a
  // setState-in-effect)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSearchTerm('');
      setCurrentPage(1);
      setInvitingFriend(null);
      setEmailInput('');
      setInvitingEmail(false);
    }
  }

  const busy = invitingFriend !== null || invitingEmail;

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

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email || !onInviteByEmail) return;

    setInvitingEmail(true);
    try {
      await onInviteByEmail(email);
      toast.success(`Invitation sent to ${email}!`);
      setEmailInput('');
      onClose();
    } catch (error) {
      logger.error('Error inviting by email:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setInvitingEmail(false);
    }
  };

  const handleClose = () => {
    if (!busy) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite to Group">
      <div className="space-y-6">
        {/* Invite by email — anyone, friend or not */}
        {onInviteByEmail && (
          <form onSubmit={handleInviteByEmail} className="space-y-2">
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-ink"
            >
              Invite by email
            </label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="flex-1 text-sm"
                disabled={busy}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={invitingEmail}
                disabled={!emailInput.trim() || busy}
                className="whitespace-nowrap"
              >
                Send Invite
              </Button>
            </div>
          </form>
        )}

        {/* Divider between the two ways to invite */}
        {onInviteByEmail && (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-ink-secondary">
              Or pick a friend
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border mx-auto"></div>
              <p className="mt-2 text-sm text-ink-secondary">
                Loading friends...
              </p>
            </div>
          ) : friendsError ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">Failed to load friends</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : paginatedFriends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-ink-secondary">
                {searchTerm
                  ? 'No friends found matching your search'
                  : 'No friends available'}
              </p>
            </div>
          ) : (
            paginatedFriends.map((friend: Friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-4 bg-white border border-border rounded-lg hover:bg-surface hover:border-border transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <UserAvatar
                    name={friend.name}
                    profilePicture={friend.profilePicture}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">
                      {friend.name}
                    </p>
                    <p className="text-sm text-ink-secondary truncate">
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
                    disabled={busy}
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
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || busy}
            >
              Previous
            </Button>
            <span className="text-sm text-ink-secondary font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages || busy}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
