'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CreateCollectionForm } from '../forms/CreateCollectionForm';
import { Collection } from '@/types/database';
import { useCollections, useDeleteCollection } from '@/hooks/api';

interface CollectionListProps {
  onCollectionSelect?: (collection: Collection) => void;
  collections?: Collection[];
  isLoading?: boolean;
  onCreateCollection?: () => void;
  showType?: boolean;
}

function CollectionList({
  onCollectionSelect,
  collections: propCollections,
  isLoading: propIsLoading,
  onCreateCollection: propOnCreateCollection,
  showType = true, // eslint-disable-line @typescript-eslint/no-unused-vars
}: CollectionListProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Use TanStack Query hooks
  const {
    data: hookCollections = [],
    isLoading: hookIsLoading,
    error,
    refetch,
  } = useCollections(user?.id);

  // Use props if provided, otherwise use hook data
  const collections = propCollections ?? hookCollections;
  const isLoading = propIsLoading ?? hookIsLoading;
  const onCreateCollection =
    propOnCreateCollection ?? (() => setIsCreateModalOpen(true));

  const deleteCollectionMutation = useDeleteCollection();

  const handleCollectionCreated = () => {
    setIsCreateModalOpen(false);
    // The mutation will automatically invalidate and refetch the collections
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this collection? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await deleteCollectionMutation.mutateAsync(collectionId);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Failed to delete collection:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          role="status"
          aria-label="Loading collections"
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-error mb-4">
              {error instanceof Error
                ? error.message
                : 'Failed to fetch collections'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">My Collections</h2>
          <p className="text-text-light">
            Manage your personal restaurant collections
          </p>
        </div>
        <Button onClick={onCreateCollection}>Create Collection</Button>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <p className="text-text-muted mb-4">
                You don&apos;t have any collections yet.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create Your First Collection
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card
              key={collection._id.toString()}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-lg">{collection.name}</CardTitle>
                {collection.description && (
                  <CardDescription>{collection.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">
                    {collection.restaurantIds.length} restaurants
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onCollectionSelect) {
                          onCollectionSelect(collection);
                        } else {
                          router.push(`/collections/${collection._id}`);
                        }
                      }}
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDeleteCollection(collection._id.toString())
                      }
                      disabled={deleteCollectionMutation.isPending}
                      className="text-error hover:text-error disabled:opacity-50"
                    >
                      {deleteCollectionMutation.isPending
                        ? 'Deleting...'
                        : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Collection"
      >
        <CreateCollectionForm
          onSuccess={handleCollectionCreated}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export { CollectionList };
