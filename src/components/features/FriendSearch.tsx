'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useUserSearch, useSendFriendRequest } from '@/hooks/api/useFriends';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface FriendSearchProps {
  userId: string;
  onClose?: () => void;
}

export function FriendSearch({ userId, onClose }: FriendSearchProps) {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useUserSearch(searchQuery, userId);
  const sendFriendRequestMutation = useSendFriendRequest();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (addresseeId: string) => {
    try {
      setErrorMessage(null); // Clear any previous errors
      await sendFriendRequestMutation.mutateAsync({
        requesterId: userId,
        addresseeId,
      });
      // Optionally close the search or show success message
      if (onClose) {
        onClose();
      }
    } catch (error) {
      logger.error('Failed to send friend request:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to send friend request. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-text mb-2">Add Friends</h2>
        <p className="text-sm text-text-light mb-4">
          Search for friends by email, name, or username to send them a friend
          request.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Search by email, name, or username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />

        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-sm text-text-light mt-2">Searching...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : 'Failed to search users'}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text">Search Results</h3>
            {searchResults.map((user) => (
              <Card key={user._id} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <UserAvatar
                      name={user.name}
                      profilePicture={user.profilePicture}
                      size="md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-text-light truncate">
                      {user.email}
                    </p>
                    {user.username && (
                      <p className="text-xs text-text-light truncate">
                        @{user.username}
                      </p>
                    )}
                    {user.city && (
                      <p className="text-xs text-text-light truncate">
                        {user.city}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {user.relationshipStatus === 'accepted' ? (
                      <span className="text-sm text-success font-medium">
                        Already Friends
                      </span>
                    ) : user.relationshipStatus === 'pending_sent' ? (
                      <span className="text-sm text-primary font-medium">
                        Request Sent
                      </span>
                    ) : user.relationshipStatus === 'pending_received' ? (
                      <span className="text-sm text-orange-600 font-medium">
                        Request Received
                      </span>
                    ) : user.relationshipStatus === 'declined' ? (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.clerkId)}
                        disabled={sendFriendRequestMutation.isPending}
                        className="bg-surface hover:bg-surface text-white"
                      >
                        {sendFriendRequestMutation.isPending
                          ? 'Sending...'
                          : 'Send Again'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.clerkId)}
                        disabled={sendFriendRequestMutation.isPending}
                        className="bg-accent hover:bg-accent text-white"
                      >
                        {sendFriendRequestMutation.isPending
                          ? 'Sending...'
                          : 'Add Friend'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {searchResults && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-4">
            <p className="text-sm text-text-light">
              No users found matching &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-8">
            <p className="text-sm text-text-light">
              Enter an email or name to search for friends
            </p>
          </div>
        )}
      </div>

      {onClose && (
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-text-light hover:text-text"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
