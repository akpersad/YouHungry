# Implementation Guidelines - You Hungry? App

This document provides detailed implementation guidelines, coding standards, and best practices for the You Hungry? app development.

## 🎯 Implementation Strategy

**Current Phase**: Epic 7 completed - Custom Authentication Pages with Phone Registration & SMS Opt-in ✅ COMPLETED
**Future Phase**: Continue with remaining epics - Analytics, Polish, Deployment

### Current Technologies (Phase 1-7) ✅ IMPLEMENTED

- Next.js 15 + TypeScript + Tailwind CSS ✅
- MongoDB + Clerk authentication ✅
- Custom authentication pages with phone registration ✅
- Enhanced user schema with location preferences ✅
- Basic REST APIs ✅
- Simple React state management ✅
- Jest + React Testing Library ✅
- Husky + lint-staged ✅
- Bundle Analyzer ✅

### Future Technologies (Phase 3+)

- TanStack Query, Simplified Form Management, Framer Motion, @dnd-kit, GraphQL
- See technical-architecture.md for detailed future technology roadmap

## 🎯 Core Principles

### 1. Mobile-First Development

- **Design Priority**: Mobile devices are the primary target
- **Responsive Design**: Ensure all components work on mobile screens
- **Touch Interactions**: Optimize for touch-based interactions
- **Performance**: Prioritize mobile performance and loading times

### 2. Cost Optimization

- **API Caching**: Implement aggressive caching for all external APIs
- **Batch Requests**: Group API calls to minimize costs
- **Stale-While-Revalidate**: Use SWR pattern for data fetching
- **Local Storage**: Cache data locally to reduce API calls

### 3. Accessibility First

- **WCAG AA Compliance**: Meet accessibility standards
- **Keyboard Navigation**: Ensure all features are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Maintain high contrast ratios

### 4. Performance Optimization

- **Code Splitting**: Lazy load components and routes
- **Image Optimization**: Use Next.js Image component
- **Bundle Size**: Keep bundle size minimal
- **Caching Strategy**: Implement comprehensive caching

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main app routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database utilities
│   ├── api.ts           # API utilities
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
├── constants/           # Application constants
└── styles/             # Additional styles
```

## 🎨 Component Development

### Component Structure

```typescript
// components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "warm"
    | "outline"
    | "outline-accent";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(
          "btn-base", // Base button styles
          {
            "btn-primary": variant === "primary",
            "btn-secondary": variant === "secondary",
            "btn-accent": variant === "accent",
            "btn-warm": variant === "warm",
            "btn-outline": variant === "outline",
            "btn-outline-accent": variant === "outline-accent",
            "btn-sm": size === "sm",
            "btn-md": size === "md",
            "btn-lg": size === "lg",
            "opacity-50 cursor-not-allowed": isLoading,
          },
          className
        )}
        ref={ref}
        disabled={isLoading}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
```

### Component Guidelines

- **Props Interface**: Always define clear TypeScript interfaces
- **Forward Refs**: Use forwardRef for components that need ref access
- **Class Names**: Use cn utility for conditional class names
- **Accessibility**: Include proper ARIA attributes
- **Documentation**: Add JSDoc comments for complex components

## 🗄️ Database Operations

### Database Connection

```typescript
// lib/db.ts
import { MongoClient, Db } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
let db: Db;

export async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE);
  }
  return db;
}
```

### Data Models

```typescript
// types/database.ts
export interface User {
  _id: ObjectId;
  clerkId: string;
  email: string;
  name: string;
  // ... other fields
}

export interface Restaurant {
  _id: ObjectId;
  googlePlaceId: string;
  name: string;
  // ... other fields
}
```

### Database Operations

```typescript
// lib/restaurants.ts
import { connectToDatabase } from './db';
import { Restaurant } from '@/types/database';

export async function getRestaurantById(
  id: string
): Promise<Restaurant | null> {
  const db = await connectToDatabase();
  const restaurant = await db
    .collection('restaurants')
    .findOne({ _id: new ObjectId(id) });
  return restaurant as Restaurant | null;
}

