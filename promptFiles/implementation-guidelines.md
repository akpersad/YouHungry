# Implementation Guidelines - You Hungry? App

This document provides detailed implementation guidelines, coding standards, and best practices for the You Hungry? app development.

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
import { MongoClient, Db } from "mongodb";

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
import { connectToDatabase } from "./db";
import { Restaurant } from "@/types/database";

export async function getRestaurantById(
  id: string
): Promise<Restaurant | null> {
  const db = await connectToDatabase();
  const restaurant = await db
    .collection("restaurants")
    .findOne({ _id: new ObjectId(id) });
  return restaurant as Restaurant | null;
}

export async function searchRestaurants(
  query: string,
  location?: string
): Promise<Restaurant[]> {
  const db = await connectToDatabase();
  const restaurants = await db
    .collection("restaurants")
    .find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { cuisine: { $regex: query, $options: "i" } },
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
import { NextRequest, NextResponse } from "next/server";
import { searchRestaurants } from "@/lib/restaurants";
import { validateSearchParams } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const location = searchParams.get("location");

    // Validate parameters
    const validation = validateSearchParams({ query, location });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error },
        { status: 400 }
      );
    }

    // Search restaurants
    const restaurants = await searchRestaurants(query!, location || undefined);

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

### GraphQL Hooks

```typescript
// hooks/useGraphQL.ts
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import {
  GET_DASHBOARD_DATA,
  SEARCH_RESTAURANTS,
  SUBMIT_VOTE,
} from "@/graphql/queries";

// Dashboard data hook
export function useDashboardData(userId: string) {
  const { data, loading, error } = useQuery(GET_DASHBOARD_DATA, {
    variables: { userId },
    errorPolicy: "all",
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
    errorPolicy: "all",
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
    errorPolicy: "all",
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
    errorPolicy: "all",
  });

  const handleSubmitVote = async (decisionId: string, rankings: string[]) => {
    try {
      const result = await submitVote({
        variables: { decisionId, rankings },
        optimisticResponse: {
          submitVote: {
            success: true,
            vote: {
              user: { name: "You" },
              rankings,
            },
          },
        },
      });
      return result.data?.submitVote;
    } catch (err) {
      console.error("Vote submission error:", err);
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

### Data Fetching Hook

```typescript
// hooks/useRestaurants.ts
import { useState, useEffect } from "react";
import { Restaurant } from "@/types/database";

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
          )}&location=${encodeURIComponent(location || "")}`
        );
        if (!response.ok) throw new Error("Failed to fetch restaurants");

        const data = await response.json();
        setRestaurants(data.restaurants);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [query, location, enabled]);

  return { restaurants, loading, error };
}
```

### Hook Guidelines

- **Single Responsibility**: Each hook should have one clear purpose
- **Error Handling**: Always handle errors in hooks
- **Loading States**: Provide loading states for async operations
- **Dependencies**: Properly manage useEffect dependencies
- **Cleanup**: Clean up subscriptions and timers

### GraphQL Implementation Guidelines

#### Server-Side (API Routes)

```typescript
// app/api/graphql/route.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { authContext } from "@/lib/auth-context";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authContext,
  introspection: process.env.NODE_ENV === "development",
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
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "/api/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken(); // Get from Clerk or localStorage
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
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
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
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
  "btn-base", // Base button styles from design system
  "btn-primary", // Primary variant
  "btn-md", // Medium size
  "hover:btn-primary-hover", // Hover state
  "focus:btn-primary-focus", // Focus state
  "disabled:btn-primary-disabled" // Disabled state
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
  "w-full", // Mobile: full width
  "md:w-1/2", // Tablet: half width
  "lg:w-1/3", // Desktop: third width
  "xl:w-1/4" // Large desktop: quarter width
);
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
import { GET } from "../search/route";
import { NextRequest } from "next/server";

describe("/api/restaurants/search", () => {
  it("returns restaurants for valid query", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/restaurants/search?q=pizza"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.restaurants).toBeDefined();
    expect(Array.isArray(data.restaurants)).toBe(true);
  });

  it("returns error for missing query", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/restaurants/search"
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
const CACHE_NAME = "you-hungry-v1";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
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
import { z } from "zod";

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

### Authentication Middleware

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/restaurants/search"],
  ignoredRoutes: ["/api/webhooks/clerk"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

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
import { unstable_cache } from "next/cache";

export const getCachedRestaurants = unstable_cache(
  async (query: string) => {
    // Expensive database query
    return await searchRestaurants(query);
  },
  ["restaurants"],
  {
    tags: ["restaurants"],
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
    | "primary"
    | "secondary"
    | "accent"
    | "warm"
    | "outline"
    | "outline-accent";
  size?: "sm" | "md" | "lg";
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

## 🚀 Deployment Guidelines

### Environment Variables

```bash
# .env.local
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Build Configuration

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["maps.googleapis.com"],
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
