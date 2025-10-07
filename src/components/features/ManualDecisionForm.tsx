'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useManualDecision } from '@/hooks/api/useHistory';
import { useCollections } from '@/hooks/api/useCollections';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Collection, Restaurant, Group } from '@/types/database';

interface ManualDecisionFormProps {
  onSuccess?: () => void;
}

export function ManualDecisionForm({ onSuccess }: ManualDecisionFormProps) {
  const [collectionId, setCollectionId] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [type, setType] = useState<'personal' | 'group'>('personal');
  const [groupId, setGroupId] = useState('');
  const [notes, setNotes] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const { profile } = useProfile();
  const { data: collectionsData } = useCollections(profile?._id);
  const manualDecisionMutation = useManualDecision();

  // Fetch restaurants when collection changes
  const { data: restaurantsData } = useQuery({
    queryKey: ['collection-restaurants', collectionId],
    queryFn: async () => {
      if (!collectionId) return [];
      const response = await fetch(
        `/api/collections/${collectionId}/restaurants`
      );
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      const data = await response.json();
      return data.restaurants || [];
    },
    enabled: !!collectionId,
  });

  useEffect(() => {
    if (restaurantsData) {
      setRestaurants(restaurantsData);
    }
  }, [restaurantsData]);

  // Fetch groups if type is group
  const { data: groupsData } = useQuery({
    queryKey: ['user-groups'],
    queryFn: async () => {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      return data.groups || [];
    },
    enabled: type === 'group',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionId || !restaurantId || !visitDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (type === 'group' && !groupId) {
      toast.error('Please select a group');
      return;
    }

    try {
      await manualDecisionMutation.mutateAsync({
        collectionId,
        restaurantId,
        visitDate: new Date(visitDate).toISOString(),
        type,
        groupId: type === 'group' ? groupId : undefined,
        notes: notes || undefined,
      });

      toast.success('Decision added successfully');
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to add decision');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Decision Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="personal"
              checked={type === 'personal'}
              onChange={(e) => setType(e.target.value as 'personal' | 'group')}
              className="mr-2"
            />
            Personal
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="group"
              checked={type === 'group'}
              onChange={(e) => setType(e.target.value as 'personal' | 'group')}
              className="mr-2"
            />
            Group
          </label>
        </div>
      </div>

      {/* Collection Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Collection <span className="text-red-500">*</span>
        </label>
        <select
          value={collectionId}
          onChange={(e) => {
            setCollectionId(e.target.value);
            setRestaurantId(''); // Reset restaurant when collection changes
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        >
          <option value="">Select a collection</option>
          {collectionsData
            ?.filter((c: Collection) =>
              type === 'group' ? c.type === 'group' : true
            )
            .map((collection: Collection) => (
              <option
                key={collection._id.toString()}
                value={collection._id.toString()}
              >
                {collection.name} ({collection.type})
              </option>
            ))}
        </select>
      </div>

      {/* Group Selection (if group type) */}
      {type === 'group' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group <span className="text-red-500">*</span>
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Select a group</option>
            {groupsData?.map((group: Group) => (
              <option key={group._id.toString()} value={group._id.toString()}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Restaurant Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Restaurant <span className="text-red-500">*</span>
        </label>
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
          disabled={!collectionId}
        >
          <option value="">
            {collectionId ? 'Select a restaurant' : 'Select a collection first'}
          </option>
          {restaurants.map((restaurant) => (
            <option
              key={restaurant._id.toString()}
              value={restaurant._id.toString()}
            >
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Visit Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visit Date <span className="text-red-500">*</span>
        </label>
        <Input
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this visit..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 h-24 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={manualDecisionMutation.isPending}
          className="flex-1"
        >
          {manualDecisionMutation.isPending ? 'Adding...' : 'Add Decision'}
        </Button>
      </div>
    </form>
  );
}
