'use client';

import React, { useState, use } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
// import Link from 'next/link';
import { CollectionList } from '@/components/features/CollectionList';
import { CreateCollectionForm } from '@/components/forms/CreateCollectionForm';
import { Collection } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useGroup } from '@/hooks/api/useGroups';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface GroupCollectionsPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupCollectionsPage({
  params,
}: GroupCollectionsPageProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: groupId } = use(params);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: groupData,
    isLoading: groupLoading,
    error: groupError,
  } = useGroup(groupId);
  // Fetch group collections specifically
  const {
    data: groupCollections,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useQuery({
    queryKey: ['groupCollections', groupId],
    queryFn: async (): Promise<Collection[]> => {
      const response = await fetch(
        `/api/collections?type=group&userId=${userId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch group collections');
      }
      const data = await response.json();
      // Filter collections for this specific group
      return data.collections.filter(
        (collection: Collection) => collection.ownerId.toString() === groupId
      );
    },
    enabled: !!userId && !!groupId,
  });

  if (groupLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-surface rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-surface rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (groupError || !groupData) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-4">
              Group Not Found
            </h1>
            <p className="text-text-light mb-4">
              The group you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <Button variant="primary" onClick={() => router.push('/groups')}>
              Back to Groups
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push(`/groups/${groupId}`)}
            className="mb-4"
          >
            ← Back to Group
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text">
                {groupData.name} Collections
              </h1>
              <p className="mt-2 text-text-light">
                Manage group restaurant collections
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
              disabled={collectionsLoading}
            >
              Create Collection
            </Button>
          </div>
        </div>

        {collectionsError ? (
          <Card className="p-6">
            <div className="text-center">
              <p className="text-destructive mb-4">
                Failed to load collections
              </p>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <CollectionList
              collections={groupCollections}
              isLoading={collectionsLoading}
              onCreateCollection={() => setShowCreateForm(true)}
              showType={false} // Don't show type since all are group collections
              showHeader={false} // Hide header since page has its own
              // Remove onCollectionSelect so View button navigates to collection detail page
            />

            {/* Group Decision Making can be accessed from individual collection pages */}
          </div>
        )}

        {showCreateForm && (
          <Modal
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            title="Create New Collection"
          >
            <CreateCollectionForm
              groupId={groupId}
              onSuccess={() => {
                toast.success('Collection created successfully!');
                setShowCreateForm(false);
                // Invalidate the group collections cache to refresh the data
                queryClient.invalidateQueries({
                  queryKey: ['groupCollections', groupId],
                });
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  );
}
