'use client';

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
      console.error('Failed to send friend request:', error);
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Add Friends
        </h2>
        <p className="text-sm text-gray-600 mb-4">
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
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 mt-2">Searching...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : 'Failed to search users'}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              Search Results
            </h3>
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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    {user.username && (
                      <p className="text-xs text-gray-400 truncate">
                        @{user.username}
                      </p>
                    )}
                    {user.city && (
                      <p className="text-xs text-gray-400 truncate">
                        {user.city}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {user.relationshipStatus === 'accepted' ? (
                      <span className="text-sm text-green-600 font-medium">
                        Already Friends
                      </span>
                    ) : user.relationshipStatus === 'pending_sent' ? (
                      <span className="text-sm text-blue-600 font-medium">
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
                        className="bg-gray-600 hover:bg-gray-700 text-white"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <p className="text-sm text-gray-500">
              No users found matching &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
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
            className="text-gray-600 hover:text-gray-800"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
