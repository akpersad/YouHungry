'use client';

import { lazy, Suspense } from 'react';
import {
  RestaurantCardSkeleton,
  CollectionCardSkeleton,
  DecisionInterfaceSkeleton,
} from '@/components/ui/Skeleton';
import { Restaurant, Group, Collection } from '@/types/database';

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

interface RestaurantDetailsViewProps {
  restaurant: Restaurant;
  onManage?: () => void;
  onAddToCollection?: () => void;
  showManageButton?: boolean;
  showAddButton?: boolean;
}

interface GroupDecisionMakingProps {
  groupId: string;
  collectionId: string;
  isAdmin: boolean;
}

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

interface FriendSearchProps {
  userId: string;
  onClose?: () => void;
}

interface GroupInvitation {
  _id: string;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  inviterName: string;
  inviterEmail: string;
  createdAt: string;
}

interface GroupInvitationsProps {
  invitations: GroupInvitation[];
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
}

interface DecisionStatisticsProps {
  collectionId: string;
  onClose?: () => void;
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

// Additional lazy-loaded components for better performance
export const LazyRestaurantDetailsView = lazy(() =>
  import('@/components/features/RestaurantDetailsView').then((module) => ({
    default: module.RestaurantDetailsView,
  }))
);

export const LazyGroupDecisionMaking = lazy(() =>
  import('@/components/features/GroupDecisionMaking').then((module) => ({
    default: module.GroupDecisionMaking,
  }))
);

export const LazyDecisionResultModal = lazy(() =>
  import('@/components/features/DecisionResultModal').then((module) => ({
    default: module.DecisionResultModal,
  }))
);

export const LazyRestaurantManagementModal = lazy(() =>
  import('@/components/features/RestaurantManagementModal').then((module) => ({
    default: module.RestaurantManagementModal,
  }))
);

export const LazyFriendSearch = lazy(() =>
  import('@/components/features/FriendSearch').then((module) => ({
    default: module.FriendSearch,
  }))
);

export const LazyGroupInvitations = lazy(() =>
  import('@/components/features/GroupInvitations').then((module) => ({
    default: module.GroupInvitations,
  }))
);

export const LazyDecisionStatistics = lazy(() =>
  import('@/components/features/DecisionStatistics').then((module) => ({
    default: module.DecisionStatistics,
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

// Additional wrapper components with loading states
export function RestaurantDetailsViewWithSkeleton(
  props: RestaurantDetailsViewProps
) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-tertiary rounded-lg" />
          <div className="h-8 bg-tertiary rounded-lg" />
          <div className="h-4 bg-tertiary rounded-lg" />
          <div className="h-4 bg-tertiary rounded-lg w-3/4" />
        </div>
      }
    >
      <LazyRestaurantDetailsView {...props} />
    </Suspense>
  );
}

export function GroupDecisionMakingWithSkeleton(
  props: GroupDecisionMakingProps
) {
  return (
    <Suspense fallback={<DecisionInterfaceSkeleton />}>
      <LazyGroupDecisionMaking {...props} />
    </Suspense>
  );
}

export function DecisionResultModalWithSkeleton(
  props: DecisionResultModalProps
) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tertiary rounded-lg" />
          <div className="h-32 bg-tertiary rounded-lg" />
          <div className="h-10 bg-tertiary rounded-lg" />
        </div>
      }
    >
      <LazyDecisionResultModal {...props} />
    </Suspense>
  );
}

export function RestaurantManagementModalWithSkeleton(
  props: RestaurantManagementModalProps
) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tertiary rounded-lg" />
          <div className="h-20 bg-tertiary rounded-lg" />
          <div className="h-10 bg-tertiary rounded-lg" />
        </div>
      }
    >
      <LazyRestaurantManagementModal {...props} />
    </Suspense>
  );
}

export function FriendSearchWithSkeleton(props: FriendSearchProps) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-tertiary rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-tertiary rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <LazyFriendSearch {...props} />
    </Suspense>
  );
}

export function GroupInvitationsWithSkeleton(props: GroupInvitationsProps) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tertiary rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 bg-tertiary rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <LazyGroupInvitations {...props} />
    </Suspense>
  );
}

export function DecisionStatisticsWithSkeleton(props: DecisionStatisticsProps) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tertiary rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-tertiary rounded-lg" />
            <div className="h-20 bg-tertiary rounded-lg" />
          </div>
        </div>
      }
    >
      <LazyDecisionStatistics {...props} />
    </Suspense>
  );
}
