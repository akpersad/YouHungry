# Technical Architecture - You Hungry? App

This document outlines the technical architecture, technology stack, and implementation strategy for the You Hungry? app.

## 🏗️ Current Technology Stack (Implemented)

### Frontend

- **Framework**: Next.js 15 with App Router ✅
- **Language**: TypeScript with strict mode ✅
- **Styling**: Tailwind CSS with custom design system ✅
- **State Management**: React Context + Custom hooks ✅
- **UI Components**: Custom components with Tailwind ✅
- **Testing**: Jest + React Testing Library with 39 passing tests ✅
- **PWA**: Service Workers, App Manifest, Offline capabilities (planned)

### Backend

- **Runtime**: Node.js (Next.js API routes) ✅
- **Database**: MongoDB Atlas with connection utilities ✅
- **Authentication**: Clerk with protected routes ✅
- **API Layer**: REST architecture ✅
- **Data Models**: Complete TypeScript interfaces ✅
- **API Integration**: Google Places (planned), Twilio (planned)
- **File Storage**: Vercel Blob (for user uploads) (planned)

### Development & Deployment

- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks ✅
- **Testing**: Jest, React Testing Library with comprehensive coverage ✅
- **Performance**: Bundle Analyzer configured ✅
- **Monitoring**: Web Vitals via ESLint ✅
- **Hosting**: Vercel (planned)
- **CI/CD**: GitHub Actions + Vercel (planned)
- **Error Handling**: React Error Boundaries (planned)

## 🚀 Future Technology Stack (As App Grows)

### Advanced API Layer

- **GraphQL**: Apollo Server with subscriptions for real-time features
- **Hybrid Architecture**: REST + GraphQL for optimal performance
- **Caching**: Redis for API response caching + GraphQL query caching

### Enhanced Frontend Features

- **Form Management**: React Hook Form with Zod integration
- **API State Management**: TanStack Query for advanced caching and background updates
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Drag & Drop**: @dnd-kit for restaurant ranking system
- **Notifications**: React Hot Toast (Sonner) for user feedback

### Development & Performance

- **Code Quality**: Husky + lint-staged for pre-commit hooks
- **Performance Monitoring**: Next.js Bundle Analyzer + Web Vitals
- **TypeScript**: Strict mode configuration
- **Testing**: Jest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions + Vercel automation

### Advanced Features

- **PWA**: Service Workers, App Manifest, Offline capabilities
- **File Storage**: Vercel Blob for user uploads
- **Real-time**: GraphQL subscriptions for group decision making
- **Error Handling**: React Error Boundaries + Error monitoring

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
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
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
  type: 'personal' | 'group';
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
  type: 'personal' | 'group';
  collectionId: ObjectId;
  groupId?: ObjectId;
  participants: ObjectId[]; // User IDs
  method: 'tiered' | 'random';
  status: 'active' | 'completed' | 'expired';
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
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 Current API Architecture

### REST API Strategy

The app currently uses a REST-only approach for simplicity and rapid development:

#### **REST API Routes**

- **Simple CRUD operations**: Collections, users, basic restaurant management
- **Authentication endpoints**: Clerk integration and user management
- **External API proxies**: Google Places, Twilio, address validation (planned)
- **File uploads**: Restaurant photos and user avatars (planned)

## 🔮 Future API Architecture (GraphQL Integration)

### GraphQL Schema Structure (Future Implementation)

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

### Current REST API Routes

##### Collections Routes (CRUD Operations)

