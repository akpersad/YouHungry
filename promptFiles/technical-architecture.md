# Technical Architecture - You Hungry? App

This document outlines the technical architecture, technology stack, and implementation strategy for the You Hungry? app.

## 🏗️ Current Technology Stack (Implemented)

### Frontend

- **Framework**: Next.js 15 with App Router ✅
- **Language**: TypeScript with strict mode ✅
- **Styling**: Tailwind CSS with custom design system ✅
- **State Management**: React Context + Custom hooks ✅
- **UI Components**: Custom components with Tailwind ✅
- **Testing**: Jest + React Testing Library with 100+ passing tests ✅
- **PWA**: Service Workers, App Manifest, Offline capabilities (planned)

### Backend

- **Runtime**: Node.js (Next.js API routes) ✅
- **Database**: MongoDB Atlas with connection utilities ✅
- **Authentication**: Clerk with protected routes ✅
- **API Layer**: REST architecture + GraphQL ✅
- **Data Models**: Complete TypeScript interfaces ✅
- **API Integration**: Google Places API ✅, Google Address Validation API ✅, Twilio (planned)
- **File Storage**: Vercel Blob for user profile picture uploads ✅

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

- **Form Management**: Simplified React useState with custom validation functions ✅
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

## 🔔 Notification System Architecture (Epic 7 - COMPLETED)

### Unified Notification Service

The app implements a comprehensive notification system that orchestrates multiple communication channels:

**Notification Channels**:

- **SMS** - Twilio integration with phone validation and E.164 formatting
- **Email** - Resend API with rich HTML templates
- **In-App** - Database-backed with real-time updates (30-second refresh)
- **Push** - PWA push notifications with iOS 16.4+ support
- **Toast** - React Hot Toast (Sonner) for immediate UI feedback

**Architecture Pattern**:

```typescript
// Unified notification orchestrator
class NotificationService {
  async sendGroupDecisionNotification(decision, recipient, channels) {
    // Sends to all enabled channels in parallel
    await Promise.allSettled([
      channels.smsEnabled && this.sendSMS(recipient, decision),
      channels.emailEnabled && this.sendEmail(recipient, decision),
      channels.pushEnabled && this.sendPush(recipient, decision),
      channels.inAppEnabled &&
        this.createInAppNotification(recipient, decision),
      channels.toastEnabled && this.showToast(decision),
    ]);
  }
}
```

**Key Features**:

- Smart routing based on user preferences and capabilities
- Graceful degradation when individual channels fail
- Promise-based parallel sending for optimal performance
- Error isolation - channel failures don't affect others

### Notification Storage Schema

```typescript
interface InAppNotification {
  _id: ObjectId;
  userId: ObjectId;
  type:
    | 'group_decision'
    | 'friend_request'
    | 'group_invitation'
    | 'decision_result'
    | 'admin_alert';
  title: string;
  message: string;
  data?: { [key: string]: any };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ShortUrl {
  _id: ObjectId;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  expiresAt?: Date;
  clickCount: number;
}
```

### Enhanced User Schema for Notifications

```typescript
interface User {
  // ... existing fields
  smsOptIn: boolean;
  smsPhoneNumber?: string;
  profilePicture?: string; // Vercel Blob URL
  preferences: {
    notificationSettings: {
      groupDecisions: boolean;
      friendRequests: boolean;
      groupInvites: boolean;
      smsEnabled: boolean;
      emailEnabled: boolean;
      pushEnabled: boolean;
    };
  };
}
```

### URL Shortener Service

**Dual Strategy Implementation**:

- Primary: TinyURL API (free external service)
- Fallback: Custom database-backed shortener with 6-character codes
- SMS Integration: Automatically shortens URLs to save 50-70 characters
- Click Tracking: Monitors engagement with shortened links

**API Endpoints**:

- `/api/shorten` - Create shortened URLs
- `/s/[shortCode]` - Resolve and redirect with click tracking

## 🗄️ Database Schema

### Collections Structure

#### Users Collection (UPDATED ✅ IMPLEMENTED)

