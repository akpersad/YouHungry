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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: 'personal',
          ownerId: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.collection);
      } else {
        setError(data.error || 'Failed to create collection');
      }
    } catch (err) {
      setError('Failed to create collection');
      console.error('Error creating collection:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      <Input
        label="Collection Name"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        placeholder="e.g., Favorite Pizza Places"
        required
        maxLength={100}
      />

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-text mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your collection..."
          className="input-base min-h-[80px] resize-none"
          maxLength={500}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!formData.name.trim()}
        >
          Create Collection
        </Button>
      </div>
    </form>
  );
}

export { CreateCollectionForm };
