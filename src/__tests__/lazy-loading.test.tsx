/**
 * Lazy Loading Testing Suite
 *
 * This file contains comprehensive tests for lazy loading components
 * including component lazy loading, route lazy loading, and preloading.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import {
  LazyRestaurantCard,
  LazyCollectionList,
  LazyGroupList,
  LazyMobileDecisionInterface,
  LazyMobileSearchInterface,
  LazyRestaurantSearchResults,
  LazyCreateCollectionForm,
  LazyCreateGroupForm,
  RestaurantCardWithSkeleton,
  CollectionListWithSkeleton,
  GroupListWithSkeleton,
  MobileDecisionInterfaceWithSkeleton,
  MobileSearchInterfaceWithSkeleton,
  RestaurantSearchResultsWithSkeleton,
  CreateCollectionFormWithSkeleton,
  CreateGroupFormWithSkeleton,
} from '@/components/lazy/LazyComponents';

import {
  LazyDashboardRoute,
  LazyRestaurantsRoute,
  LazyGroupsRoute,
  LazyFriendsRoute,
  LazyCollectionRoute,
  useRoutePreloader,
  RoutePreloader,
} from '@/components/lazy/LazyRoutes';

// Mock the components to avoid actual imports
jest.mock('@/components/features/RestaurantCard', () => ({
  RestaurantCard: ({ restaurant }: any) => (
    <div data-testid="restaurant-card">{restaurant.name}</div>
  ),
}));

jest.mock('@/components/features/CollectionList', () => ({
  CollectionList: ({ collections }: any) => (
    <div data-testid="collection-list">
      {collections?.length || 0} collections
    </div>
  ),
}));

jest.mock('@/components/features/GroupList', () => ({
  GroupList: ({ groups }: any) => (
    <div data-testid="group-list">{groups?.length || 0} groups</div>
  ),
}));

jest.mock('@/components/features/MobileDecisionInterface', () => ({
  MobileDecisionInterface: ({ restaurants }: any) => (
    <div data-testid="mobile-decision-interface">
      {restaurants?.length || 0} restaurants
    </div>
  ),
}));

jest.mock('@/components/features/MobileSearchInterface', () => ({
  MobileSearchInterface: ({ searchQuery }: any) => (
    <div data-testid="mobile-search-interface">{searchQuery}</div>
  ),
}));

jest.mock('@/components/features/RestaurantSearchResults', () => ({
  RestaurantSearchResults: ({ restaurants }: any) => (
    <div data-testid="restaurant-search-results">
      {restaurants?.length || 0} results
    </div>
  ),
}));

jest.mock('@/components/forms/CreateCollectionForm', () => ({
  CreateCollectionForm: ({ onSuccess }: any) => (
    <div data-testid="create-collection-form">
      <button onClick={() => onSuccess({ id: '1', name: 'Test Collection' })}>
        Create
      </button>
    </div>
  ),
}));

jest.mock('@/components/forms/CreateGroupForm', () => ({
  CreateGroupForm: ({ onSubmit }: any) => (
    <div data-testid="create-group-form">
      <button onClick={() => onSubmit({ name: 'Test Group' })}>Create</button>
    </div>
  ),
}));

// Mock page components
jest.mock('@/app/dashboard/page', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

jest.mock('@/app/restaurants/page', () => ({
  default: () => <div data-testid="restaurants-page">Restaurants</div>,
}));

jest.mock('@/app/groups/page', () => ({
  default: () => <div data-testid="groups-page">Groups</div>,
}));

jest.mock('@/app/friends/page', () => ({
  default: () => <div data-testid="friends-page">Friends</div>,
}));

jest.mock('@/app/collections/[id]/page', () => ({
  default: () => <div data-testid="collection-page">Collection</div>,
}));

describe('Lazy Loading Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lazy Component Loading', () => {
    it('should lazy load RestaurantCard component', async () => {
      const mockRestaurant = { id: '1', name: 'Test Restaurant' };

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyRestaurantCard restaurant={mockRestaurant} />
        </Suspense>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('restaurant-card')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });

    it('should lazy load CollectionList component', async () => {
      const mockCollections = [
        { id: '1', name: 'Collection 1' },
        { id: '2', name: 'Collection 2' },
      ];

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyCollectionList collections={mockCollections} />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('collection-list')).toBeInTheDocument();
      });

      expect(screen.getByText('2 collections')).toBeInTheDocument();
    });

    it('should lazy load GroupList component', async () => {
      const mockGroups = [
        { id: '1', name: 'Group 1' },
        { id: '2', name: 'Group 2' },
      ];

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyGroupList groups={mockGroups} />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('group-list')).toBeInTheDocument();
      });

      expect(screen.getByText('2 groups')).toBeInTheDocument();
    });

    it('should lazy load MobileDecisionInterface component', async () => {
      const mockRestaurants = [
        { id: '1', name: 'Restaurant 1' },
        { id: '2', name: 'Restaurant 2' },
      ];

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyMobileDecisionInterface restaurants={mockRestaurants} />
        </Suspense>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('mobile-decision-interface')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('2 restaurants')).toBeInTheDocument();
    });

    it('should lazy load MobileSearchInterface component', async () => {
      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyMobileSearchInterface searchQuery="test query" />
        </Suspense>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('mobile-search-interface')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('test query')).toBeInTheDocument();
    });

    it('should lazy load RestaurantSearchResults component', async () => {
      const mockRestaurants = [
        { id: '1', name: 'Restaurant 1' },
        { id: '2', name: 'Restaurant 2' },
      ];

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyRestaurantSearchResults restaurants={mockRestaurants} />
        </Suspense>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('restaurant-search-results')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('2 results')).toBeInTheDocument();
    });

    it('should lazy load CreateCollectionForm component', async () => {
      const mockOnSuccess = jest.fn();

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyCreateCollectionForm onSuccess={mockOnSuccess} />
        </Suspense>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('create-collection-form')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should lazy load CreateGroupForm component', async () => {
      const mockOnSubmit = jest.fn();

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyCreateGroupForm onSubmit={mockOnSubmit} />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('create-group-form')).toBeInTheDocument();
      });

      expect(screen.getByText('Create')).toBeInTheDocument();
    });
  });

  describe('Skeleton Loading States', () => {
    it('should show skeleton for RestaurantCard', () => {
      const mockRestaurant = { id: '1', name: 'Test Restaurant' };

      render(<RestaurantCardWithSkeleton restaurant={mockRestaurant} />);

      // Should show skeleton initially
      expect(
        screen.getByTestId('restaurant-card-skeleton')
      ).toBeInTheDocument();
    });

    it('should show skeleton for CollectionList', () => {
      const mockCollections = [{ id: '1', name: 'Collection 1' }];

      render(<CollectionListWithSkeleton collections={mockCollections} />);

      expect(
        screen.getByTestId('collection-card-skeleton')
      ).toBeInTheDocument();
    });

    it('should show skeleton for GroupList', () => {
      const mockGroups = [{ id: '1', name: 'Group 1' }];

      render(<GroupListWithSkeleton groups={mockGroups} />);

      expect(
        screen.getByTestId('collection-card-skeleton')
      ).toBeInTheDocument();
    });

    it('should show skeleton for MobileDecisionInterface', () => {
      const mockRestaurants = [{ id: '1', name: 'Restaurant 1' }];

      render(
        <MobileDecisionInterfaceWithSkeleton restaurants={mockRestaurants} />
      );

      expect(
        screen.getByTestId('decision-interface-skeleton')
      ).toBeInTheDocument();
    });

    it('should show skeleton for MobileSearchInterface', () => {
      render(<MobileSearchInterfaceWithSkeleton searchQuery="test" />);

      // Should show custom skeleton
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });

    it('should show skeleton for RestaurantSearchResults', () => {
      const mockRestaurants = [{ id: '1', name: 'Restaurant 1' }];

      render(
        <RestaurantSearchResultsWithSkeleton restaurants={mockRestaurants} />
      );

      // Should show multiple skeleton items
      const skeletonItems = screen.getAllByRole('generic');
      expect(skeletonItems).toHaveLength(3); // 3 skeleton items
    });

    it('should show skeleton for CreateCollectionForm', () => {
      const mockOnSuccess = jest.fn();

      render(<CreateCollectionFormWithSkeleton onSuccess={mockOnSuccess} />);

      // Should show form skeleton
      const skeletonItems = screen.getAllByRole('generic');
      expect(skeletonItems).toHaveLength(3); // 3 skeleton items
    });

    it('should show skeleton for CreateGroupForm', () => {
      const mockOnSubmit = jest.fn();

      render(<CreateGroupFormWithSkeleton onSubmit={mockOnSubmit} />);

      // Should show form skeleton
      const skeletonItems = screen.getAllByRole('generic');
      expect(skeletonItems).toHaveLength(3); // 3 skeleton items
    });
  });

  describe('Lazy Route Loading', () => {
    it('should lazy load dashboard route', async () => {
      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyDashboardRoute />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should lazy load restaurants route', async () => {
      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyRestaurantsRoute />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('restaurants-page')).toBeInTheDocument();
      });

      expect(screen.getByText('Restaurants')).toBeInTheDocument();
    });

    it('should lazy load groups route', async () => {
      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyGroupsRoute />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groups-page')).toBeInTheDocument();
      });

      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    it('should lazy load friends route', async () => {
      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyFriendsRoute />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('friends-page')).toBeInTheDocument();
      });

      expect(screen.getByText('Friends')).toBeInTheDocument();
    });

    it('should lazy load collection route', async () => {
      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyCollectionRoute />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByTestId('collection-page')).toBeInTheDocument();
      });

      expect(screen.getByText('Collection')).toBeInTheDocument();
    });
  });

  describe('Route Preloading', () => {
    it('should provide preload functions', () => {
      const { result } = renderHook(() => useRoutePreloader());

      expect(result.current.preloadRoute).toBeDefined();
      expect(result.current.preloadOnHover).toBeDefined();
    });

    it('should preload route on hover', () => {
      const mockPreloadOnHover = jest.fn();
      const { result } = renderHook(() => useRoutePreloader());

      // Mock the preloadOnHover function
      result.current.preloadOnHover = mockPreloadOnHover;

      render(
        <RoutePreloader route="/dashboard">
          <div>Dashboard Link</div>
        </RoutePreloader>
      );

      // Simulate mouse enter
      const link = screen.getByText('Dashboard Link');
      link.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      expect(mockPreloadOnHover).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Error Handling', () => {
    it('should handle component load errors gracefully', async () => {
      // Mock a component that throws an error
      jest.doMock('@/components/features/RestaurantCard', () => {
        throw new Error('Component load error');
      });

      const mockRestaurant = { id: '1', name: 'Test Restaurant' };

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LazyRestaurantCard restaurant={mockRestaurant} />
        </Suspense>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument();
      });
    });
  });
});
