# Epic Breakdown - You Hungry? App

This document outlines the major epics and user stories for the You Hungry? app development journey. Each epic represents a major functional area that must be completed sequentially.

## ⚠️ IMPORTANT: Status Tracking

**DO NOT UPDATE THIS FILE WITH COMPLETION STATUS CHANGES**

This file should remain a static reference for the planned epics and stories. Status updates should be tracked in:

- `completed-items.md` - For completed work
- `in-flight.md` - For work currently in progress
- `pending-items.md` - For planned work not yet started

This file is for planning and reference only, not for tracking progress.

## 🚀 Future Technology Integration

**Future technologies** (marked with "Future" in story titles) are strategically placed within epics where they provide the most value:

- **Epic 1**: Enhanced development tools (Husky, lint-staged, Bundle Analyzer) ✅ **COMPLETED**
- **Epic 2**: Form management (React Hook Form + Zod), API state management (TanStack Query) ✅ **COMPLETED**
- **Epic 4**: Drag & drop ranking (@dnd-kit)
- **Epic 5**: Animations and interactions (Framer Motion)
- **Epic 6**: Toast notifications (Sonner)
- **Epic 9**: Error boundaries and graceful error handling + Performance benchmarking
- **Epic 10**: GraphQL integration (Apollo Server + Client)

**📊 Performance Benchmarking Note**: Performance benchmarking has been moved to Epic 9 (Polish & Optimization) to establish baselines before implementing advanced technologies like GraphQL. This ensures we have proper metrics to measure the effectiveness of optimizations.

These technologies will be implemented when they solve specific problems in each epic, ensuring they add real value rather than being added prematurely.

## 🎯 Epic 1: Foundation & Authentication

**Goal**: Establish core infrastructure, authentication, and basic user management

### Stories:

1. **Project Setup & Configuration**
   - Set up Next.js 15 with TypeScript
   - Configure Tailwind CSS with custom design system
   - Set up ESLint, Prettier, and development tools
   - Configure environment variables and secrets management

2. **Database & Data Layer**
   - Set up MongoDB Atlas cluster
   - Design and implement database schema
   - Create data models and validation schemas
   - Set up database connection and utilities

3. **Authentication System**
   - Integrate Clerk for user authentication
   - Implement registration and login flows
   - Set up user profile management
   - Configure protected routes and middleware
   - **Unit test authentication components (SignInButton, SignOutButton, UserProfile)**

4. **Basic UI Framework**
   - Create reusable component library
   - Implement responsive layout system
   - Set up navigation and routing
   - Establish design system implementation
   - **Unit test all UI components (Button, Card, Input, Modal, etc.)**

5. **Enhanced Development Tools (Future)**
   - Install and configure Husky + lint-staged for code quality
   - Enable TypeScript strict mode configuration
   - Set up Next.js Bundle Analyzer for performance monitoring
   - Configure Web Vitals monitoring for performance tracking

## 🏠 Epic 2: Personal Collections Management

**Goal**: Enable users to create and manage their personal food collections

### Stories:

1. **Collection CRUD Operations**
   - Create personal collections with custom naming
   - View and manage existing collections
   - Edit collection names and metadata
   - Delete collections with confirmation
   - **Unit test collection CRUD operations and API endpoints**

2. **Restaurant Search & Discovery**
   - Integrate Google Places API for restaurant search
   - Implement location-based restaurant discovery
   - Add restaurant details and metadata storage
   - Create restaurant search UI components
   - **Implement address validation and autocomplete with Google Address Validation API**
   - **Create address input dropdown with suggestions as user types**
   - **Validate addresses before searching to improve user experience**
   - **Unit test restaurant search functionality and API integration**
   - **Set up GraphQL schema for complex restaurant queries**
   - **Implement GraphQL resolvers for restaurant search with filters**

3. **Enhanced Form Management**
   - Implement simplified form state management using useState
   - Create reliable form validation with clear error messages
   - Update CreateCollectionForm and RestaurantSearchForm with simplified approach
   - Add comprehensive form testing and validation
   - Remove complex Zod dependencies for better maintainability

4. **Restaurant Management**
   - Add restaurants to collections
   - Manage restaurant custom fields (Price Range, Time to Pick Up)
   - Remove restaurants from collections
   - View restaurant details and history
   - **Collection View Page** - Detailed view of restaurants within a collection
   - **Collection Restaurant Management** - Add, edit, and remove restaurants from collection view
   - **Collection Decision Making** - Random selection from collection restaurants

