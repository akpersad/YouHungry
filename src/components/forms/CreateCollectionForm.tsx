'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Collection } from '@/types/database';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type: 'personal',
          ownerId: user.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.collection);
      } else {
        setError(result.error || 'Failed to create collection');
      }
    } catch {
      setError('Failed to create collection');
    } finally {
      setIsSubmitting(false);
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
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? 'Creating...' : 'Create Collection'}
        </Button>
      </div>
    </form>
  );
}

export { CreateCollectionForm };
