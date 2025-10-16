'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Collection } from '@/types/database';
import { useCreateCollection } from '@/hooks/api';
import { useMutation } from '@tanstack/react-query';
import { trackCollectionCreate } from '@/lib/analytics';

interface CreateCollectionFormProps {
  onSuccess: (collection: Collection) => void;
  onCancel: () => void;
  groupId?: string; // Optional group ID for group collections
}

function CreateCollectionForm({
  onSuccess,
  onCancel,
  groupId,
}: CreateCollectionFormProps) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Only use the hook for personal collections (when groupId is not provided)
  const createCollectionMutation = useCreateCollection();

  // Custom mutation for group collections
  const createGroupCollectionMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      groupId: string;
    }) => {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          type: 'group',
          groupId: data.groupId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group collection');
      }

      const result = await response.json();
      return result.collection;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    setError('');

    try {
      let newCollection: Collection;

      if (groupId) {
        // Create group collection using the custom mutation
        newCollection = await createGroupCollectionMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          groupId: groupId,
        });
      } else {
        // Create personal collection using the hook
        newCollection = await createCollectionMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          userId: user.id,
        });
      }

      // Track collection creation
      trackCollectionCreate({
        collectionType: groupId ? 'group' : 'personal',
        collectionName: name.trim(),
      });

      onSuccess(newCollection);
      setName('');
      setDescription('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create collection'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl shadow-neumorphic-light dark:shadow-neumorphic-dark">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-error text-sm" role="alert">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="w-full">
          <Input
            id="name"
            name="name"
            label="Collection Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Favorite Pizza Places"
            maxLength={100}
            required
            helperText="Give your collection a memorable name"
          />
        </div>

        <div className="w-full">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-primary mb-2"
          >
            Description <span className="text-tertiary">(Optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your collection..."
            maxLength={500}
            className="input-base min-h-[100px] resize-none shadow-neumorphic-light dark:shadow-neumorphic-dark"
            rows={4}
          />
          <p className="mt-1 text-xs text-tertiary">
            {description.length}/500 characters
          </p>
        </div>
      </div>

      {/* Mobile-optimized button layout */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={
            createCollectionMutation.isPending ||
            createGroupCollectionMutation.isPending ||
            !name.trim()
          }
          className="w-full sm:w-auto touch-target"
        >
          {createCollectionMutation.isPending ||
          createGroupCollectionMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Collection
            </div>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto touch-target"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export { CreateCollectionForm };
