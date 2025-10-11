'use client';

import { useState } from 'react';
import { Restaurant, Collection } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RestaurantImage } from '@/components/ui/RestaurantImage';

interface RestaurantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
  collection: Collection | null;
  onUpdateRestaurant: (
    restaurantId: string,
    updates: { priceRange?: string; timeToPickUp?: number }
  ) => Promise<void>;
  onRemoveFromCollection: (restaurantId: string) => Promise<void>;
}

export function RestaurantManagementModal({
  isOpen,
  onClose,
  restaurant,
  collection,
  onUpdateRestaurant,
  onRemoveFromCollection,
}: RestaurantManagementModalProps) {
  const [priceRange, setPriceRange] = useState(restaurant?.priceRange || '');
  const [timeToPickUp, setTimeToPickUp] = useState(
    restaurant?.timeToPickUp?.toString() || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);

  const handleSave = async () => {
    if (!restaurant) return;

    setIsLoading(true);
    setError(null);

    try {
      const updates: { priceRange?: string; timeToPickUp?: number } = {};

      if (priceRange !== restaurant.priceRange) {
        updates.priceRange = priceRange || undefined;
      }

      if (timeToPickUp !== restaurant.timeToPickUp?.toString()) {
        updates.timeToPickUp = timeToPickUp
          ? parseInt(timeToPickUp, 10)
          : undefined;
      }

      if (Object.keys(updates).length > 0) {
        await onUpdateRestaurant(restaurant._id.toString(), updates);
      }

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update restaurant'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setShowRemoveConfirmation(true);
  };

  const confirmRemove = async () => {
    if (!restaurant) return;

    setIsLoading(true);
    setError(null);

    try {
      await onRemoveFromCollection(restaurant._id.toString());
      setShowRemoveConfirmation(false);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove restaurant'
      );
      setShowRemoveConfirmation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const priceRangeOptions = [
    { value: '', label: 'Not set' },
    { value: '$', label: '$ - Inexpensive' },
    { value: '$$', label: '$$ - Moderate' },
    { value: '$$$', label: '$$$ - Expensive' },
    { value: '$$$$', label: '$$$$ - Very Expensive' },
  ];

  if (!restaurant || !collection) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Restaurant">
      <div className="space-y-6">
        {/* Restaurant Info */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <RestaurantImage
              src={restaurant.photos?.[0]}
              alt={restaurant.name}
              cuisine={restaurant.cuisine}
              className="w-20 h-20 rounded-lg object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text dark:text-white">
              {restaurant.name}
            </h3>
            <p className="text-sm text-text-light dark:text-text-light">
              {restaurant.cuisine} • {restaurant.rating}⭐
            </p>
            <p className="text-sm text-text-light dark:text-text-light">
              {restaurant.address}
            </p>
          </div>
        </div>

        {/* Collection Info */}
        <div className="bg-surface dark:bg-background rounded-lg p-3">
          <p className="text-sm text-text-light dark:text-text-light">
            <span className="font-medium">Collection:</span> {collection.name}
          </p>
        </div>

        {/* Custom Fields */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="priceRange"
              className="block text-sm font-medium text-text dark:text-text-light mb-1"
            >
              Price Range
            </label>
            <select
              id="priceRange"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-surface dark:text-white"
            >
              {priceRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="timeToPickUp"
              className="block text-sm font-medium text-text dark:text-text-light mb-1"
            >
              Time to Pick Up (minutes)
            </label>
            <Input
              id="timeToPickUp"
              type="number"
              value={timeToPickUp}
              onChange={(e) => setTimeToPickUp(e.target.value)}
              placeholder="e.g., 15"
              min="0"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 dark:bg-destructive/20/20 border border-destructive dark:border-destructive rounded-md p-3">
            <p className="text-sm text-destructive dark:text-destructive">
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border dark:border-border">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            onClick={handleRemove}
            variant="outline"
            disabled={isLoading}
            className="text-destructive border-destructive hover:bg-destructive/10 dark:text-destructive dark:border-destructive dark:hover:bg-destructive/20/20"
          >
            Remove from Collection
          </Button>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={showRemoveConfirmation}
        onClose={() => setShowRemoveConfirmation(false)}
        title="Remove Restaurant?"
      >
        <div className="space-y-4">
          <p className="text-text">
            Are you sure you want to remove this restaurant from the collection?
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowRemoveConfirmation(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
