'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { FriendSearch } from './FriendSearch';
import { FriendList } from './FriendList';
import { FriendRequests } from './FriendRequests';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type TabType = 'friends' | 'requests' | 'search';

export function FriendsManagement() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [showSearchModal, setShowSearchModal] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          Please sign in to manage friends
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'friends' as const, label: 'Friends', count: null },
    { id: 'requests' as const, label: 'Requests', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <p className="text-sm text-gray-600">
            Manage your friends and friend requests
          </p>
        </div>
        <Button
          onClick={() => setShowSearchModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Friends
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'friends' && <FriendList userId={user.id} />}
        {activeTab === 'requests' && <FriendRequests userId={user.id} />}
      </div>

      {/* Search Modal */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Add Friends"
        className="max-w-2xl"
      >
        <FriendSearch
          userId={user.id}
          onClose={() => setShowSearchModal(false)}
        />
      </Modal>
    </div>
  );
}
