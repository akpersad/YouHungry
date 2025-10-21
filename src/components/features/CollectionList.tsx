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
  showHeader?: boolean;
}

function CollectionList({
  onCollectionSelect,
  collections: propCollections,
  isLoading: propIsLoading,
  onCreateCollection: propOnCreateCollection,
  showType = true, // eslint-disable-line @typescript-eslint/no-unused-vars
  showHeader = true,
}: CollectionListProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null
  );

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

  const handleDeleteCollection = (collectionId: string) => {
    setCollectionToDelete(collectionId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      await deleteCollectionMutation.mutateAsync(collectionToDelete);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      logger.error('Failed to delete collection:', error);
    } finally {
      setShowDeleteConfirmation(false);
      setCollectionToDelete(null);
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
      {showHeader && (
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
      )}

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
            <p className="text-secondary mb-6 text-sm md:text-base">
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
              className="hover:shadow-medium transition-all duration-200 active:scale-98 touch-target relative"
              onClick={() => {
                if (onCollectionSelect) {
                  onCollectionSelect(collection);
                } else {
                  router.push(`/collections/${collection._id}`);
                }
              }}
            >
              {/* Mobile: Menu button in top right */}
              <div
                className="absolute top-3 right-3 flex md:hidden z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <button
                    className="p-2 hover:bg-tertiary rounded-lg transition-colors bg-secondary/50 backdrop-blur-sm border border-border"
                    aria-label="Collection actions"
                    onClick={(e) => {
                      console.log('Menu button clicked');
                      e.stopPropagation();
                      setOpenDropdownId(
                        openDropdownId === collection._id.toString()
                          ? null
                          : collection._id.toString()
                      );
                    }}
                  >
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {/* Custom Dropdown */}
                  {openDropdownId === collection._id.toString() && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenDropdownId(null)}
                      />

                      {/* Dropdown Menu */}
                      <div className="absolute top-full right-0 mt-2 z-50 bg-secondary border border-quaternary rounded-xl shadow-neumorphic-elevated py-1 min-w-48">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(null);
                            handleDeleteCollection(collection._id.toString());
                          }}
                          disabled={deleteCollectionMutation.isPending}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-tertiary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed text-error hover:bg-error/10"
                        >
                          Delete Collection
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary truncate pr-12 md:pr-0">
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

                  {/* Desktop: Show buttons directly */}
                  <div className="hidden md:flex gap-2">
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

                  {/* Mobile: Full width View Collection button */}
                  <div className="flex md:hidden">
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
                      className="w-full touch-target"
                    >
                      View Collection
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

      <Modal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setCollectionToDelete(null);
        }}
        title="Delete Collection?"
      >
        <div className="space-y-4">
          <p className="text-text">
            Are you sure you want to delete this collection? This action cannot
            be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setShowDeleteConfirmation(false);
                setCollectionToDelete(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteCollection}
              className="bg-destructive hover:bg-destructive"
            >
              Delete Collection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export { CollectionList };
