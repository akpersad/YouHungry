# Technical Architecture - You Hungry? App

This document outlines the technical architecture, technology stack, and implementation strategy for the You Hungry? app.

## 🏗️ Technology Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + Custom hooks + TanStack Query
- **Form Management**: React Hook Form with Zod integration
- **UI Components**: Custom components with Tailwind
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Drag & Drop**: @dnd-kit for restaurant ranking system
- **Notifications**: React Hot Toast (Sonner) for user feedback
- **PWA**: Service Workers, App Manifest, Offline capabilities

### Backend

- **Runtime**: Node.js (Next.js API routes)
- **Database**: MongoDB Atlas
- **Authentication**: Clerk
- **API Layer**: Hybrid REST + GraphQL architecture
- **GraphQL**: Apollo Server with subscriptions for real-time features
- **API Integration**: Google Places, Twilio, Google Address Validation
- **Caching**: Redis (for API response caching) + GraphQL query caching
- **File Storage**: Vercel Blob (for user uploads)

### Development & Deployment

- **Hosting**: Vercel
- **CI/CD**: GitHub Actions + Vercel
- **Monitoring**: Vercel Analytics + Custom logging + Web Vitals
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky + lint-staged
- **Bundle Analysis**: Next.js Bundle Analyzer
- **Error Handling**: React Error Boundaries + Error monitoring

## 🛠️ Enhanced Technology Stack

### Form Management & Validation

- **React Hook Form**: Industry-standard form management with minimal re-renders
- **Zod Integration**: Type-safe validation with @hookform/resolvers
- **Form DevTools**: Development debugging for form state

### API State Management

- **TanStack Query (React Query)**: Advanced caching, background updates, optimistic updates
- **Stale-While-Revalidate**: Built-in support for your caching strategy
- **Offline Support**: Essential for PWA capabilities
- **GraphQL Integration**: Works seamlessly with Apollo Client

### User Experience Enhancements

- **Framer Motion**: Smooth animations and micro-interactions
- **React Hot Toast (Sonner)**: Lightweight, accessible notifications
- **@dnd-kit**: Modern drag-and-drop for restaurant ranking system
- **Error Boundaries**: Graceful error handling and recovery

### Development Experience

- **Husky + lint-staged**: Pre-commit hooks for code quality
- **Bundle Analyzer**: Performance monitoring and optimization
- **TypeScript Strict Mode**: Enhanced type safety
- **Web Vitals Monitoring**: Core performance metrics

### Performance & Optimization

- **Next.js Image Optimization**: Automatic image optimization for restaurant photos
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Eliminates unused code
- **Service Worker**: Advanced caching strategies

## 🗄️ Database Schema

### Collections Structure

#### Users Collection