5. **Personal Decision Making**
   - Implement random selection algorithm with weighted system
   - Add 30-day rolling weight system ensuring variety while allowing favorites
   - Create decision history tracking with database storage
   - Build decision result UI with DecisionResultModal and DecisionStatistics components
   - Unit test decision algorithms and weight calculations
   - Implement GraphQL queries for decision data with weights
   - Add REST API endpoints for decision creation and random selection
   - Integrate decision making into CollectionView with error handling
   - Update database schema to support decision tracking with weights

6. **Advanced API State Management (Future)**
   - Install and configure TanStack Query for API state management
   - Implement caching strategies and background updates
   - Add optimistic updates for better UX
   - Set up error handling and retry logic

## 👥 Epic 3: Social Features & Group Management

**Goal**: Enable users to connect with friends and create groups

### Stories:

1. **Friend Management**
   - Add friends by email/username search
   - Send and accept friend requests
   - Manage friend list and relationships
   - Remove friends and handle edge cases

2. **Group Creation & Management**
   - Create groups with custom names and descriptions
   - **Searchable, paginated friend list for group invitations**
   - **Friend-based invitation system with user info and "invite to group" button**
   - **Group management page with tab system for pending invitations**
   - **Accept/decline group invitations functionality**
   - Manage group membership and roles
   - Handle group admin privileges
   - **Fallback email-based invitation system for non-friends**
   - **Fixed user ID handling: Created /api/user/current endpoint to resolve Clerk ID vs MongoDB ObjectId mismatch**

3. **Group Collections**
   - Create group-specific collections
   - Add restaurants to group collections
   - Manage group collection permissions
   - Sync group collections across members
   - **Implement GraphQL queries for group collections and members**
   - **Add GraphQL mutations for group collection management**

**🔄 Parallel Work Note**: Stories 2 and 3 SHOULD be worked on in parallel - Group Creation provides the foundation that Group Collections depends on, but the core group management logic can be developed alongside the collection management logic.

## 🤝 Epic 4: Group Decision Making

**Goal**: Enable collaborative decision making within groups

### Stories:

1. **Tiered Choice System**
   - Implement ranking system for group members
   - Create voting interface and logic
   - Handle tie-breaking scenarios
   - Build consensus calculation algorithm
   - **Set up GraphQL subscriptions for real-time voting updates**
   - **Implement GraphQL mutations for vote submission and tracking**

1a. **Drag & Drop Ranking Interface (Future)**

- Install and configure @dnd-kit for drag-and-drop functionality
- Create restaurant ranking interface with drag-and-drop
- Implement sortable restaurant lists
- Add visual feedback and animations for ranking
- Handle touch-friendly interactions for mobile

2. **Random Selection for Groups**
   - Extend random selection to group collections
   - Implement group-specific weighting
   - Create group decision UI components
   - Handle group decision timeouts

3. **Decision Management**
   - Set decision deadlines and time limits
   - Send notifications to group members
   - Track decision status and progress
   - Handle incomplete decisions gracefully
   - **Implement GraphQL subscriptions for decision status updates**
   - **Add real-time decision progress tracking with GraphQL**

**🔄 Parallel Work Note**: Stories 1, 2, and 3 SHOULD be worked on in parallel - they are all core decision-making features that need to work together, and developing them simultaneously ensures proper integration and consistent UX patterns.

## 📱 Epic 5: Mobile-First Experience

**Goal**: Optimize the app for mobile devices and create PWA capabilities

### Stories:

1. **Mobile UI Optimization**
   - Implement mobile-first responsive design
   - Optimize touch interactions and gestures
   - Create mobile-specific navigation patterns
   - Test across different screen sizes

1a. **Design System Migration & Legacy UI Updates**

- Audit existing UI components against updated design system specifications
- Update legacy components to match new neumorphic design patterns
- Migrate color system to new monochrome + infrared accent palette
- Update shadow system to soft neumorphic (iOS-inspired) styling
- Refactor navigation to bottom navigation with floating action button
- Update restaurant cards to new visual hierarchy (Photo → Name → Price/Rating → Distance → Tags)
- Implement new typography scale and font weights
- Update form inputs to neumorphic styling with proper focus states
- Migrate button components to new interaction patterns
- Update layout containers and spacing to new system
- Ensure all components support system preference detection (dark/light mode)
- Test design system consistency across all existing screens
- Document component migration checklist and completion status

1b. **Enhanced Animations & Interactions (Future)**

- Install and configure Framer Motion for animations
- Implement smooth transitions and micro-interactions
- Add loading animations and skeleton screens
- Create gesture-based interactions for mobile
- Optimize animations for performance

2. **PWA Implementation**
   - Set up service workers for offline functionality
   - Implement app manifest and install prompts
   - Create offline data caching strategy
   - Enable background sync capabilities

