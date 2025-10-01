'use client';

import { logger } from '@/lib/logger';
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
      logger.error('Failed to delete collection:', error);
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
    <div className="space-y-6">
      {/* Header - Mobile optimized */}
      <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-primary">
            My Collections
          </h2>
          <p className="text-secondary text-sm md:text-base">
            Manage your personal restaurant collections
          </p>
        </div>
        <Button
          onClick={onCreateCollection}
          className="w-full md:w-auto touch-target"
        >
          Create Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tertiary flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
            <p className="text-tertiary mb-6 text-sm md:text-base">
              You don&apos;t have any collections yet.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="touch-target"
            >
              Create Your First Collection
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card
              key={collection._id.toString()}
              className="hover:shadow-medium transition-all duration-200 active:scale-98 touch-target"
              onClick={() => {
                if (onCollectionSelect) {
                  onCollectionSelect(collection);
                } else {
                  router.push(`/collections/${collection._id}`);
                }
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary truncate">
                  {collection.name}
                </CardTitle>
                {collection.description && (
                  <CardDescription className="text-secondary text-sm line-clamp-2">
                    {collection.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Restaurant count with icon */}
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>{collection.restaurantIds.length} restaurants</span>
                  </div>

                  {/* Action buttons - Mobile optimized */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCollectionSelect) {
                          onCollectionSelect(collection);
                        } else {
                          router.push(`/collections/${collection._id}`);
                        }
                      }}
                      className="flex-1 touch-target"
                    >
                      View Collection
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection._id.toString());
                      }}
                      disabled={deleteCollectionMutation.isPending}
                      className="text-error border-error hover:bg-error/10 disabled:opacity-50 touch-target px-3"
                    >
                      {deleteCollectionMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
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