- `GET /api/collections` - Get user's collections
- `POST /api/collections` - Create new collection
- `PUT /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

##### Restaurants Routes (Basic Operations)

- `GET /api/restaurants/search` - Search restaurants
- `POST /api/restaurants` - Add restaurant to collection
- `PUT /api/restaurants/[id]` - Update restaurant details
- `DELETE /api/restaurants/[id]` - Remove restaurant from collection

##### Groups Routes (CRUD Operations)

- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `PUT /api/groups/[id]` - Update group
- `DELETE /api/groups/[id]` - Delete group
- `POST /api/groups/[id]/invite` - Invite user to group
- `POST /api/groups/[id]/join` - Join group

##### Decisions Routes (Simple Operations)

- `GET /api/decisions` - Get user's decisions
- `POST /api/decisions` - Start decision process
- `POST /api/decisions/[id]/vote` - Submit vote
- `GET /api/decisions/[id]` - Get decision details

## 🔮 Future GraphQL API (Advanced Operations)

### GraphQL Endpoint

- `POST /api/graphql` - Main GraphQL endpoint with queries, mutations, and subscriptions

### Key GraphQL Operations (Future Implementation)

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

## 🚀 Current Performance Optimization

### Basic Caching Strategy

- **API Responses**: Simple caching for restaurant data
- **User Data**: Basic React state management
- **Database Queries**: Optimized MongoDB queries

### Database Optimization

- **Indexes**: Optimized for common queries
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Minimize database calls

### Frontend Optimization

- **Code Splitting**: Automatic Next.js route-based splitting
- **Image Optimization**: Next.js Image component (when implemented)
- **Bundle Optimization**: Tree shaking, minification
- **TypeScript**: Compile-time optimizations

## 🔮 Future Performance Optimization (Advanced Features)

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

### Advanced Frontend Optimization

- **PWA Caching**: Service worker caching strategy
- **Advanced Code Splitting**: Component-level lazy loading
- **Bundle Analysis**: Performance monitoring and optimization

## 🔧 Environment Configuration

### Configured Environment Variables (in `.env.local`)

The following environment variables are configured and ready for use:

#### Database Configuration

- **MONGODB_URI**: MongoDB Atlas connection string
- **MONGODB_DATABASE**: Database name for the application

#### Authentication Configuration

- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Clerk public key for frontend authentication
- **CLERK_SECRET_KEY**: Clerk secret key for backend authentication

#### External API Configuration

- **GOOGLE_PLACES_API_KEY**: Google Places API key for restaurant search
- **GOOGLE_ADDRESS_VALIDATION_API_KEY**: Google Address Validation API key
- **TWILIO_ACCOUNT_SID**: Twilio account SID for SMS notifications
- **TWILIO_AUTH_TOKEN**: Twilio authentication token
- **TWILIO_PHONE_NUMBER**: Twilio phone number for SMS sending

#### Application Configuration

- **NEXT_PUBLIC_APP_URL**: Application URL for webhooks and redirects

### Environment Setup Status

- ✅ **All required environment variables are configured**
- ✅ **Database connection tested and verified**
- ✅ **API endpoints tested with configured variables**
- ✅ **Ready for development and testing**

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

- **Components**: Test all React components ✅
- **Hooks**: Test custom hooks
- **Utilities**: Test utility functions
- **API Routes**: Test API endpoints
- **Test Quality**: 39 passing tests with no console errors ✅
- **React Testing**: Proper act() wrapping for async operations ✅
- **DOM Validation**: Fixed nested button elements and HTML validation ✅

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

## 📋 Current Implementation Status

### ✅ Completed (Phase 1)

**Core foundation implemented**

- [x] **Next.js 15 + TypeScript**: Framework and language setup
- [x] **Tailwind CSS**: Styling system with custom design
- [x] **MongoDB + Clerk**: Database and authentication
- [x] **Basic REST APIs**: Collections, restaurants, users
- [x] **Component Library**: UI components with Tailwind
- [x] **Environment Configuration**: All required environment variables configured in `.env.local`

### 🚧 In Progress (Phase 2)

**Core features development**

- [ ] **Restaurant Search**: Google Places API integration
- [ ] **Collection Management**: CRUD operations
- [ ] **User Dashboard**: Personal collections view
- [ ] **Basic Decision Making**: Personal restaurant selection

## 🔮 Future Implementation Roadmap

### Phase 3: Enhanced User Experience (When Core Features Complete)

**Advanced user interaction improvements**

- [ ] **React Hook Form + Zod**: Form management and validation
- [ ] **TanStack Query**: API state management and caching
- [ ] **Framer Motion**: Smooth animations and transitions
- [ ] **React Hot Toast**: User feedback and notifications
- [ ] **@dnd-kit**: Restaurant ranking drag-and-drop system
- [ ] **Error Boundaries**: Graceful error handling

### Phase 4: Advanced Features (When App Grows)

**Production readiness and optimization**

- [ ] **GraphQL Integration**: Apollo Server + Client setup
- [ ] **Real-time Features**: GraphQL subscriptions
- [ ] **PWA Capabilities**: Service workers and offline support
- [ ] **Bundle Analyzer**: Performance monitoring
- [ ] **Web Vitals**: Core performance metrics
- [ ] **Husky + lint-staged**: Code quality enforcement

### Future Package Installation Commands

```bash
# Phase 3: Enhanced UX
npm install react-hook-form @hookform/resolvers @tanstack/react-query @tanstack/react-query-devtools
npm install framer-motion sonner @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Phase 4: Advanced Features
npm install apollo-server-micro apollo-server-core graphql
npm install --save-dev husky lint-staged @next/bundle-analyzer
```

### Implementation Strategy

- **Current Focus**: Build core features with simple, proven technologies
- **Future Enhancement**: Add advanced technologies when they solve specific problems
- **Mobile-First**: All technologies optimized for mobile and PWA experience
- **Type-Safe**: Full TypeScript integration throughout
- **Performance**: Add optimization tools when performance becomes a concern
