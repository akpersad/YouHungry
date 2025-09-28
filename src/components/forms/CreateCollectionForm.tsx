'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Collection } from '@/types/database';
import { useCreateCollection } from '@/hooks/api';

interface CreateCollectionFormProps {
  onSuccess: (collection: Collection) => void;
  onCancel: () => void;
}

function CreateCollectionForm({
  onSuccess,
  onCancel,
}: CreateCollectionFormProps) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const createCollectionMutation = useCreateCollection();

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
      const newCollection = await createCollectionMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        userId: user.id,
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
          disabled={createCollectionMutation.isPending || !name.trim()}
        >
          {createCollectionMutation.isPending
            ? 'Creating...'
            : 'Create Collection'}
        </Button>
      </div>
    </form>
  );
}

export { CreateCollectionForm };