```typescript
interface User {
  _id: ObjectId;
  clerkId: string;
  email: string;
  name: string;
  city?: string;
  profilePicture?: string;
  smsOptIn: boolean;
  smsPhoneNumber?: string;
  preferences: {
    defaultLocation?: string;
    notificationSettings: {
      groupDecisions: boolean;
      friendRequests: boolean;
      groupInvites: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Restaurants Collection

```typescript
interface Restaurant {
  _id: ObjectId;
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  cuisine: string;
  rating: number;
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  timeToPickUp?: number; // minutes
  photos?: string[];
  phoneNumber?: string;
  website?: string;
  hours?: {
    [key: string]: string;
  };
  cachedAt: Date;
  lastUpdated: Date;
}
```

#### Collections Collection

```typescript
interface Collection {
  _id: ObjectId;
  name: string;
  description?: string;
  type: "personal" | "group";
  ownerId: ObjectId; // User ID for personal, Group ID for group
  restaurantIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Groups Collection

```typescript
interface Group {
  _id: ObjectId;
  name: string;
  description?: string;
  adminIds: ObjectId[];
  memberIds: ObjectId[];
  collectionIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Decisions Collection

```typescript
interface Decision {
  _id: ObjectId;
  type: "personal" | "group";
  collectionId: ObjectId;
  groupId?: ObjectId;
  participants: ObjectId[]; // User IDs
  method: "tiered" | "random";
  status: "active" | "completed" | "expired";
  deadline: Date;
  visitDate: Date;
  result?: {
    restaurantId: ObjectId;
    selectedAt: Date;
    reasoning: string;
  };
  votes?: {
    userId: ObjectId;
    rankings: ObjectId[]; // Restaurant IDs in order
    submittedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Friendships Collection

```typescript
interface Friendship {
  _id: ObjectId;
  requesterId: ObjectId;
  addresseeId: ObjectId;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 API Architecture

### Hybrid API Strategy

The app uses a hybrid approach combining REST and GraphQL:

#### **REST API Routes**

- **Simple CRUD operations**: Collections, users, basic restaurant management
- **Authentication endpoints**: Clerk integration and user management
- **External API proxies**: Google Places, Twilio, address validation
- **File uploads**: Restaurant photos and user avatars

#### **GraphQL API**

- **Complex queries**: Restaurant discovery with filters and weights
- **Real-time features**: Group decision updates and voting progress
- **Flexible data fetching**: Dashboard data, decision history, analytics
- **Mobile optimization**: Selective field fetching, reduced network requests

#### **GraphQL Schema Structure**

```typescript
type User {
  id: ID!
  name: String!
  collections: [Collection!]!
  groups: [Group!]!
  decisionHistory: [Decision!]!
}

type Collection {
  id: ID!
  name: String!
  restaurants: [Restaurant!]!
  owner: User!
  type: CollectionType!
}

type Restaurant {
  id: ID!
  name: String!
  photos: [String!]!
  priceRange: String
  rating: Float
  cuisine: String
  weight: Float # 30-day rolling weight for decisions
  recentDecisions: [Decision!]!
}

type Decision {
  id: ID!
  status: DecisionStatus!
  method: DecisionMethod!
  participants: [User!]!
  votes: [Vote!]!
  result: Restaurant
  deadline: DateTime!
}
```

### External APIs

#### Google Places API

- **Purpose**: Restaurant search and data
- **Caching Strategy**: 30-day cache for restaurant details
- **Rate Limiting**: Batch requests, implement exponential backoff
- **Cost Optimization**: Stale-while-revalidate pattern

#### Google Address Validation API

- **Purpose**: Address validation and geocoding
- **Caching Strategy**: 90-day cache for validated addresses
- **Rate Limiting**: Implement request batching

#### Twilio API

- **Purpose**: SMS notifications
- **Rate Limiting**: Respect Twilio rate limits
- **Error Handling**: Graceful degradation if SMS fails

### Internal API Routes

#### REST API Routes (Simple Operations)

##### Authentication Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

##### Collections Routes (CRUD Operations)

- `POST /api/collections` - Create collection
- `PUT /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

##### Restaurants Routes (Basic Operations)

- `POST /api/restaurants` - Add restaurant to collection
- `PUT /api/restaurants/[id]` - Update restaurant details
- `DELETE /api/restaurants/[id]` - Remove restaurant from collection

##### Groups Routes (CRUD Operations)

- `POST /api/groups` - Create group
- `PUT /api/groups/[id]` - Update group
- `DELETE /api/groups/[id]` - Delete group
- `POST /api/groups/[id]/invite` - Invite user to group
- `POST /api/groups/[id]/join` - Join group

##### Decisions Routes (Simple Operations)

- `POST /api/decisions` - Start decision process
- `POST /api/decisions/[id]/vote` - Submit vote

#### GraphQL API Routes (Complex Operations)

##### GraphQL Endpoint

- `POST /api/graphql` - Main GraphQL endpoint with queries, mutations, and subscriptions

##### Key GraphQL Operations

**Queries:**

```graphql
query GetDashboardData($userId: ID!) {
  user(id: $userId) {
    collections {
      id
      name
      restaurants {
        id
        name
        photos
      }
    }
    groups {
      id
      name
      members {
        id
        name
      }
    }
    recentDecisions {
      id
      result
      status
    }
  }
}

query SearchRestaurants($filters: RestaurantFilters!) {
  restaurants(filters: $filters) {
    id
    name
    photos
    priceRange
    rating
    cuisine
    weight
    collections {
      id
      name
    }
  }
}

query GetDecisionData($decisionId: ID!) {
  decision(id: $decisionId) {
    id
    status
    method
    deadline
    collection {
      restaurants {
        id
        name
        photos
      }
    }
    participants {
      id
      name
    }
    votes {
      user {
        name
      }
      rankings
    }
  }
}
```

**Mutations:**

```graphql
mutation SubmitVote($decisionId: ID!, $rankings: [ID!]!) {
  submitVote(decisionId: $decisionId, rankings: $rankings) {
    success
    vote {
      user {
        name
      }
      rankings
    }
  }
}

mutation StartDecision(
  $collectionId: ID!
  $method: DecisionMethod!
  $deadline: DateTime!
) {
  startDecision(
    collectionId: $collectionId
    method: $method
    deadline: $deadline
  ) {
    success
    decision {
      id
      status
      deadline
    }
  }
}
```

**Subscriptions:**

```graphql
subscription DecisionUpdates($decisionId: ID!) {
  decisionUpdated(decisionId: $decisionId) {
    id
    status
    votes {
      user {
        name
      }
      rankings
      submittedAt
    }
    currentLeader
    timeRemaining
  }
}

subscription GroupActivity($groupId: ID!) {
  groupUpdated(groupId: $groupId) {
    id
    name
    members {
      id
      name
    }
    collections {
      id
      name
      restaurantCount
    }
  }
}
```

## 🚀 Performance Optimization

### Enhanced Caching Strategy with TanStack Query

#### REST API Caching

- **API Responses**: 30-day cache for restaurant data with stale-while-revalidate
- **User Data**: 5-minute cache for user profiles with background updates
- **Group Data**: 1-minute cache for group information with optimistic updates
- **Decision Data**: Real-time with optimistic updates for voting

#### GraphQL Caching

- **Query Caching**: Apollo Client + TanStack Query integration for dashboard data
- **Normalized Cache**: Automatic cache normalization for related data
- **Cache Policies**: Different policies for queries vs subscriptions
- **Offline Cache**: PWA offline support with persistent cache
- **Background Sync**: Automatic data synchronization when connection restored

#### TanStack Query Benefits

- **Automatic Background Updates**: Fresh data without user intervention
- **Optimistic Updates**: Immediate UI feedback for actions
- **Request Deduplication**: Prevents duplicate API calls
- **Error Retry**: Automatic retry with exponential backoff
- **Cache Invalidation**: Smart cache management for data consistency

### Database Optimization

- **Indexes**: Optimized for common queries
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Minimize database calls

### Frontend Optimization

- **Code Splitting**: Lazy load components
- **Image Optimization**: Next.js Image component
- **Bundle Optimization**: Tree shaking, minification
- **PWA Caching**: Service worker caching strategy

## 🔒 Security Considerations

### Authentication & Authorization

- **Clerk Integration**: Secure user authentication
- **JWT Tokens**: Secure API access
- **Role-based Access**: Admin vs member permissions
- **Session Management**: Secure session handling

### Data Protection

- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Sanitize user-generated content
- **CSRF Protection**: Implement CSRF tokens

### API Security

- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Proper CORS setup
- **API Key Management**: Secure API key storage
- **Error Handling**: Don't expose sensitive information

## 📱 PWA Implementation

### Service Worker Strategy

- **Caching**: Cache API responses and static assets
- **Offline Support**: Serve cached content when offline
- **Background Sync**: Sync data when connection restored
- **Push Notifications**: Group decision notifications

### App Manifest

- **App Name**: "You Hungry?"
- **Icons**: Multiple sizes for different devices
- **Theme Colors**: Match design system
- **Display Mode**: Standalone for app-like experience

## 🧪 Testing Strategy

### Unit Testing

- **Components**: Test all React components
- **Hooks**: Test custom hooks
- **Utilities**: Test utility functions
- **API Routes**: Test API endpoints

### Integration Testing

- **User Flows**: Test complete user journeys
- **API Integration**: Test external API integrations
- **Database Operations**: Test database queries
- **Authentication**: Test auth flows

### E2E Testing

- **Critical Paths**: Test main user flows
- **Cross-browser**: Test on different browsers
- **Mobile Testing**: Test on mobile devices
- **Performance**: Test app performance

## 📊 Monitoring & Analytics

### Application Monitoring

- **Error Tracking**: Track and alert on errors
- **Performance Monitoring**: Track app performance
- **User Analytics**: Track user behavior
- **API Monitoring**: Monitor API performance

### Business Metrics

- **User Engagement**: Track user activity
- **Feature Usage**: Track feature adoption
- **Decision Success**: Track decision completion rates
- **User Retention**: Track user retention

## 🔄 Deployment Strategy

### Environment Setup

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live application environment

### CI/CD Pipeline

- **Code Quality**: Automated linting and testing
- **Build Process**: Automated build and deployment
- **Database Migrations**: Automated schema updates
- **Rollback Strategy**: Quick rollback capability

### Monitoring & Alerting

- **Health Checks**: Monitor application health
- **Error Alerts**: Alert on critical errors
- **Performance Alerts**: Alert on performance issues
- **Uptime Monitoring**: Monitor application uptime

## 📝 Implementation Notes

### Development Guidelines

- **Mobile-First**: Design for mobile devices first
- **Accessibility**: WCAG AA compliance required
- **Performance**: Optimize for speed and efficiency
- **Cost Optimization**: Minimize API costs through caching

### Code Organization

- **Component Structure**: Organized by feature
- **API Organization**: RESTful API design
- **Database Organization**: Normalized schema design
- **File Organization**: Clear file structure

### Future Considerations

- **iOS App**: Architecture designed for easy iOS conversion
- **Scalability**: Design for future growth
- **Internationalization**: Prepare for multi-language support
- **Advanced Features**: Architecture supports future enhancements

## 📋 Implementation Priority Roadmap

### Phase 1: Foundation (Week 1)

**Essential for core functionality**

- [ ] **React Hook Form + Zod**: Form management and validation
- [ ] **TanStack Query**: API state management and caching
- [ ] **Husky + lint-staged**: Code quality enforcement
- [ ] **TypeScript Strict Mode**: Enhanced type safety

### Phase 2: User Experience (Week 2-3)

**Core user interaction improvements**

- [ ] **Framer Motion**: Smooth animations and transitions
- [ ] **React Hot Toast**: User feedback and notifications
- [ ] **@dnd-kit**: Restaurant ranking drag-and-drop system
- [ ] **Error Boundaries**: Graceful error handling

### Phase 3: Polish & Performance (Week 4+)

**Production readiness and optimization**

- [ ] **Bundle Analyzer**: Performance monitoring
- [ ] **Web Vitals**: Core performance metrics
- [ ] **Next.js Image Optimization**: Restaurant photo optimization
- [ ] **Advanced Service Worker**: Enhanced PWA capabilities

### Package Installation Commands

```bash
# Phase 1: Foundation
npm install react-hook-form @hookform/resolvers @tanstack/react-query @tanstack/react-query-devtools
npm install --save-dev husky lint-staged

# Phase 2: User Experience
npm install framer-motion sonner @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Phase 3: Performance & Monitoring
npm install --save-dev @next/bundle-analyzer
```

### Integration Benefits

- **Zero Learning Curve**: All technologies are industry standards
- **Perfect Fit**: Each solves specific problems in your architecture
- **Mobile-First**: Optimized for mobile and PWA experience
- **Performance Focused**: Enhances speed and user experience
- **Future-Proof**: Will work seamlessly with iOS conversion
- **Type-Safe**: Full TypeScript integration throughout
