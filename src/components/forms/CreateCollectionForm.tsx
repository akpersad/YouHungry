'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Collection } from '@/types/database';
import { useCreateCollection } from '@/hooks/api';
import { useMutation } from '@tanstack/react-query';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-error text-sm" role="alert">
            {error}
          </p>
        </div>
      )}

      <div className="w-full">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-text mb-1"
        >
          Collection Name
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Favorite Pizza Places"
          maxLength={100}
          required
        />
      </div>

      <div className="w-full">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-text mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your collection..."
          maxLength={500}
          className="input-base min-h-[80px] resize-none"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            createCollectionMutation.isPending ||
            createGroupCollectionMutation.isPending ||
            !name.trim()
          }
        >
          {createCollectionMutation.isPending ||
          createGroupCollectionMutation.isPending
            ? 'Creating...'
            : 'Create Collection'}
        </Button>
      </div>
    </form>
  );
}

export { CreateCollectionForm };