export async function searchRestaurants(
  query: string,
  location?: string
): Promise<Restaurant[]> {
  const db = await connectToDatabase();
  const restaurants = await db
    .collection('restaurants')
    .find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { cuisine: { $regex: query, $options: 'i' } },
      ],
    })
    .limit(20)
    .toArray();

  return restaurants as Restaurant[];
}
```

## 🔌 API Development

### API Route Structure

```typescript
// app/api/restaurants/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchRestaurants } from '@/lib/restaurants';
import { validateSearchParams } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');

    // Validate parameters
    const validation = validateSearchParams({ query, location });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error },
        { status: 400 }
      );
    }

    // Search restaurants
    const restaurants = await searchRestaurants(query!, location || undefined);

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### API Guidelines

- **Error Handling**: Always handle errors gracefully
- **Validation**: Validate all input parameters
- **Response Format**: Use consistent response format
- **Status Codes**: Use appropriate HTTP status codes
- **Rate Limiting**: Implement rate limiting where needed

## 🎣 Custom Hooks

### Enhanced API State Management with TanStack Query ✅ IMPLEMENTED

**Implementation Status**: ✅ COMPLETED

TanStack Query has been fully implemented with:

- QueryClient provider setup in app layout
- Comprehensive API hooks for collections, restaurants, and decisions
- Optimistic updates for all mutations
- Intelligent caching strategies
- Error handling with retry logic
- Component migration completed
- Test updates with TestQueryProvider

```typescript
// Example: Restaurant search with TanStack Query (IMPLEMENTED)
export function useRestaurantSearch(filters: RestaurantFilters) {
  return useQuery({
    queryKey: ['restaurants', 'search', filters],
    queryFn: () => searchRestaurants(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes for search results
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
  });
}

// Optimistic updates for vote submission
export function useSubmitVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitVote,
    onMutate: async (newVote) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['decisions'] });

      // Snapshot previous value
      const previousDecisions = queryClient.getQueryData(['decisions']);

      // Optimistically update
      queryClient.setQueryData(['decisions'], (old: any) => ({
        ...old,
        votes: [...old.votes, newVote],
      }));

      return { previousDecisions };
    },
    onError: (err, newVote, context) => {
      // Rollback on error
      queryClient.setQueryData(['decisions'], context?.previousDecisions);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}
```

### GraphQL Hooks (Enhanced with TanStack Query)

```typescript
// hooks/useGraphQL.ts
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useQuery as useTanStackQuery } from '@tanstack/react-query';
import {
  GET_DASHBOARD_DATA,
  SEARCH_RESTAURANTS,
  SUBMIT_VOTE,
} from '@/graphql/queries';

// Dashboard data hook
export function useDashboardData(userId: string) {
  const { data, loading, error } = useQuery(GET_DASHBOARD_DATA, {
    variables: { userId },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  return {
    dashboardData: data?.user,
    loading,
    error,
    refetch: () => data?.refetch(),
  };
}

// Restaurant search hook
export function useRestaurantSearch(filters: RestaurantFilters) {
  const { data, loading, error, fetchMore } = useQuery(SEARCH_RESTAURANTS, {
    variables: { filters },
    errorPolicy: 'all',
  });

  return {
    restaurants: data?.restaurants,
    loading,
    error,
    loadMore: () =>
      fetchMore({
        variables: {
          filters: { ...filters, offset: data?.restaurants?.length || 0 },
        },
      }),
  };
}

// Real-time decision updates hook
export function useDecisionUpdates(decisionId: string) {
  const { data, loading, error } = useSubscription(DECISION_UPDATED, {
    variables: { decisionId },
    errorPolicy: 'all',
  });

  return {
    decisionUpdate: data?.decisionUpdated,
    loading,
    error,
  };
}

// Vote submission hook
export function useSubmitVote() {
  const [submitVote, { loading, error }] = useMutation(SUBMIT_VOTE, {
    errorPolicy: 'all',
  });

  const handleSubmitVote = async (decisionId: string, rankings: string[]) => {
    try {
      const result = await submitVote({
        variables: { decisionId, rankings },
        optimisticResponse: {
          submitVote: {
            success: true,
            vote: {
              user: { name: 'You' },
              rankings,
            },
          },
        },
      });
      return result.data?.submitVote;
    } catch (err) {
      console.error('Vote submission error:', err);
      throw err;
    }
  };

  return {
    submitVote: handleSubmitVote,
    loading,
    error,
  };
}
```

