'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RestaurantImage } from '@/components/ui/RestaurantImage';
import { Restaurant } from '@/types/database';

interface DecisionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRestaurant: Restaurant | null;
  reasoning: string;
  visitDate: Date;
  onConfirmVisit: () => void;
  onTryAgain: () => void;
  isLoading?: boolean;
}

export function DecisionResultModal({
  isOpen,
  onClose,
  selectedRestaurant,
  reasoning,
  visitDate,
  onConfirmVisit,
  onTryAgain,
  isLoading = false,
}: DecisionResultModalProps) {
  if (!selectedRestaurant) {
    return null;
  }

  const formatVisitDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatPriceRange = (priceRange?: string) => {
    if (!priceRange) return '';
    return priceRange;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decision Made!">
      <div className="space-y-6">
        {/* Selected Restaurant Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0">
                <RestaurantImage
                  src={selectedRestaurant.photos?.[0]}
                  alt={selectedRestaurant.name}
                  cuisine={selectedRestaurant.cuisine}
                  className="w-full md:w-32 h-32 object-cover rounded-lg"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold text-ink">
                    {selectedRestaurant.name}
                  </h3>
                  <p className="text-ink-secondary">
                    {selectedRestaurant.address}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-ink-secondary">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Rating:</span>
                    <span className="text-warning">
                      ★ {selectedRestaurant.rating}
                    </span>
                  </div>

                  {selectedRestaurant.priceRange && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Price:</span>
                      <span>
                        {formatPriceRange(selectedRestaurant.priceRange)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <span className="font-medium">Cuisine:</span>
                    <span>{selectedRestaurant.cuisine}</span>
                  </div>

                  {selectedRestaurant.timeToPickUp && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Pickup Time:</span>
                      <span>{selectedRestaurant.timeToPickUp} min</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit Date */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'var(--tomato-tint)' }}
        >
          <h4 className="font-medium mb-2" style={{ color: 'var(--tomato)' }}>
            Planned visit
          </h4>
          <p className="text-ink tabular-nums">{formatVisitDate(visitDate)}</p>
        </div>

        {/* Reasoning */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h4 className="font-medium text-ink mb-2">Selection reasoning</h4>
          <p className="text-ink-secondary text-sm">{reasoning}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onConfirmVisit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Confirming...' : 'Confirm Visit'}
          </Button>

          <Button
            onClick={onTryAgain}
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            Try Again
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
