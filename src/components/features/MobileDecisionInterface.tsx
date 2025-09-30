'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { RestaurantCard } from './RestaurantCard';
import { Restaurant } from '@/types/database';
import { TouchGestures } from './MobileSearchInterface';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  swipeVariants,
  progressVariants,
  staggerContainer,
  staggerItem,
} from '@/lib/animations';

interface MobileDecisionInterfaceProps {
  restaurants: Restaurant[];
  onVote: (restaurantId: string, vote: 'yes' | 'no') => void;
  onSkip: (restaurantId: string) => void;
  onRandomSelect: () => void;
  onEndDecision: () => void;
  currentRestaurantIndex?: number;
  votes?: Record<string, 'yes' | 'no'>;
  isDeciding?: boolean;
  className?: string;
}

export function MobileDecisionInterface({
  restaurants,
  onVote,
  onSkip,
  onRandomSelect,
  onEndDecision,
  currentRestaurantIndex = 0,
  votes = {},
  isDeciding = false,
  className,
}: MobileDecisionInterfaceProps) {
  const [showDecisionSheet, setShowDecisionSheet] = useState(false);
  const [showResultsSheet, setShowResultsSheet] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const currentRestaurant = restaurants[currentRestaurantIndex];
  const hasVoted = currentRestaurant && votes[currentRestaurant._id.toString()];

  // Swipe gestures for voting
  const swipeGestures = TouchGestures.useSwipeGesture(
    () => {
      // Swipe left = No vote
      if (currentRestaurant && !hasVoted) {
        setSwipeDirection('left');
        setTimeout(() => {
          onVote(currentRestaurant._id.toString(), 'no');
          setSwipeDirection(null);
        }, 200);
      }
    },
    () => {
      // Swipe right = Yes vote
      if (currentRestaurant && !hasVoted) {
        setSwipeDirection('right');
        setTimeout(() => {
          onVote(currentRestaurant._id.toString(), 'yes');
          setSwipeDirection(null);
        }, 200);
      }
    },
    () => {
      // Swipe up = Skip
      if (currentRestaurant && !hasVoted) {
        onSkip(currentRestaurant._id.toString());
      }
    }
  );

  // Calculate voting progress
  const votedCount = Object.keys(votes).length;
  const totalCount = restaurants.length;
  const progress = totalCount > 0 ? (votedCount / totalCount) * 100 : 0;

  // Calculate results
  const yesVotes = Object.values(votes).filter((vote) => vote === 'yes').length;
  const noVotes = Object.values(votes).filter((vote) => vote === 'no').length;
  const topRestaurants = restaurants
    .filter((restaurant) => votes[restaurant._id.toString()] === 'yes')
    .slice(0, 3);

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tertiary flex items-center justify-center">
            <svg
              className="w-8 h-8 text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">
            Decision Complete!
          </h3>
          <p className="text-secondary">
            You&apos;ve voted on all {totalCount} restaurants.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button
            onClick={() => setShowResultsSheet(true)}
            className="flex-1 touch-target"
          >
            View Results
          </Button>
          <Button
            variant="outline"
            onClick={onEndDecision}
            className="flex-1 touch-target"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">
            Restaurant {currentRestaurantIndex + 1} of {totalCount}
          </h3>
          <span className="text-sm text-secondary">
            {votedCount}/{totalCount} voted
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-tertiary rounded-full h-2">
          <motion.div
            className="bg-accent h-2 rounded-full"
            variants={progressVariants}
            initial="initial"
            animate="animate"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Restaurant Card with Swipe Gestures */}
      <motion.div
        ref={cardRef}
        {...swipeGestures}
        variants={swipeVariants}
        initial="rest"
        animate={swipeDirection || 'rest'}
        className="relative"
      >
        <RestaurantCard
          restaurant={currentRestaurant}
          variant="mobile-optimized"
          showAddButton={false}
          showDetailsButton={false}
        />

        {/* Vote Overlay */}
        {hasVoted && (
          <div className="absolute inset-0 bg-primary/20 rounded-xl flex items-center justify-center">
            <div className="bg-secondary rounded-full p-4 shadow-neumorphic-elevated">
              {votes[currentRestaurant._id.toString()] === 'yes' ? (
                <div className="text-success text-center">
                  <svg
                    className="w-8 h-8 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm font-medium">YES!</p>
                </div>
              ) : (
                <div className="text-error text-center">
                  <svg
                    className="w-8 h-8 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <p className="text-sm font-medium">NO</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Swipe Instructions */}
      {!hasVoted && (
        <div className="text-center space-y-2">
          <p className="text-sm text-secondary">Swipe to vote:</p>
          <div className="flex justify-center gap-6 text-xs text-tertiary">
            <div className="flex items-center gap-1">
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span>Yes</span>
            </div>
            <div className="flex items-center gap-1">
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>No</span>
            </div>
            <div className="flex items-center gap-1">
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
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span>Skip</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <motion.div
        className="flex gap-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {!hasVoted ? (
          <>
            <motion.div variants={staggerItem}>
              <Button
                variant="outline"
                onClick={() => onVote(currentRestaurant._id.toString(), 'no')}
                className="flex-1 touch-target"
                disabled={isDeciding}
              >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  No
                </div>
              </Button>
            </motion.div>
            <motion.div variants={staggerItem}>
              <Button
                variant="outline"
                onClick={() => onSkip(currentRestaurant._id.toString())}
                className="flex-1 touch-target"
                disabled={isDeciding}
              >
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
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  Skip
                </div>
              </Button>
            </motion.div>
            <motion.div variants={staggerItem}>
              <Button
                onClick={() => onVote(currentRestaurant._id.toString(), 'yes')}
                className="flex-1 touch-target"
                disabled={isDeciding}
              >
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Yes
                </div>
              </Button>
            </motion.div>
          </>
        ) : (
          <motion.div variants={staggerItem} className="w-full">
            <Button
              onClick={() => {
                if (currentRestaurantIndex < restaurants.length - 1) {
                  // Move to next restaurant
                  window.location.reload(); // Simple way to trigger next restaurant
                } else {
                  setShowResultsSheet(true);
                }
              }}
              className="w-full touch-target"
            >
              {currentRestaurantIndex < restaurants.length - 1
                ? 'Next Restaurant'
                : 'View Results'}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onRandomSelect}
          className="flex-1 touch-target"
          disabled={isDeciding}
        >
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
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            Random Pick
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowDecisionSheet(true)}
          className="flex-1 touch-target"
        >
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Stats
          </div>
        </Button>
      </div>

      {/* Decision Stats Bottom Sheet */}
      <BottomSheet
        isOpen={showDecisionSheet}
        onClose={() => setShowDecisionSheet(false)}
        title="Decision Progress"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-tertiary rounded-xl">
              <div className="text-2xl font-bold text-accent">{yesVotes}</div>
              <div className="text-sm text-secondary">Yes Votes</div>
            </div>
            <div className="p-4 bg-tertiary rounded-xl">
              <div className="text-2xl font-bold text-error">{noVotes}</div>
              <div className="text-sm text-secondary">No Votes</div>
            </div>
            <div className="p-4 bg-tertiary rounded-xl">
              <div className="text-2xl font-bold text-secondary">
                {totalCount - votedCount}
              </div>
              <div className="text-sm text-secondary">Remaining</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-primary">Top Picks</h4>
            {topRestaurants.length > 0 ? (
              <div className="space-y-2">
                {topRestaurants.map((restaurant, index) => (
                  <div
                    key={restaurant._id.toString()}
                    className="flex items-center gap-3 p-3 bg-tertiary rounded-lg"
                  >
                    <div className="w-8 h-8 bg-accent text-inverse rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">
                        {restaurant.name}
                      </p>
                      <p className="text-sm text-secondary">
                        {restaurant.cuisine}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-sm">No yes votes yet!</p>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Results Bottom Sheet */}
      <BottomSheet
        isOpen={showResultsSheet}
        onClose={() => setShowResultsSheet(false)}
        title="Final Results"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-2">
              Decision Complete!
            </h3>
            <p className="text-secondary">
              You voted on {totalCount} restaurants with {yesVotes} yes votes.
            </p>
          </div>

          {topRestaurants.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-primary">Your Top Picks:</h4>
              <div className="space-y-3">
                {topRestaurants.map((restaurant, index) => (
                  <div
                    key={restaurant._id.toString()}
                    className="p-4 bg-tertiary rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-accent text-inverse rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-primary">
                          {restaurant.name}
                        </h5>
                        <p className="text-sm text-secondary">
                          {restaurant.cuisine}
                        </p>
                        <p className="text-xs text-tertiary mt-1">
                          {restaurant.address}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary mb-4">
                No restaurants received yes votes.
              </p>
              <Button onClick={onRandomSelect} className="touch-target">
                Let&apos;s Pick Randomly
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={onRandomSelect} className="flex-1 touch-target">
              Random Pick
            </Button>
            <Button
              variant="outline"
              onClick={onEndDecision}
              className="flex-1 touch-target"
            >
              Done
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
