# Technical Architecture - You Hungry? App

This document outlines the technical architecture, technology stack, and implementation strategy for the You Hungry? app.

## 🏗️ Technology Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + Custom hooks
- **UI Components**: Custom components with Tailwind
- **PWA**: Service Workers, App Manifest, Offline capabilities

### Backend

- **Runtime**: Node.js (Next.js API routes)
- **Database**: MongoDB Atlas
- **Authentication**: Clerk
- **API Integration**: Google Places, Twilio, Google Address Validation
- **Caching**: Redis (for API response caching)
- **File Storage**: Vercel Blob (for user uploads)

### Development & Deployment

- **Hosting**: Vercel
- **CI/CD**: GitHub Actions + Vercel
- **Monitoring**: Vercel Analytics + Custom logging
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky

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

#### Authentication Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### Collections Routes

- `GET /api/collections` - Get user collections
- `POST /api/collections` - Create collection
- `PUT /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

#### Restaurants Routes

- `GET /api/restaurants/search` - Search restaurants
- `POST /api/restaurants` - Add restaurant to collection
- `PUT /api/restaurants/[id]` - Update restaurant details
- `DELETE /api/restaurants/[id]` - Remove restaurant from collection

#### Groups Routes

- `GET /api/groups` - Get user groups
- `POST /api/groups` - Create group
- `PUT /api/groups/[id]` - Update group
- `DELETE /api/groups/[id]` - Delete group
- `POST /api/groups/[id]/invite` - Invite user to group
- `POST /api/groups/[id]/join` - Join group

#### Decisions Routes

- `POST /api/decisions` - Start decision process
- `GET /api/decisions/active` - Get active decisions
- `POST /api/decisions/[id]/vote` - Submit vote
- `GET /api/decisions/[id]/result` - Get decision result

## 🚀 Performance Optimization

### Caching Strategy

- **API Responses**: 30-day cache for restaurant data
- **User Data**: 5-minute cache for user profiles
- **Group Data**: 1-minute cache for group information
- **Decision Data**: Real-time (no caching)

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