### GraphQL Hook Guidelines

- **Error Handling**: Always use `errorPolicy: 'all'` for graceful degradation
- **Loading States**: Provide loading states for better UX
- **Optimistic Updates**: Use optimistic responses for immediate feedback
- **Cache Management**: Leverage Apollo Client's normalized cache
- **Network Status**: Use `notifyOnNetworkStatusChange` for better loading states

### ✅ Simplified Form Management Implementation (COMPLETED)

**Approach**: React useState with custom validation functions instead of complex form libraries

#### **Implementation Pattern**

```typescript
// Example: CreateCollectionForm.tsx
import { useState } from 'react';
import { validateCollectionName, validateCollectionDescription } from '@/lib/validation';

export function CreateCollectionForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using simple validation functions
    const nameError = validateCollectionName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    const descriptionError = validateCollectionDescription(description);
    if (descriptionError) {
      setError(descriptionError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Submit to API
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type: 'personal',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Handle success
        setName('');
        setDescription('');
      } else {
        setError(result.error || 'Failed to create collection');
      }
    } catch {
      setError('Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-error text-sm" role="alert">{error}</p>
        </div>
      )}

      <div className="w-full">
        <label htmlFor="name" className="block text-sm font-medium text-text mb-1">
          Collection Name
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Favorite Pizza Places"
          required
        />
      </div>

      <div className="w-full">
        <label htmlFor="description" className="block text-sm font-medium text-text mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your collection..."
          className="input-base min-h-[80px] resize-none"
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !name.trim()}>
        {isSubmitting ? 'Creating...' : 'Create Collection'}
      </Button>
    </form>
  );
}
```

#### **Validation Functions**

```typescript
// lib/validation.ts
export const validateCollectionName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Collection name is required';
  }
  if (name.length > 100) {
    return 'Collection name must be 100 characters or less';
  }
  return null;
};

export const validateCollectionDescription = (
  description: string
): string | null => {
  if (description.length > 500) {
    return 'Description must be 500 characters or less';
  }
  return null;
};

export const validateLocation = (location: string): string | null => {
  if (!location.trim()) {
    return 'Location is required';
  }
  if (location.length > 200) {
    return 'Location must be 200 characters or less';
  }
  return null;
};
```

#### **Benefits of Simplified Approach**

- ✅ **Reliable**: No complex form state management issues
- ✅ **Performant**: No unnecessary re-renders or validation overhead
- ✅ **Maintainable**: Easy to understand and modify
- ✅ **Testable**: Simple, straightforward testing
- ✅ **Debuggable**: Clear error messages and state flow
- ✅ **Lightweight**: No additional dependencies or bundle size

## 🎯 Group Decision Making Implementation

### ✅ Advanced Group Decision System (Epic 4 - COMPLETED)

**Comprehensive group decision making with real-time collaboration**

#### **Core Implementation Patterns**

**Real-time Subscription Hook**:

