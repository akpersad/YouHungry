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
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedRestaurant.name}
                  </h3>
                  <p className="text-gray-600">{selectedRestaurant.address}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Rating:</span>
                    <span className="text-yellow-600">
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Planned Visit</h4>
          <p className="text-blue-800">{formatVisitDate(visitDate)}</p>
        </div>

        {/* Reasoning */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Selection Reasoning
          </h4>
          <p className="text-gray-700 text-sm">{reasoning}</p>
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