3. **Performance Optimization**
   - Implement `aggressive` caching strategies
   - Optimize bundle size and loading times
   - Add performance monitoring
   - Implement lazy loading and code splitting

4. **Map View Implementation**
   - Implement interactive map view for restaurant collections
   - Integrate Google Maps API for restaurant location display
   - Add map markers for each restaurant in the collection
   - Create map view toggle functionality in CollectionRestaurantsList
   - Implement restaurant selection and details on map interaction
   - Add map controls for zoom, pan, and marker clustering
   - Handle map view state management and persistence
   - Ensure mobile-optimized map interactions and touch gestures
   - Add map view loading states and error handling
   - **Unit test map view components and Google Maps integration**

## 🛠️ Epic 6: Admin Panel & Monitoring

**Goal**: Comprehensive admin dashboard for system monitoring and management

### Stories:

1. **Admin Panel Foundation**
   - Create comprehensive admin panel at `/admin` with tabbed interface
   - Implement AdminGate component with user ID allowlist for security
   - Add tabs for Analytics, Cost Monitoring, Users, Database, Settings
   - Ensure admin panel is protected behind authentication
   - Add external tools section with legacy dashboard links
   - **Unit test admin panel components and security gates**

2. **Cost Monitoring Dashboard**
   - Implement real-time cost monitoring with historical data
   - Add cost breakdown by API service (Google Places, Maps, etc.)
   - Display daily/monthly cost projections and savings
   - Show cache performance metrics and hit rates
   - Add cost recommendations and optimization suggestions
   - Implement auto-refresh and manual refresh capabilities
   - **Unit test cost monitoring components and data visualization**

**🔄 Parallel Work Group A: Data Management Dashboards**
_These stories should be worked on together as they share common data patterns, API endpoints, and UI components_

3. **User Management Dashboard**
   - Display user statistics and activity metrics
   - Show user registration trends and engagement data
   - Implement user search and filtering capabilities
   - Add user profile management tools
   - Display friend request and group invitation metrics
   - **Unit test user management components and data tables**

4. **Database Management Dashboard**
   - Show database connection status and performance metrics
   - Display collection and restaurant data statistics
   - Add database query performance monitoring
   - Implement data cleanup and maintenance tools
   - Show storage usage and optimization recommendations
   - **Unit test database management components and monitoring**

5. **Usage Analytics Dashboard**
   - Track API usage patterns and trends
   - Display most popular features and endpoints
   - Show user behavior analytics and engagement metrics
   - Implement usage forecasting and capacity planning
   - Add performance benchmarking and comparison tools
   - **Unit test analytics components and data visualization**

**🔄 Parallel Work Group B: Configuration & Monitoring**
_These stories should be worked on together as they share configuration patterns, alert systems, and monitoring infrastructure_

5. **System Settings Dashboard**
   - Configure rate limiting settigstngs and thresholds
   - Manage API key configurations and restrictions
   - Set up alert thresholds for costs and performance
   - Configure notification settings for admin alerts
   - Manage system maintenance and downtime windows
   - **Unit test system settings components and configuration**

