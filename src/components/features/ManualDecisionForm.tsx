'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useManualDecision } from '@/hooks/api/useHistory';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Collection, Restaurant, Group } from '@/types/database';

interface ManualDecisionFormProps {
  onSuccess?: () => void;
}

export function ManualDecisionForm({ onSuccess }: ManualDecisionFormProps) {
  const [restaurantId, setRestaurantId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [type, setType] = useState<'personal' | 'group'>('personal');
  const [groupId, setGroupId] = useState('');
  const [notes, setNotes] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const { profile } = useProfile();
  const manualDecisionMutation = useManualDecision();

  // Fetch all collections (both personal and group)
  const { data: collectionsData } = useQuery({
    queryKey: ['all-collections', profile?.clerkId],
    queryFn: async () => {
      if (!profile?.clerkId) return [];
      logger.debug('ManualDecisionForm: Profile Clerk ID:', profile.clerkId);
      const response = await fetch(
        `/api/collections?userId=${profile.clerkId}&type=all`
      );
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      logger.debug('ManualDecisionForm: Collections API response:', data);

      // Handle different response formats
      let allCollections = [];
      if (data.collections && typeof data.collections === 'object') {
        // If collections is an object with personal/group properties
        allCollections = [
          ...(data.collections.personal || []),
          ...(data.collections.group || []),
        ];
      } else if (Array.isArray(data.collections)) {
        // If collections is directly an array
        allCollections = data.collections;
      } else if (Array.isArray(data)) {
        // If the response is directly an array
        allCollections = data;
      }

      logger.debug('ManualDecisionForm: Combined collections:', allCollections);
      logger.debug(
        'ManualDecisionForm: Full collection data:',
        JSON.stringify(allCollections, null, 2)
      );
      return allCollections;
    },
    enabled: !!profile?.clerkId,
  });

  // Fetch all unique restaurants across collections
  const { data: restaurantsData, isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ['all-restaurants', type, groupId, collectionsData],
    queryFn: async () => {
      logger.debug('ManualDecisionForm: Fetching restaurants...', {
        type,
        groupId,
        collectionsDataLength: collectionsData?.length,
        collectionsData,
      });

      // For personal decisions, get all restaurants from personal collections
      // For group decisions, get all restaurants from the selected group's collections
      if (type === 'group' && !groupId) {
        logger.debug('ManualDecisionForm: Group type but no groupId');
        return [];
      }

      const collections =
        collectionsData?.filter((c: Collection) => {
          if (type === 'group') {
            // For group collections, ownerId is the Group ID
            return c.type === 'group' && c.ownerId?.toString() === groupId;
          }
          return c.type === 'personal';
        }) || [];

      logger.debug('ManualDecisionForm: Filtered collections:', collections);

      if (collections.length === 0) {
        logger.debug('ManualDecisionForm: No collections found');
        return [];
      }

      // Get all restaurant IDs from these collections
      const allRestaurantIds = new Set<string>();
      collections.forEach((collection: Collection) => {
        logger.debug('ManualDecisionForm: Processing collection:', {
          name: collection.name,
          restaurantIds: collection.restaurantIds,
          restaurantIdsLength: collection.restaurantIds?.length,
        });

        collection.restaurantIds?.forEach((restId) => {
          const id =
            typeof restId === 'object' && '_id' in restId
              ? restId._id.toString()
              : restId.toString();
          allRestaurantIds.add(id);
        });
      });

      logger.debug(
        'ManualDecisionForm: All restaurant IDs:',
        Array.from(allRestaurantIds)
      );

      if (allRestaurantIds.size === 0) {
        logger.debug('ManualDecisionForm: No restaurant IDs found');
        return [];
      }

      // Fetch all unique restaurants
      const response = await fetch(
        `/api/restaurants?restaurantIds=${Array.from(allRestaurantIds).join(',')}`
      );

      if (!response.ok) {
        logger.error(
          'ManualDecisionForm: Failed to fetch restaurants:',
          response.status
        );
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      logger.debug(
        'ManualDecisionForm: Fetched restaurants:',
        data.restaurants
      );
      const restaurants = data.restaurants || [];
      // Sort restaurants alphabetically by name (A-Z)
      return restaurants.sort((a: Restaurant, b: Restaurant) =>
        a.name.localeCompare(b.name)
      );
    },
    enabled:
      !!collectionsData &&
      (type === 'personal' || (type === 'group' && !!groupId)),
  });

  useEffect(() => {
    if (restaurantsData && Array.isArray(restaurantsData)) {
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

  // Check if all required fields are filled
  const isFormValid = () => {
    if (!restaurantId || !visitDate) return false;
    if (type === 'group' && !groupId) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurantId || !visitDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (type === 'group' && !groupId) {
      toast.error('Please select a group');
      return;
    }

    try {
      await manualDecisionMutation.mutateAsync({
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
        <label className="block text-sm font-medium text-primary mb-2">
          Decision Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="personal"
              checked={type === 'personal'}
              onChange={(e) => {
                setType(e.target.value as 'personal' | 'group');
                setRestaurantId(''); // Reset restaurant selection when type changes
              }}
              className="mr-2"
            />
            Personal
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="group"
              checked={type === 'group'}
              onChange={(e) => {
                setType(e.target.value as 'personal' | 'group');
                setRestaurantId(''); // Reset restaurant selection when type changes
                setGroupId(''); // Reset group selection when switching to personal
              }}
              className="mr-2"
            />
            Group
          </label>
        </div>
      </div>

      {/* Group Selection (if group type) */}
      {type === 'group' && (
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Group <span className="text-destructive">*</span>
          </label>
          <select
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              setRestaurantId(''); // Reset restaurant selection when group changes
            }}
            className="w-full rounded-lg border border-quinary px-3 py-2"
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
        <label className="block text-sm font-medium text-primary mb-2">
          Restaurant <span className="text-destructive">*</span>
        </label>
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="w-full rounded-lg border border-quinary px-3 py-2"
          required
          disabled={type === 'group' ? !groupId : false}
        >
          <option value="">
            {type === 'group' && !groupId
              ? 'Select a group first'
              : isLoadingRestaurants
                ? 'Loading restaurants...'
                : restaurants.length === 0
                  ? type === 'personal'
                    ? 'No personal collections with restaurants found'
                    : 'No restaurants found'
                  : 'Select a restaurant'}
          </option>
          {restaurants.map((restaurant) => (
            <option
              key={restaurant._id.toString()}
              value={restaurant._id.toString()}
            >
              {restaurant.name} - {restaurant.address}
            </option>
          ))}
        </select>
      </div>

      {/* Visit Date */}
      <div>
        <Input
          type="date"
          label="Visit Date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          required
          helperText="Click to open calendar picker"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this visit..."
          className="w-full rounded-lg border border-quinary px-3 py-2 h-24 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={!isFormValid() || manualDecisionMutation.isPending}
          className="flex-1"
        >
          {manualDecisionMutation.isPending ? 'Adding...' : 'Add Decision'}
        </Button>
      </div>
    </form>
  );
}
