'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
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

interface CollectionListProps {
  onCollectionSelect?: (collection: Collection) => void;
}

function CollectionList({ onCollectionSelect }: CollectionListProps) {
  const { user } = useUser();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCollections = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/collections?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setCollections(data.collections);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch collections');
      }
    } catch (err) {
      setError('Failed to fetch collections');
      console.error('Error fetching collections:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCollections();
  }, [user?.id, fetchCollections]);

  const handleCollectionCreated = (newCollection: Collection) => {
    setCollections((prev) => [newCollection, ...prev]);
    setIsCreateModalOpen(false);
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
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCollections((prev) =>
          prev.filter((c) => c._id.toString() !== collectionId)
        );
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete collection');
      }
    } catch (err) {
      setError('Failed to delete collection');
      console.error('Error deleting collection:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-error mb-4">{error}</p>
            <Button onClick={fetchCollections} variant="outline">
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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Collection
        </Button>
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
                      onClick={() => onCollectionSelect?.(collection)}
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
                      className="text-error hover:text-error"
                    >
                      Delete
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
