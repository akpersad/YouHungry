'use client';

import { lazy, Suspense } from 'react';
import {
  RestaurantCardSkeleton,
  CollectionCardSkeleton,
  DecisionInterfaceSkeleton,
} from '@/components/ui/Skeleton';
import { Restaurant, Group } from '@/types/database';

// Define proper types for component props
interface ComponentProps {
  [key: string]: unknown;
}

// More specific props for components that require specific props
interface RestaurantCardProps {
  restaurant: Restaurant;
  [key: string]: unknown;
}

interface GroupListProps {
  groups: Group[];
  [key: string]: unknown;
}

interface MobileDecisionInterfaceProps {
  restaurants: Restaurant[];
  onVote: (restaurantId: string, vote: 'yes' | 'no') => void;
  onSkip: (restaurantId: string) => void;
  onRandomSelect: () => void;
  onEndDecision: () => void;
  [key: string]: unknown;
}

interface MobileSearchInterfaceProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  currentView: 'list' | 'map' | 'grid';
  onViewToggle: (view: 'list' | 'map' | 'grid') => void;
  [key: string]: unknown;
}

interface RestaurantSearchResultsProps {
  restaurants: Restaurant[];
  isLoading: boolean;
  [key: string]: unknown;
}

interface CreateCollectionFormProps {
  onSuccess: (collection: unknown) => void;
  onCancel: () => void;
  [key: string]: unknown;
}

interface CreateGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    memberEmails?: string[];
  }) => Promise<void>;
  isLoading?: boolean;
  [key: string]: unknown;
}

// Lazy load heavy components
export const LazyRestaurantCard = lazy(() =>
  import('@/components/features/RestaurantCard').then((module) => ({
    default: module.RestaurantCard,
  }))
);

export const LazyCollectionList = lazy(() =>
  import('@/components/features/CollectionList').then((module) => ({
    default: module.CollectionList,
  }))
);

export const LazyGroupList = lazy(() =>
  import('@/components/features/GroupList').then((module) => ({
    default: module.GroupList,
  }))
);

export const LazyMobileDecisionInterface = lazy(() =>
  import('@/components/features/MobileDecisionInterface').then((module) => ({
    default: module.MobileDecisionInterface,
  }))
);

export const LazyMobileSearchInterface = lazy(() =>
  import('@/components/features/MobileSearchInterface').then((module) => ({
    default: module.MobileSearchInterface,
  }))
);

export const LazyRestaurantSearchResults = lazy(() =>
  import('@/components/features/RestaurantSearchResults').then((module) => ({
    default: module.RestaurantSearchResults,
  }))
);

export const LazyCreateCollectionForm = lazy(() =>
  import('@/components/forms/CreateCollectionForm').then((module) => ({
    default: module.CreateCollectionForm,
  }))
);

export const LazyCreateGroupForm = lazy(() =>
  import('@/components/forms/CreateGroupForm').then((module) => ({
    default: module.CreateGroupForm,
  }))
);

// Wrapped components with loading states
export function RestaurantCardWithSkeleton(props: RestaurantCardProps) {
  return (
    <Suspense fallback={<RestaurantCardSkeleton />}>
      <LazyRestaurantCard {...props} />
    </Suspense>
  );
}

export function CollectionListWithSkeleton(props: ComponentProps) {
  return (
    <Suspense fallback={<CollectionCardSkeleton />}>
      <LazyCollectionList {...props} />
    </Suspense>
  );
}

export function GroupListWithSkeleton(props: GroupListProps) {
  return (
    <Suspense fallback={<CollectionCardSkeleton />}>
      <LazyGroupList {...props} />
    </Suspense>
  );
}

export function MobileDecisionInterfaceWithSkeleton(
  props: MobileDecisionInterfaceProps
) {
  return (
    <Suspense fallback={<DecisionInterfaceSkeleton />}>
      <LazyMobileDecisionInterface {...props} />
    </Suspense>
  );
}

export function MobileSearchInterfaceWithSkeleton(
  props: MobileSearchInterfaceProps
) {
  return (
    <Suspense
      fallback={<div className="animate-pulse h-12 bg-tertiary rounded-lg" />}
    >
      <LazyMobileSearchInterface {...props} />
    </Suspense>
  );
}

export function RestaurantSearchResultsWithSkeleton(
  props: RestaurantSearchResultsProps
) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <LazyRestaurantSearchResults {...props} />
    </Suspense>
  );
}

export function CreateCollectionFormWithSkeleton(
  props: CreateCollectionFormProps
) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-tertiary rounded-lg" />
          <div className="h-20 bg-tertiary rounded-lg" />
          <div className="h-10 bg-tertiary rounded-lg" />
        </div>
      }
    >
      <LazyCreateCollectionForm {...props} />
    </Suspense>
  );
}

export function CreateGroupFormWithSkeleton(props: CreateGroupFormProps) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-tertiary rounded-lg" />
          <div className="h-20 bg-tertiary rounded-lg" />
          <div className="h-10 bg-tertiary rounded-lg" />
        </div>
      }
    >
      <LazyCreateGroupForm {...props} />
    </Suspense>
  );
}