```typescript
interface User {
  _id: ObjectId;
  clerkId: string;
  email: string;
  name: string;
  username?: string; // Added for friend search functionality
  phoneNumber?: string; // Added for Clerk phone authentication
  city?: string;
  state?: string; // Added for location preferences
  profilePicture?: string;
  smsOptIn: boolean;
  smsPhoneNumber?: string;
  preferences: {
    defaultLocation?: string;
    locationSettings?: {
      city?: string;
      state?: string;
      country?: string;
    };
    notificationSettings: {
      sms: boolean; // Enhanced SMS settings
      email: boolean; // Added email notifications
      push: boolean; // Added push notifications
      groupDecisions: boolean;
      friendRequests: boolean;
      groupInvites: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Schema Updates Implemented**:

- Added `phoneNumber` field for Clerk phone authentication
- Added `username` field for friend search functionality
- Enhanced location preferences with `state` field
- Extended notification settings with SMS, email, and push options
- Added structured location settings for better user preferences

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
  status: 'active' | 'completed' | 'expired' | 'closed';
  deadline: Date;
  visitDate: Date;
  result?: {
    restaurantId: ObjectId;
    selectedAt: Date;
    reasoning: string;
    weights?: Record<string, number>; // Restaurant weights for tiered decisions
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
- **Search Implementation**:
  - **Text Search API**: Used when specific restaurant name/cuisine query is provided
  - **Nearby Search API**: Used for location-only searches (no query parameter)
  - **Geocoding Integration**: Address validation and coordinate conversion for accurate location-based search
  - **Query Processing**: Removes automatic "restaurant" suffix to allow precise searches like "McDonald's"

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

##### Authentication Routes (UPDATED ✅ IMPLEMENTED)

- `POST /api/webhooks/clerk` - Clerk webhook for user creation/updates with phone number handling
- `GET /api/user/current` - Get current user's MongoDB ObjectId
- `GET /api/user/profile` - Get user profile (via Clerk)
- `PUT /api/user/profile` - Update user profile (via Clerk)

##### Profile Management Routes (UPDATED ✅ IMPLEMENTED)

- `GET /api/user/profile` - Get user profile information
- `PUT /api/user/profile` - Update user profile information
- `POST /api/user/profile/picture` - Upload profile picture using Vercel Blob
- `DELETE /api/user/profile/picture` - Remove profile picture

**Key Authentication Updates Implemented**:

- Enhanced Clerk webhook to capture phone numbers from registration
- User creation with new fields and proper defaults
- User update handling includes phone number changes
- Comprehensive error handling for webhook operations
- Middleware updates to handle new auth routes (`/sign-in`, `/sign-up`)

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

- `GET /api/collections` - Get user's collections (supports ?type=personal|group|all)
- `POST /api/collections` - Create new collection (supports personal and group collections)
- `PUT /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

##### Restaurants Routes (Basic Operations)

- `GET /api/restaurants/search` - Search restaurants
  - **Query Parameters**: `q` (restaurant name/cuisine), `location` (address), `lat`/`lng` (coordinates), `radius`, `cuisine`, `minRating`, `maxPrice`, `minPrice`
  - **Search Logic**: Uses Google Places Text Search API when query provided, Nearby Search API for location-only searches
  - **Geocoding**: Automatically converts addresses to coordinates for accurate location-based search
  - **Filtering**: Applies additional filters for cuisine, rating, and price level
- `POST /api/restaurants` - Add restaurant to collection
- `PUT /api/restaurants/[id]` - Update restaurant details
- `DELETE /api/restaurants/[id]` - Remove restaurant from collection

##### Groups Routes (CRUD Operations)

- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `GET /api/groups/[id]` - Get group details with members
- `PUT /api/groups/[id]` - Update group (admin only)
- `DELETE /api/groups/[id]` - Delete group (admin only)
- `POST /api/groups/[id]/invite` - Invite user to group (admin only)
- `POST /api/groups/[id]/remove` - Remove user from group (admin only)
- `POST /api/groups/[id]/promote` - Promote user to admin (admin only)
- `POST /api/groups/[id]/leave` - Leave group

##### Decisions Routes (Simple Operations)

- `GET /api/decisions` - Get user's decisions
- `POST /api/decisions` - Start decision process
- `POST /api/decisions/[id]/vote` - Submit vote
- `GET /api/decisions/[id]` - Get decision details

##### Group Decision Routes (Advanced Operations)

- `GET /api/decisions/group?groupId={id}` - Get group decisions
- `POST /api/decisions/group` - Create group decision
- `POST /api/decisions/group/vote` - Submit group vote
- `PUT /api/decisions/group/vote` - Complete tiered group decision
- `DELETE /api/decisions/group/vote` - Close group decision
- `POST /api/decisions/group/random-select` - Perform group random selection

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

#### TanStack Query Implementation Details ✅ IMPLEMENTED

**Installed Packages**:

- `@tanstack/react-query` - Core query client
- `@tanstack/react-query-devtools` - Development tools

**QueryClient Configuration**:

```typescript
// Intelligent caching strategies
staleTime: 5 * 60 * 1000, // 5 minutes for most data
gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days garbage collection
retry: 3, // Exponential backoff retry
refetchOnWindowFocus: false, // Prevent unnecessary refetches
```

**API Hooks Created**:

- `useCollections()` - Collections CRUD with optimistic updates
- `useRestaurants()` - Restaurant search and management
- `useDecisions()` - Decision making and statistics
- All hooks include optimistic updates and error rollback

**Optimistic Updates**:

- Add/remove restaurants from collections
- Create/delete collections
- Automatic rollback on errors
- Consistent cache invalidation

#### TanStack Query Benefits

- **Automatic Background Updates**: Fresh data without user intervention ✅ IMPLEMENTED
- **Optimistic Updates**: Immediate UI feedback for actions ✅ IMPLEMENTED
- **Request Deduplication**: Prevents duplicate API calls ✅ IMPLEMENTED
- **Error Retry**: Automatic retry with exponential backoff ✅ IMPLEMENTED
- **Cache Invalidation**: Smart cache management for data consistency ✅ IMPLEMENTED

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
- **BLOB_READ_WRITE_TOKEN**: Vercel Blob token for profile picture uploads

#### Application Configuration

- **NEXT_PUBLIC_APP_URL**: Application URL for webhooks and redirects

### Environment Setup Status

- ✅ **All required environment variables are configured**
- ✅ **Database connection tested and verified**
- ✅ **API endpoints tested with configured variables**
- ✅ **Custom authentication pages implemented and tested**
- ✅ **Clerk webhook configured for user sync**
- ✅ **Enhanced user schema deployed**
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

### User ID Handling & Authentication

**Issue Resolved**: The app initially had a mismatch between Clerk user IDs (strings) and MongoDB ObjectIds, causing admin checks and user comparisons to fail.

**Solution Implemented**:

- Created `/api/user/current` endpoint that returns the current user's MongoDB ObjectId
- Updated group pages to fetch the current user's MongoDB ID using `useEffect` and state
- Modified `GroupView` component to receive MongoDB ObjectId instead of Clerk ID
- This ensures proper admin checks and member comparisons throughout the app

**Key Files**:

- `src/app/api/user/current/route.ts` - Returns current user's MongoDB ID
- `src/app/groups/[id]/page.tsx` - Fetches and passes MongoDB ID to GroupView
- `src/components/features/GroupView.tsx` - Uses MongoDB ID for admin/member checks

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
- [x] **Restaurant Search System**: Google Places API integration with address validation and geocoding
- [x] **GraphQL Integration**: Schema and resolvers for complex restaurant queries

### ✅ Completed (Phase 2)

**Core features development**

- [x] **Restaurant Search**: Google Places API integration with Text Search and Nearby Search APIs ✅ COMPLETED
- [x] **Collection Management**: CRUD operations ✅ COMPLETED
- [x] **User Dashboard**: Personal collections view ✅ COMPLETED
- [x] **Enhanced Form Management**: Simplified form state management with custom validation ✅ COMPLETED
- [x] **Restaurant Management**: Add/remove restaurants from collections ✅ COMPLETED
- [x] **Basic Decision Making**: Personal restaurant selection with weighted algorithm ✅ COMPLETED
- [x] **Group Management**: Complete group CRUD with admin/member roles ✅ COMPLETED
- [x] **Group Decision Making**: Advanced tiered voting system with real-time updates ✅ COMPLETED
- [x] **Real-time Subscriptions**: WebSocket-based group decision updates ✅ COMPLETED
- [x] **Comprehensive Testing**: 100+ tests covering all major functionality ✅ COMPLETED

## 📝 Form Management Implementation

### ✅ Simplified Form Architecture (Epic 2 Story 3 - COMPLETED)

**Approach**: React useState with custom validation functions instead of complex form libraries

#### **Implementation Details**

**Form Components**:

- `CreateCollectionForm`: Collection creation with name and description
- `RestaurantSearchForm`: Restaurant search with location, filters, and preferences
- Both forms use standard HTML inputs with React state management

**Validation System**:

```typescript
// Simple validation functions in /lib/validation.ts
export const validateCollectionName = (name: string): string | null => {
  if (!name.trim()) return 'Collection name is required';
  if (name.length > 100)
    return 'Collection name must be 100 characters or less';
  return null;
};

export const validateLocation = (location: string): string | null => {
  if (!location.trim()) return 'Location is required';
  if (location.length > 200) return 'Location must be 200 characters or less';
  return null;
};
```

**State Management**:

- Each form field uses individual `useState` hooks
- Form submission handled with standard `onSubmit` events
- Error state managed with simple `error` state variable
- Loading states with `isSubmitting` boolean

**Benefits of Simplified Approach**:

- ✅ **Reliable**: No complex form state management issues
- ✅ **Performant**: No unnecessary re-renders or validation overhead
- ✅ **Maintainable**: Easy to understand and modify
- ✅ **Testable**: Simple, straightforward testing
- ✅ **Debuggable**: Clear error messages and state flow

**API Integration**:

- Forms submit directly to REST API endpoints
- Validation happens both client-side and server-side
- Error handling with clear user feedback
- Loading states during submission

**Testing Coverage**:

- Comprehensive unit tests for both form components
- Validation function testing
- User interaction testing with React Testing Library
- API integration testing with mocked endpoints

## 🎯 Group Decision Making Implementation

### ✅ Advanced Group Decision System (Epic 4 - COMPLETED)

**Comprehensive group decision making with real-time collaboration**

#### **Core Features Implemented**

**Tiered Voting System**:

- Drag-and-drop restaurant ranking interface
- Weighted scoring algorithm based on vote positions
- Real-time vote submission and updates
- Vote status indicators and re-voting capability

**Decision Management**:

- Create group decisions with tiered or random methods
- Set visit dates and deadlines (1-336 hours)
- Complete decisions with automatic restaurant selection
- Close decisions without completion (admin only)
- 24-hour visibility window for completed decisions

**Real-time Collaboration**:

- WebSocket-based subscription system for live updates
- Automatic UI updates when votes are submitted
- Connection status monitoring with fallback queries
- Optimistic updates for better user experience

**Admin Controls**:

- Group admins can create, complete, and close decisions
- Member-only voting permissions
- Participant management and validation
- Decision status tracking and management

#### **Technical Implementation**

**Frontend Components**:

- `GroupDecisionMaking`: Main decision interface with voting and management
- `useGroupDecisionSubscription`: Real-time subscription hook
- `useGroupDecisions`: Fallback query hook for reliability
- Drag-and-drop ranking with `onDragStart`, `onDragOver`, `onDrop` handlers

**API Endpoints**:

- `POST /api/decisions/group`: Create group decisions
- `GET /api/decisions/group`: Fetch group decisions
- `POST /api/decisions/group/vote`: Submit votes
- `PUT /api/decisions/group/vote`: Complete decisions
- `DELETE /api/decisions/group/vote`: Close decisions

**Database Operations**:

- `createGroupDecision`: Create new group decisions with participant management
- `submitGroupVote`: Handle vote submission with ranking validation
- `completeTieredGroupDecision`: Calculate weighted results and select restaurant
- `closeGroupDecision`: Close decisions without completion
- `getActiveGroupDecisions`: Fetch all decisions (active, completed, closed)

**Real-time Features**:

- WebSocket subscriptions for live vote updates
- Automatic participant deduplication
- Vote status tracking and display
- Connection error handling with graceful fallbacks

#### **User Experience Features**

**Voting Interface**:

- Intuitive drag-and-drop ranking system
- Visual feedback for vote status ("✓ You've Voted")
- Re-voting capability until decision is closed
- Restaurant details display with address, phone, rating, price

**Decision Display**:

- Active decisions with vote counts and deadlines
- Completed decisions with selected restaurant details
- 24-hour visibility window for recent completions
- Closed decisions hidden from main display

**Admin Interface**:

- Start decision button for group admins
- Complete decision when all votes are in
- Close decision without completion option
- Real-time participant and vote tracking

#### **Testing Coverage**

**Component Tests**:

- `GroupDecisionMaking.test.tsx`: 15+ test cases covering all functionality
- Vote submission and ranking interface testing
- Admin controls and permission testing
- Real-time subscription and fallback testing

**API Tests**:

- `group-decisions.test.ts`: Complete API endpoint testing
- `group-vote.test.ts`: Vote submission and decision management testing
- Error handling and validation testing
- Authentication and authorization testing

**Library Tests**:

- `group-decisions.test.ts`: Database operation testing
- Vote calculation and ranking algorithm testing
- Decision completion and closing logic testing
- Edge cases and error scenarios testing

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

## 🔮 Future Implementation Roadmap

### Phase 3: Enhanced User Experience (When Core Features Complete)

**Advanced user interaction improvements**

- [x] **Simplified Form Management**: React useState with custom validation functions ✅ COMPLETED
- [x] **TanStack Query**: API state management and caching ✅ COMPLETED
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