```typescript
// hooks/api/useGroupDecisionSubscription.ts
export function useGroupDecisionSubscription(
  groupId: string,
  onDecisionUpdate?: (decision: GroupDecision) => void,
  enabled: boolean = true
) {
  const [decisions, setDecisions] = useState<GroupDecision[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !groupId) return;

    // WebSocket connection logic
    const ws = new WebSocket(
      `ws://localhost:3000/api/ws/group-decisions?groupId=${groupId}`
    );

    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'decision_update') {
        setDecisions((prev) => updateDecisions(prev, data.decision));
        onDecisionUpdate?.(data.decision);
      }
    };
    ws.onerror = (error) => setError(error);
    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, [groupId, enabled, onDecisionUpdate]);

  return { decisions, isConnected, error, reconnect: () => {} };
}
```

**Drag-and-Drop Ranking Interface**:

```typescript
// components/features/GroupDecisionMaking.tsx
const handleDragStart = (e: React.DragEvent, restaurantId: string) => {
  setDraggedItem(restaurantId);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e: React.DragEvent, targetIndex: number) => {
  e.preventDefault();
  if (!draggedItem) return;

  const newRankings = [...rankings];
  const draggedIndex = newRankings.indexOf(draggedItem);

  if (draggedIndex !== -1) {
    newRankings.splice(draggedIndex, 1);
  }

  newRankings.splice(targetIndex, 0, draggedItem);
  setRankings(newRankings);
  setDraggedItem(null);
};
```

**Weighted Scoring Algorithm**:

```typescript
// lib/decisions.ts
export function calculateWeightedScores(votes: Vote[]): Record<string, number> {
  const scores: Record<string, number> = {};

  votes.forEach((vote) => {
    vote.rankings.forEach((restaurantId, index) => {
      const weight = vote.rankings.length - index; // 1st = 3, 2nd = 2, 3rd = 1
      scores[restaurantId] = (scores[restaurantId] || 0) + weight;
    });
  });

  return scores;
}
```

**Decision Management API**:

```typescript
// app/api/decisions/group/vote/route.ts
export async function POST(request: NextRequest) {
  const { decisionId, rankings } = await request.json();
  const user = await requireAuth();

  const result = await submitGroupVote(
    decisionId,
    user._id.toString(),
    rankings
  );

  if (result.success) {
    // Broadcast update to all group members
    await broadcastDecisionUpdate(decisionId);
  }

  return NextResponse.json(result);
}
```

#### **Key Implementation Features**

**Real-time Collaboration**:

- WebSocket-based live updates for vote submissions
- Automatic UI updates when decisions are completed
- Connection status monitoring with fallback queries
- Optimistic updates for immediate user feedback

**Voting System**:

- Drag-and-drop restaurant ranking interface
- Weighted scoring algorithm (1st = 3 points, 2nd = 2 points, 3rd = 1 point)
- Re-voting capability until decision is closed
- Vote status indicators and participant tracking

**Decision Management**:

- Admin controls for creating, completing, and closing decisions
- 24-hour visibility window for completed decisions
- Automatic participant deduplication
- Detailed restaurant information display

**Error Handling**:

- Graceful fallback to regular queries when WebSocket fails
- Connection error recovery with automatic reconnection
- Comprehensive error messages and user feedback
- Optimistic updates with rollback on errors

#### **Testing Implementation**

**Component Tests**:

```typescript
// components/features/__tests__/GroupDecisionMaking.test.tsx
describe('GroupDecisionMaking', () => {
  it('handles drag and drop for restaurant rankings', async () => {
    renderWithQueryClient(<GroupDecisionMaking {...props} />);

    // Test drag and drop functionality
    fireEvent.dragStart(screen.getByTestId('restaurant-1'));
    fireEvent.dragOver(screen.getByTestId('ranking-slot-0'));
    fireEvent.drop(screen.getByTestId('ranking-slot-0'));

    expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
  });
});
```

**API Tests**:

```typescript
// app/api/__tests__/group-vote.test.ts
describe('/api/decisions/group/vote', () => {
  it('submits a vote successfully', async () => {
    mockSubmitGroupVote.mockResolvedValue({ success: true });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

**Library Tests**:

```typescript
// lib/__tests__/group-decisions.test.ts
describe('submitGroupVote', () => {
  it('creates new vote if user has not voted before', async () => {
    const result = await submitGroupVote('decision_123', 'user_123', [
      'restaurant_1',
    ]);

    expect(result.success).toBe(true);
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { _id: new ObjectId('decision_123') },
      { $push: { votes: expect.any(Object) } }
    );
  });
});
```

#### **Performance Optimizations**

**Caching Strategy**:

- TanStack Query for API response caching
- Real-time updates with optimistic UI updates
- Fallback queries when subscriptions fail
- Intelligent cache invalidation on vote submission

**User Experience**:

- Immediate UI feedback for all actions
- Loading states and error handling
- Smooth drag-and-drop interactions
- Responsive design for mobile and desktop

**Scalability**:

- Efficient database queries with proper indexing
- WebSocket connection management
- Participant deduplication and validation
- Error recovery and connection resilience

### Data Fetching Hook (Legacy - Use TanStack Query Instead)

```typescript
// hooks/useRestaurants.ts - DEPRECATED: Use TanStack Query hooks above
import { useState, useEffect } from 'react';
import { Restaurant } from '@/types/database';

interface UseRestaurantsOptions {
  query?: string;
  location?: string;
  enabled?: boolean;
}

export function useRestaurants({
  query,
  location,
  enabled = true,
}: UseRestaurantsOptions) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !query) return;

    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/restaurants/search?q=${encodeURIComponent(
            query
          )}&location=${encodeURIComponent(location || '')}`
        );
        if (!response.ok) throw new Error('Failed to fetch restaurants');

        const data = await response.json();
        setRestaurants(data.restaurants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [query, location, enabled]);

  return { restaurants, loading, error };
}
```

### Phase 3: Animation & Polish with Framer Motion (Pending Implementation)

**Objective**: Add sophisticated animations, micro-interactions, and final polish for premium mobile experience.

**Key Implementation Patterns:**

```typescript
// lib/animations.ts - Animation configuration
import { Variants } from 'framer-motion';

// Page transitions
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

// Card animations
export const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

// Staggered list animations
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Usage in components
import { motion } from 'framer-motion';
import { cardVariants, listVariants } from '@/lib/animations';

function RestaurantList({ restaurants }) {
  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      {restaurants.map(restaurant => (
        <motion.div
          key={restaurant.id}
          variants={cardVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <RestaurantCard restaurant={restaurant} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Touch gestures
export const swipeGesture = {
  onSwipeLeft: (callback) => ({ x: -100 }),
  onSwipeRight: (callback) => ({ x: 100 }),
  onSwipeUp: (callback) => ({ y: -100 }),
};

// Skeleton loading animations
function SkeletonCard() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="skeleton-card"
    />
  );
}

// Reduced motion support
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const getAnimationDuration = (normalDuration: number) =>
  shouldReduceMotion ? 0.01 : normalDuration;
```

**Animation Guidelines:**

- Keep animations subtle (< 500ms duration)
- Use GPU-accelerated properties (transform, opacity)
- Always respect `prefers-reduced-motion`
- Test on mobile devices for 60fps performance
- Use `will-change` hints for animated elements

**PWA Implementation (Epic 5 Story 2):**

```typescript
// Service worker caching strategy
const CACHE_NAME = 'you-hungry-v1';
const CACHE_URLS = ['/', '/restaurants', '/collections'];

// App manifest configuration
{
  "name": "You Hungry",
  "short_name": "YouHungry",
  "display": "standalone",
  "theme_color": "#ff3366",
  "background_color": "#fafafa",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ]
}

// Push notification manager
class PushNotificationManager {
  async subscribe() {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
  }
}
```

---

### Drag & Drop Implementation with @dnd-kit (Future Implementation)

```typescript
// components/RestaurantRanking.tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RestaurantRankingProps {
  restaurants: Restaurant[];
  onRankingChange: (restaurants: Restaurant[]) => void;
}

export function RestaurantRanking({
  restaurants,
  onRankingChange,
}: RestaurantRankingProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = restaurants.findIndex((item) => item.id === active.id);
      const newIndex = restaurants.findIndex((item) => item.id === over.id);

      onRankingChange(arrayMove(restaurants, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={restaurants.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        {restaurants.map((restaurant) => (
          <SortableRestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: restaurant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="restaurant-ranking-card"
    >
      <RestaurantCard restaurant={restaurant} />
    </div>
  );
}
```

### Animation Implementation with Framer Motion

```typescript
// components/AnimatedCard.tsx
import { motion } from "framer-motion";
import { useState } from "react";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedCard({ children, className }: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// Loading skeleton animation
export function SkeletonCard() {
  return (
    <motion.div
      className="skeleton-card"
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-subtitle" />
      </div>
    </motion.div>
  );
}
```

### Notification System with Sonner ✅ IMPLEMENTED

Epic 7 has implemented a comprehensive notification system with multiple channels:

```typescript
// lib/notification-service.ts - Unified notification orchestrator
export class NotificationService {
  async sendGroupDecisionNotification(
    decision: GroupDecision,
    recipient: NotificationRecipient,
    channels: NotificationChannels
  ) {
    const results = await Promise.allSettled([
      channels.smsEnabled && this.sendSMS(recipient, decision),
      channels.emailEnabled && this.sendEmail(recipient, decision),
      channels.pushEnabled && this.sendPush(recipient, decision),
      channels.inAppEnabled &&
        this.createInAppNotification(recipient, decision),
      channels.toastEnabled && this.showToast(decision),
    ]);

    // Log any failures but don't throw - graceful degradation
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Notification channel ${index} failed:`, result.reason);
      }
    });
  }
}

// lib/toast-notifications.ts - Sonner integration
import { toast } from 'sonner';

export class ToastNotificationService {
  static success(message: string, options?: { description?: string }) {
    toast.success(message, {
      description: options?.description,
      duration: 4000,
      position: 'top-center',
    });
  }

  static error(message: string, options?: { description?: string }) {
    toast.error(message, {
      description: options?.description,
      duration: 6000,
      position: 'top-center',
    });
  }

  // Predefined notification messages
  static collectionCreated(name: string) {
    this.success('Collection created!', { description: name });
  }

  static restaurantAdded(name: string) {
    this.success('Restaurant added!', { description: name });
  }

  static groupDecisionStarted(groupName: string, type: string) {
    this.info(`New ${type} decision in ${groupName}`, {
      description: 'Tap to vote now',
    });
  }
}

// lib/sms-notifications.ts - Twilio SMS integration
export async function sendSMS(phoneNumber: string, message: string) {
  const response = await fetch('/api/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phoneNumber,
      message: message,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send SMS');
  }

  return response.json();
}

// lib/user-email-notifications.ts - Resend email integration
export async function sendEmail(
  to: string,
  type: EmailNotificationType,
  data: EmailNotificationData
) {
  const response = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, type, data }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return response.json();
}

// lib/in-app-notifications.ts - Database-backed notifications
export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) {
  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type, title, message, data }),
  });

  if (!response.ok) {
    throw new Error('Failed to create notification');
  }

  return response.json();
}

// lib/push-notifications.ts - PWA push notifications
export class PushNotificationManager {
  async subscribe(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  async sendTestNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('You Hungry? Test', {
        body: 'This is a test notification from your PWA!',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: 'test-notification',
        requireInteraction: false,
      });
    }
  }
}

// hooks/useInAppNotifications.ts - React hook for in-app notifications
export function useInAppNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// hooks/useEmailNotifications.ts - React hook for email notifications
export function useEmailNotifications() {
  const queryClient = useQueryClient();

  const testEmail = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return response.json();
    },
    onSuccess: () => {
      ToastNotificationService.success('Test email sent successfully!');
    },
  });

  return { testEmail };
}

// Usage examples
export function useDecisionNotifications() {
  const handleVoteSubmitted = () => {
    ToastNotificationService.success('Your vote has been submitted!');
  };

  const handleDecisionComplete = (restaurant: Restaurant) => {
    ToastNotificationService.success(
      `Decision made! You're going to ${restaurant.name}`
    );
  };

  const handleError = (error: string) => {
    ToastNotificationService.error(`Something went wrong: ${error}`);
  };

  return {
    handleVoteSubmitted,
    handleDecisionComplete,
    handleError,
  };
}
```

### Hook Guidelines

- **Single Responsibility**: Each hook should have one clear purpose
- **Error Handling**: Always handle errors in hooks
- **Loading States**: Provide loading states for async operations
- **Dependencies**: Properly manage useEffect dependencies
- **Cleanup**: Clean up subscriptions and timers
- **TypeScript**: Use proper typing for all hooks
- **Performance**: Use React.memo and useMemo where appropriate

### GraphQL Implementation Guidelines

#### Server-Side (API Routes)

```typescript
// app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { authContext } from '@/lib/auth-context';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authContext,
  introspection: process.env.NODE_ENV === 'development',
});

export const handler = startServerAndCreateNextHandler(server, {
  context: async (req, res) => {
    return await authContext(req, res);
  },
});
```

#### Client-Side Setup

```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: '/api/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken(); // Get from Clerk or localStorage
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Restaurant: {
        fields: {
          weight: {
            merge: false, // Always use server value for weights
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
```

#### GraphQL Best Practices

- **Schema Design**: Design schema around user workflows, not database structure
- **Query Optimization**: Use DataLoader for N+1 query problems
- **Error Handling**: Implement comprehensive error handling and logging
- **Security**: Validate all inputs and implement rate limiting
- **Caching**: Use appropriate cache policies for different data types
- **Subscriptions**: Use sparingly and implement proper cleanup

## 🎨 Styling Guidelines

### Tailwind CSS Usage

```typescript
// Use design system classes
const buttonClasses = cn(
  'btn-base', // Base button styles from design system
  'btn-primary', // Primary variant
  'btn-md', // Medium size
  'hover:btn-primary-hover', // Hover state
  'focus:btn-primary-focus', // Focus state
  'disabled:btn-primary-disabled' // Disabled state
);
```

### CSS Custom Properties

```css
/* globals.css */
:root {
  /* Primary Colors (for backgrounds/headings) */
  --color-primary: #386641; /* Rich Green */
  --color-secondary: #6f4e37; /* Earthy Brown */
  --color-accent: #9a2229; /* Deep Red */

  /* Secondary Colors (for accents/buttons) */
  --color-warm-yellow: #ffd23f;
  --color-creamy-off-white: #fff8e1;

  /* Text Colors */
  --color-text: #222222; /* Dark Gray/Black */
  --color-text-white: #ffffff; /* Pure White for dark backgrounds */

  /* Background Colors */
  --color-background: #fff8e1; /* Creamy Off-white */
  --color-surface: #ffffff;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

### Responsive Design

```typescript
// Mobile-first responsive classes
const containerClasses = cn(
  'w-full', // Mobile: full width
  'md:w-1/2', // Tablet: half width
  'lg:w-1/3', // Desktop: third width
  'xl:w-1/4' // Large desktop: quarter width
);
```

## 🛡️ Error Handling & Boundaries

### Error Boundary Implementation

```typescript
// components/ErrorBoundary.tsx
import React from "react";
import { toast } from "sonner";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Send to error monitoring service
    // errorReporting.captureException(error, { extra: errorInfo });

    // Show user-friendly notification
    toast.error("Something went wrong. Please try refreshing the page.");
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="error-boundary">
      <h2>Oops! Something went wrong</h2>
      <p>We're sorry, but something unexpected happened.</p>
      <button onClick={resetError} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}

// Usage in app layout
export function AppWithErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ErrorBoundary fallback={RestaurantErrorFallback}>
        {children}
      </ErrorBoundary>
    </ErrorBoundary>
  );
}

function RestaurantErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="restaurant-error-fallback">
      <h3>Unable to load restaurants</h3>
      <p>There was a problem loading restaurant data. Please try again.</p>
      <button onClick={resetError} className="btn-secondary">
        Retry
      </button>
    </div>
  );
}
```

### API Error Handling

```typescript
// lib/api-error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        toast.error('Invalid request. Please check your input.');
        break;
      case 401:
        toast.error('Please sign in to continue.');
        break;
      case 403:
        toast.error("You don't have permission to perform this action.");
        break;
      case 404:
        toast.error('The requested resource was not found.');
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error('An unexpected error occurred.');
    }
  } else {
    toast.error('Network error. Please check your connection.');
  }
}

// Usage in API calls
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    handleAPIError(error);
    throw error;
  }
}
```

## 🧪 Testing Guidelines

### Component Testing

```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../ui/Button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" })
    ).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when isLoading is true", () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### API Testing

```typescript
// app/api/__tests__/restaurants/search.test.ts
import { GET } from '../search/route';
import { NextRequest } from 'next/server';

describe('/api/restaurants/search', () => {
  it('returns restaurants for valid query', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/restaurants/search?q=pizza'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.restaurants).toBeDefined();
    expect(Array.isArray(data.restaurants)).toBe(true);
  });

  it('returns error for missing query', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/restaurants/search'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
```

## 📱 PWA Implementation

### Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'you-hungry-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
```

### App Manifest

```json
{
  "name": "You Hungry",
  "short_name": "YouHungry",
  "description": "Decide where to eat with friends",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fff8e1",
  "theme_color": "#386641",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔒 Security Guidelines

### Input Validation

```typescript
// lib/validation.ts
import { z } from 'zod';

export const searchParamsSchema = z.object({
  query: z.string().min(1).max(100),
  location: z.string().max(200).optional(),
});

export function validateSearchParams(data: unknown) {
  try {
    const validated = searchParamsSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Authentication Middleware (UPDATED ✅ IMPLEMENTED)

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/api/restaurants/search',
    '/sign-in', // Added custom sign-in page
    '/sign-up', // Added custom sign-up page
  ],
  ignoredRoutes: ['/api/webhooks/clerk'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

**Key Middleware Updates Implemented**:

- Added `/sign-in` and `/sign-up` as public routes
- Proper authentication flow for custom pages
- Route protection for new authentication system

## 📊 Performance Guidelines

### Code Splitting

```typescript
// Lazy load components
import { lazy, Suspense } from "react";

const RestaurantSearch = lazy(() => import("@/components/RestaurantSearch"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RestaurantSearch />
    </Suspense>
  );
}
```

### Caching Strategy

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedRestaurants = unstable_cache(
  async (query: string) => {
    // Expensive database query
    return await searchRestaurants(query);
  },
  ['restaurants'],
  {
    tags: ['restaurants'],
    revalidate: 3600, // 1 hour
  }
);
```

## 📝 Documentation Guidelines

### Component Documentation

```typescript
/**
 * Button component with multiple variants and sizes
 *
 * @param variant - Visual style variant ('primary' | 'secondary' | 'accent' | 'warm' | 'outline' | 'outline-accent')
 * @param size - Button size ('sm' | 'md' | 'lg')
 * @param isLoading - Whether the button is in loading state
 * @param children - Button content
 */
interface ButtonProps {
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'warm'
    | 'outline'
    | 'outline-accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}
```

### API Documentation

````typescript
/**
 * Search for restaurants by query and location
 *
 * @param query - Search query string
 * @param location - Optional location string
 * @returns Promise<Restaurant[]> - Array of matching restaurants
 *
 * @example
 * ```typescript
 * const restaurants = await searchRestaurants('pizza', 'New York');
 * ```
 */
export async function searchRestaurants(
  query: string,
  location?: string
): Promise<Restaurant[]> {
  // Implementation
}
````

## 👤 User Profile Management Implementation ✅ IMPLEMENTED

Epic 7 Story 6 has implemented a comprehensive user profile management system:

**Note**: Profile pictures, names, and emails are managed through Clerk and synced to MongoDB via webhook. The app displays these values but users must update them through their Clerk account.

```typescript
// hooks/useProfile.ts - Profile management hook
export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      return response.json();
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      ToastNotificationService.success('Profile updated successfully!');
    },
  });

  return { profile, isLoading, updateProfile };
}

// Profile pictures are synced from Clerk via webhook
// See: /api/webhooks/clerk/route.ts for webhook handling
```

## 🚀 Deployment Guidelines

### Environment Variables

```bash
# .env.local - Database
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=you-hungry

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Google APIs
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Twilio SMS (Epic 7)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+18663101886
TWILIO_MESSAGING_SERVICE_SID=MG...  # Optional

# Resend Email (Epic 7)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Build Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['maps.googleapis.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
```

## 📋 Checklist for New Features

### Before Implementation

- [ ] Define clear requirements and acceptance criteria
- [ ] Create TypeScript interfaces for all data structures
- [ ] Plan component hierarchy and props
- [ ] Consider mobile-first design implications
- [ ] Plan caching strategy for any API calls
- [ ] Consider accessibility requirements

### During Implementation

- [ ] Follow established coding patterns
- [ ] Write comprehensive tests
- [ ] Ensure mobile responsiveness
- [ ] Implement proper error handling
- [ ] Add loading states
- [ ] Consider performance implications

### After Implementation

- [ ] Test on multiple devices and browsers
- [ ] Verify accessibility compliance
- [ ] Check performance metrics
- [ ] Update documentation
- [ ] Review code for optimization opportunities
- [ ] Test error scenarios
