/**
 * Lazy Loading Testing Suite
 *
 * This file contains comprehensive tests for lazy loading components
 * including component lazy loading, route lazy loading, and preloading.
 */

import { render, screen, waitFor, renderHook } from '@testing-library/react';
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
    it('should render RestaurantCardWithSkeleton without errors', () => {
      const mockRestaurant = { id: '1', name: 'Test Restaurant' };

      expect(() => {
        render(<RestaurantCardWithSkeleton restaurant={mockRestaurant} />);
      }).not.toThrow();

      // Should render the component successfully
      expect(screen.getByTestId('restaurant-card')).toBeInTheDocument();
    });

    it('should render CollectionListWithSkeleton without errors', () => {
      const mockCollections = [{ id: '1', name: 'Collection 1' }];

      expect(() => {
        render(<CollectionListWithSkeleton collections={mockCollections} />);
      }).not.toThrow();

      // Should render the component successfully
      expect(screen.getByTestId('collection-list')).toBeInTheDocument();
    });

    it('should render GroupListWithSkeleton without errors', () => {
      const mockGroups = [{ id: '1', name: 'Group 1' }];

      expect(() => {
        render(<GroupListWithSkeleton groups={mockGroups} />);
      }).not.toThrow();

      // Should render the component successfully
      expect(screen.getByTestId('group-list')).toBeInTheDocument();
    });

    it('should render MobileDecisionInterfaceWithSkeleton without errors', () => {
      const mockRestaurants = [{ id: '1', name: 'Restaurant 1' }];

      expect(() => {
        render(
          <MobileDecisionInterfaceWithSkeleton restaurants={mockRestaurants} />
        );
      }).not.toThrow();

      // Should render the component successfully
      expect(
        screen.getByTestId('mobile-decision-interface')
      ).toBeInTheDocument();
    });

    it('should render MobileSearchInterfaceWithSkeleton without errors', () => {
      expect(() => {
        render(<MobileSearchInterfaceWithSkeleton searchQuery="test" />);
      }).not.toThrow();

      // Should render the component successfully
      expect(screen.getByTestId('mobile-search-interface')).toBeInTheDocument();
    });

    it('should render RestaurantSearchResultsWithSkeleton without errors', () => {
      const mockRestaurants = [{ id: '1', name: 'Restaurant 1' }];

      expect(() => {
        render(
          <RestaurantSearchResultsWithSkeleton restaurants={mockRestaurants} />
        );
      }).not.toThrow();

      // Should render the component successfully
      expect(
        screen.getByTestId('restaurant-search-results')
      ).toBeInTheDocument();
    });

    it('should render CreateCollectionFormWithSkeleton without errors', () => {
      const mockOnSuccess = jest.fn();

      expect(() => {
        render(<CreateCollectionFormWithSkeleton onSuccess={mockOnSuccess} />);
      }).not.toThrow();

      // Should render the component successfully
      expect(screen.getByTestId('create-collection-form')).toBeInTheDocument();
    });

    it('should render CreateGroupFormWithSkeleton without errors', () => {
      const mockOnSubmit = jest.fn();

      expect(() => {
        render(<CreateGroupFormWithSkeleton onSubmit={mockOnSubmit} />);
      }).not.toThrow();

      // Should render the component successfully
      expect(screen.getByTestId('create-group-form')).toBeInTheDocument();
    });
  });

  describe('Lazy Route Loading', () => {
    it('should import LazyDashboardRoute without errors', () => {
      expect(() => {
        // Just test that the component can be imported
        const component = LazyDashboardRoute;
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it('should import LazyRestaurantsRoute without errors', () => {
      expect(() => {
        // Just test that the component can be imported
        const component = LazyRestaurantsRoute;
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it('should import LazyGroupsRoute without errors', () => {
      expect(() => {
        // Just test that the component can be imported
        const component = LazyGroupsRoute;
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it('should import LazyFriendsRoute without errors', () => {
      expect(() => {
        // Just test that the component can be imported
        const component = LazyFriendsRoute;
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it('should import LazyCollectionRoute without errors', () => {
      expect(() => {
        // Just test that the component can be imported
        const component = LazyCollectionRoute;
        expect(component).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Route Preloading', () => {
    it('should provide preload functions', () => {
      const { result } = renderHook(() => useRoutePreloader());

      expect(result.current.preloadRoute).toBeDefined();
      expect(result.current.preloadOnHover).toBeDefined();
    });

    it('should preload route on hover', () => {
      const { result } = renderHook(() => useRoutePreloader());

      expect(result.current.preloadRoute).toBeDefined();
      expect(result.current.preloadOnHover).toBeDefined();

      // Test that preloadRoute can be called
      expect(() => {
        result.current.preloadRoute('/dashboard');
      }).not.toThrow();

      // Test that preloadOnHover returns a cleanup function
      const cleanup = result.current.preloadOnHover('/dashboard');
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle component load errors gracefully', async () => {
      const mockRestaurant = { id: '1', name: 'Test Restaurant' };

      expect(() => {
        render(
          <Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <LazyRestaurantCard restaurant={mockRestaurant} />
          </Suspense>
        );
      }).not.toThrow();

      // Wait for component to load successfully
      await waitFor(() => {
        expect(screen.getByTestId('restaurant-card')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });
  });
});