6. **Admin Alert System Implementation**
   - Implement email notifications for admin events (We've decided to use Resend as the service provider for emails)
   - Add real-time monitoring for API failures and circuit breakers
   - Configure threshold-based alerts for performance degradation
   - Set up emergency contact system for critical issues
   - **Unit test alert system components and notification delivery**

### ✅ Epic 6 Work Group B: Configuration & Monitoring - COMPLETED

**Implementation Summary:**
Epic 6 Work Group B has been **100% completed**, implementing comprehensive system settings management and admin alert system functionality.

**Key Technical Achievements:**

**System Settings Dashboard:**

- **RESTful API Design**: Type-safe interfaces with comprehensive validation (`/api/admin/settings`)
- **React Component Architecture**: Reusable form components with real-time validation
- **Configuration Management**: Rate limiting, API keys, alert thresholds, notifications, maintenance
- **Security & Validation**: Input validation, email validation, and error handling
- **Settings Reset**: Reset to defaults functionality with confirmation

**Admin Alert System:**

- **Resend Email Integration**: Complete email notification service with rich HTML templates
- **Real-time Monitoring**: Circuit breaker system with configurable thresholds
- **Alert Management**: CRUD operations with filtering, acknowledgment, and resolution
- **Emergency Contact System**: Critical issue routing with contact information
- **Email Debugging**: Resolved API key validation for restricted Resend keys

**Production-Ready Features:**

- **200+ Test Cases**: Comprehensive testing for all functionality
- **Performance Optimization**: Client-side validation, efficient state management
- **Error Handling**: Graceful degradation and recovery mechanisms
- **Environment Configuration**: RESEND_API_KEY integration with proper validation
- **Logging & Monitoring**: Production-ready logging and monitoring throughout

**Files Created/Modified:**

- **API Endpoints**: `/api/admin/settings`, `/api/admin/alerts`, `/api/admin/alerts/test-email`
- **Components**: `SystemSettingsDashboard`, `AdminAlertsDashboard`
- **Services**: `email-notifications.ts`, `monitoring.ts`
- **Integration**: Updated `AdminPanel` and `AdminNav` for new tabs
- **Testing**: Comprehensive test suites for all components and APIs

## 🔔 Epic 7: Notifications & Communication

**Goal**: Enable real-time communication and notifications

### Stories:

1. **Custom Registration Page with Phone & SMS Opt-in**
   - Replace Clerk's default registration modal with custom registration page
   - Create multi-step registration flow explaining app benefits
   - Implement phone number sign-up option using Clerk's phone authentication
   - Add SMS opt-in toggle during registration (default: off)
   - Explain SMS benefits: group decision notifications, friend requests, group invites
   - Store SMS preferences in user profile for group-specific settings
   - Implement phone number verification flow for users who sign up with phone
   - Handle reverification for adding phone numbers to existing email accounts
   - **Add optional city/state capture during registration for location-based features**
   - **Implement city/state validation and formatting for consistent data storage**
   - **Update user database schema to include location preferences and SMS settings**
   - **Unit test custom registration components and phone verification flow**

1a. **Add Custom Login Page**

- Create dedicated sign-in page at `/sign-in` route
- Replace Clerk's default modal with custom page-based authentication
- Implement custom sign-in UI matching app design system
- Add custom sign-up page at `/sign-up` route for consistency
- Configure Clerk appearance to match app branding and styling
- Implement proper redirect handling after authentication
- Add back navigation to home page from auth pages
- Ensure mobile-responsive design for auth pages
- **Unit test custom authentication pages and components**

2. **SMS Integration & Admin Alerts**
   - Integrate Twilio for SMS notifications
   - Create SMS opt-in/opt-out system
   - Implement group-specific notification preferences
   - Handle SMS delivery and error cases
   - **Admin Alert System**: Set up Twilio SMS alerts for cost spikes and system issues
   - **Admin Notifications**: Implement emergency SMS alerts for critical system failures
   - **Cost Monitoring Alerts**: SMS notifications when daily costs exceed thresholds
   - **System Health Alerts**: SMS alerts for circuit breaker activations and API failures

3. **In-App Notifications**
   - Create notification system for group decisions
   - Implement real-time updates for group activities
   - Add notification preferences and settings
   - Create notification history and management
   - **Implement GraphQL subscriptions for real-time notifications**
   - **Add GraphQL queries for notification history and preferences**

**🔄 Parallel Work Note**: Stories 2, 3, and 4 SHOULD be worked on in parallel - they are all notification systems that need to work together seamlessly, and developing them simultaneously ensures consistent notification patterns and proper integration.

3a. **Toast Notification System**

- Install and configure React Hot Toast (Sonner)
- Implement user feedback notifications
- Add success, error, and info toast types
- Create notification positioning and styling
- Handle notification queuing and dismissal

4. **Push Notifications (PWA)**
   - Implement push notification manager with permission handling
   - Create push notification subscription system
   - Add push notification preferences and opt-in/opt-out
   - Implement test notification functionality
   - Handle iOS-specific requirements (iOS 16.4+, Home Screen installation)
   - Add push notification status monitoring and debugging
   - Create notification permission prompts with clear explanations
   - Implement graceful degradation for unsupported platforms
   - **Integrate with service worker for background notifications**
   - **Add notification action handlers and click-through navigation**
   - **Create notification templates for different event types**
   - **Unit test push notification manager and subscription flows**

5. **Email Notifications**
   - Set up email notification system
   - Create email templates for different events
   - Implement email preferences and unsubscribing
   - Handle email delivery and tracking

6. **User Profile Management**
   - Create comprehensive user profile page with editable fields
   - Implement profile picture upload and management using Vercel Blob
   - Add phone number management (add/remove/verify) with Clerk integration
   - Build SMS opt-in/opt-out toggle with clear explanation
   - Create per-group notification preferences interface
   - Implement location settings and default location management
   - Add push notification preferences to profile settings
   - Add profile validation and error handling
   - Create profile update API endpoints with proper validation
   - **Unit test profile management components and API endpoints**
   - **Update user database schema to support profile picture URLs and enhanced preferences**

## 📊 Epic 8: Analytics & History

**Goal**: Provide insights and historical data to users

### Stories:

1. **Decision History**
   - Create comprehensive decision tracking
   - Implement history viewing and filtering
   - Add manual decision entry capability
   - Create history search and analytics

2. **Weighting System**
   - Implement 30-day rolling weight algorithm
   - Create weight adjustment and reset logic
   - Add weight visualization and debugging
   - Handle edge cases in weighting system

3. **Analytics Dashboard**
   - Create user analytics and insights
   - Implement group activity tracking
   - Add restaurant popularity metrics
   - Create data export capabilities
   - **Implement GraphQL queries for complex analytics data**
   - **Add GraphQL subscriptions for real-time analytics updates**

**🔄 Parallel Work Note**: Stories 1, 2, and 3 SHOULD be worked on in parallel - they are all analytics features that need to work together, and developing them simultaneously ensures consistent data models and proper integration between history, weighting, and dashboard features.

## 🎨 Epic 9: Polish & Optimization

**Goal**: Refine the user experience and optimize performance

### Stories:

1. **UI/UX Polish**
   - Refine animations and transitions
   - Improve accessibility compliance
   - Optimize color contrast and readability
   - Add micro-interactions and feedback

2. **Performance & Reliability**
   - Implement comprehensive error handling
   - Add loading states and skeleton screens
   - Optimize API calls and caching
   - Add monitoring and alerting

2a. **Error Boundaries & Graceful Error Handling (Future)**

- Implement React Error Boundaries for component error handling
- Create fallback UI components for error states
- Add error reporting and logging
- Implement graceful degradation for failed features
- Add user-friendly error messages and recovery options

3. **Advanced Testing & Quality Assurance**
   - Implement integration testing (full user workflows)
   - Add E2E testing for critical user journeys
   - Create accessibility testing suite
   - Add performance testing and monitoring
   - Optimize test coverage and remove redundant tests

4. **Performance Benchmarking & Monitoring**
   - Establish baseline performance metrics for current REST API
   - Measure API response times for complex queries (dashboard data, restaurant search)
   - Record bundle size and loading performance metrics
   - Document current caching effectiveness and hit rates
   - Create performance monitoring dashboard for tracking
   - Set up automated performance testing in CI/CD pipeline
   - **Note**: This should be completed before implementing GraphQL or other advanced optimizations to establish proper baselines

## 🚀 Epic 10: Deployment & Launch

**Goal**: Deploy the app and prepare for production use

### Stories:

1. **Production Deployment**
   - Set up Vercel deployment pipeline
   - Configure production environment variables
   - Implement CI/CD workflows
   - Set up monitoring and logging
   - **⚠️ CRITICAL: Test Push Notifications immediately after deployment** (see post-deployment.md for details)

1a. **GraphQL Integration (Future)**

- Install and configure Apollo Server for GraphQL API
- Set up Apollo Client for frontend GraphQL queries
- Implement GraphQL schema for complex data fetching
- Add GraphQL subscriptions for real-time features
- Migrate complex REST endpoints to GraphQL
- Set up GraphQL playground and documentation

1b. **Post-GraphQL Performance Analysis (Future)**

- Measure API response times after GraphQL implementation
- Compare bundle size and loading performance vs baseline
- Analyze caching effectiveness and query efficiency
- Document network request reduction and data fetching optimization
- Evaluate real-time feature performance and user experience
- Create performance comparison report with objective metrics

2. **SEO & Marketing**
   - Optimize for search engines
   - Create landing page and marketing content
   - Implement analytics and tracking
   - Set up error monitoring and reporting

3. **Launch Preparation**
   - Create user documentation and help content
   - Set up support and feedback systems
   - Implement feature flags for gradual rollout
   - Prepare for user onboarding and support

## 📋 Epic 11: Future Enhancements

**Goal**: Plan and prepare for future features and iOS app

### Stories:

1. **iOS App Preparation**
   - Document architecture for iOS conversion
   - Create component mapping and conversion plan
   - Identify platform-specific considerations
   - Plan state management migration strategy

2. **Advanced Features**
   - Plan advanced search and filtering
   - Design recommendation system
   - Plan social features and sharing
   - Design integration with food delivery services

3. **Scalability & Growth**
   - Plan for increased user base
   - Design multi-tenant architecture
   - Plan for international expansion
   - Design advanced analytics and insights

---

## 📝 Notes

- Each epic should be completed before moving to the next
- Stories within epics can be worked on in parallel where appropriate
- Regular reviews and adjustments should be made based on user feedback
- All epics should maintain the mobile-first, PWA-ready architecture
- Cost optimization and performance should be considered throughout
