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
import { useGroup } from '@/hooks/api/useGroups';
import { useCollections } from '@/hooks/api/useCollections';
import { toast } from 'react-hot-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface GroupCollectionsPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupCollectionsPage({
  params,
}: GroupCollectionsPageProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const { id: groupId } = use(params);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: groupData,
    isLoading: groupLoading,
    error: groupError,
  } = useGroup(groupId);
  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useCollections(userId || '');

  // Filter collections for this specific group
  const groupCollections =
    collectionsData?.filter(
      (collection: Collection) => collection.ownerId.toString() === groupId
    ) || [];

  // const isCurrentUserAdmin = groupData?.adminIds.some(
  //   (adminId) => adminId.toString() === userId
  // );

  if (groupLoading) {
    return (
      <MainLayout>
        <ProtectedRoute>
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </MainLayout>
    );
  }

  if (groupError || !groupData) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
                <p className="text-red-600 mb-4">Failed to load collections</p>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </Card>
          ) : (
            <CollectionList
              collections={groupCollections}
              isLoading={collectionsLoading}
              onCreateCollection={() => setShowCreateForm(true)}
              showType={false} // Don't show type since all are group collections
            />
          )}

          {showCreateForm && (
            <CreateCollectionForm
              onSuccess={() => {
                toast.success('Collection created successfully!');
                setShowCreateForm(false);
                // Refresh collections
                window.location.reload();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}
