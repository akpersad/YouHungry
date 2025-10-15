# Pending Items - You Hungry? App

This document tracks all planned items that are not yet started, organized by category and priority.

## 🔥 High Priority (Next Sprint)

### Foundation & Setup ✅ COMPLETED

- [x] Set up Next.js 15 with TypeScript configuration
- [x] Configure Tailwind CSS with custom design system
- [x] Set up ESLint, Prettier, and development tools
- [x] Configure environment variables and secrets management
- [x] Set up MongoDB Atlas cluster and connection
- [x] Design and implement database schema
- [x] Integrate Clerk for user authentication
- [x] Set up Jest testing framework with React Testing Library
- [x] Implement pre-commit hooks with Husky and lint-staged
- [x] Set up pre-push validation pipeline
- [x] Install and configure Bundle Analyzer for performance monitoring
- [x] Add comprehensive unit tests for authentication components
- [x] Complete Epic 1: Foundation & Authentication

### Core Feature Development (Epic 2 - In Progress)

- [x] Build collection CRUD operations ✅ COMPLETED
- [x] Create user dashboard with personal collections ✅ COMPLETED
- [x] Implement restaurant search with Google Places API ✅ COMPLETED
- [x] Create restaurant search UI components ✅ COMPLETED
- [x] Set up GraphQL schema and resolvers for restaurant queries ✅ COMPLETED
- [x] Fix address dropdown and image loading issues ✅ COMPLETED
- [x] Add geocoding integration for accurate search ✅ COMPLETED
- [x] Complete Epic 2 Story 2 - Restaurant Search & Discovery ✅ COMPLETED
- [x] Enhance address input UX with improved keyboard navigation ✅ COMPLETED
- [x] Fix address validation API response handling ✅ COMPLETED
- [x] Improve Google Places API error handling ✅ COMPLETED
- [x] Add comprehensive testing infrastructure with fetch mocking ✅ COMPLETED
- [x] Complete Epic 2 Story 3 - Enhanced Form Management ✅ COMPLETED
  - [x] Implemented simplified form state management using React useState
  - [x] Created reliable validation functions with clear error messages
  - [x] Updated CreateCollectionForm and RestaurantSearchForm with simplified approach
  - [x] Removed complex Zod dependencies for better maintainability
  - [x] Added comprehensive form testing and validation
- [x] Add restaurant management functionality ✅ COMPLETED
- [x] Implement comprehensive decision making system ✅ COMPLETED
  - [x] Weighted random selection algorithm with 30-day rolling weights
  - [x] Decision history tracking and statistics
  - [x] DecisionResultModal and DecisionStatistics UI components
  - [x] REST API endpoints for decision creation and random selection
  - [x] GraphQL integration for decision queries and statistics
  - [x] Comprehensive test coverage for all decision functionality

### Advanced Features (Future)

- [ ] Implement drag-and-drop restaurant ranking system with @dnd-kit
- [x] Set up GraphQL server with Apollo Server ✅ COMPLETED
- [x] Implement GraphQL schema for restaurants and collections ✅ COMPLETED
- [x] Create GraphQL resolvers for complex queries ✅ COMPLETED
- [ ] Add GraphQL client with Apollo Client
- [x] Implement React Hook Form with Zod integration ✅ COMPLETED
- [x] Set up TanStack Query for API state management ✅ COMPLETED
- [x] Implement comprehensive notification system (SMS, Email, In-App, Push, Toast) ✅ COMPLETED
- [x] Add user profile management with Vercel Blob integration ✅ COMPLETED
- [x] Implement URL shortener service for SMS notifications ✅ COMPLETED

## 📋 Medium Priority (Upcoming Sprints)

### Social Features

- [x] Implement friend management system ✅ COMPLETED
- [ ] Create group creation and management
- [ ] Build group collections functionality
- [ ] Add group member role management

### User Experience & Registration

- [x] Implement custom registration flow with city/state capture ✅ COMPLETED
  - [x] Create custom registration form with optional city/state fields ✅ COMPLETED
  - [x] Update webhook handler to capture custom registration data ✅ COMPLETED
  - [x] Replace temporary user sync process with proper registration flow ✅ COMPLETED
  - [x] Add city/state validation and formatting ✅ COMPLETED
  - [x] Update user interface to include location preferences ✅ COMPLETED

### Decision Making

- [ ] Implement tiered choice system for groups
- [ ] Create random selection for groups
- [ ] Build decision management and timeouts
- [x] Add group decision notifications ✅ COMPLETED
- [ ] Set up GraphQL subscriptions for real-time decision updates
- [ ] Implement GraphQL mutations for vote submission
- [ ] Add real-time voting progress tracking
- [ ] Create GraphQL queries for decision analytics

### Mobile & PWA

- [x] Mobile-first responsive design with neumorphic system ✅ COMPLETED (Epic 5 Phase 1 & 2)
- [x] Bottom navigation and touch-optimized components ✅ COMPLETED (Epic 5 Phase 2)
- [x] Add offline functionality and caching with TanStack Query ✅ COMPLETED
- [ ] **Epic 5 Story 1b - Phase 3: Animation & Polish** (NEXT PRIORITY)
  - [ ] Framer Motion setup and configuration
  - [ ] Page transition animations (route changes, modals, loading states)
  - [ ] Component entrance/exit animations (staggered lists, cards, forms)
  - [ ] Micro-interactions (button press, hover, touch feedback)
  - [ ] Gesture-based interactions (swipe, pull-to-refresh, long-press, drag-and-drop)
  - [ ] Loading state animations (skeleton screens, progress indicators)
  - [ ] Performance optimization (adaptive animation quality, will-change hints)
  - [ ] **WCAG 2.2 AA Accessibility Upgrade** (from current WCAG 2.1 AA)
    - Enhanced focus management with visible outlines (2.4.7)
    - Touch target optimization - 44px minimum (2.5.5)
    - Motion sensitivity - prefers-reduced-motion support (3.2.5)
    - Error identification with recovery instructions (3.3.3)
    - Non-text contrast for UI components (1.4.11)
    - Focus visible indicators (2.4.7)
    - Target size compliance (2.5.5)
- [ ] PWA capabilities and service workers (Epic 5 Story 2)
- [ ] Implement GraphQL query caching for offline support
- [ ] Add GraphQL subscription optimization for mobile
- [ ] Create mobile-optimized GraphQL queries

## 🔮 Low Priority (Future Sprints)

### Advanced Features

- [x] Implement SMS notifications with Twilio ✅ COMPLETED
- [x] Implement email notifications with Resend ✅ COMPLETED
- [x] Add in-app notification system ✅ COMPLETED
- [x] Implement push notifications for PWA ✅ COMPLETED
- [x] Add toast notification system with Sonner ✅ COMPLETED
- [x] Implement user profile management with picture uploads ✅ COMPLETED
- [ ] Create comprehensive analytics dashboard
- [ ] Add decision history and insights
- [ ] Build recommendation system

### Polish & Optimization

- [ ] Add comprehensive error handling with Error Boundaries
- [ ] Implement loading states and skeleton screens with Framer Motion
- [ ] Create accessibility testing suite
- [ ] Add performance monitoring with Web Vitals and Bundle Analyzer
- [x] Optimize GraphQL query performance with TanStack Query ✅ COMPLETED
- [ ] Implement GraphQL error handling and retry logic
- [ ] Add GraphQL query complexity analysis
- [ ] Create GraphQL performance monitoring
- [x] Implement user feedback system with toast notifications ✅ COMPLETED
- [x] Implement comprehensive notification testing suite (101 passing tests) ✅ COMPLETED

### Future Enhancements

- [ ] Plan iOS app conversion strategy
- [ ] Design advanced search and filtering
- [ ] Plan social features and sharing
- [ ] Design integration with food delivery services

## 🚧 Backlog Items (Future Iterations)

### Nice-to-Have Features

- [ ] Video call integration for group decisions
- [ ] Integration with food delivery APIs
- [ ] Advanced restaurant recommendations
- [ ] Social sharing and viral features
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced analytics and insights
- [ ] Restaurant rating and review system
- [ ] Integration with calendar apps
- [x] Location-based push notifications ✅ COMPLETED

### Technical Improvements

- [ ] Implement advanced caching strategies
- [ ] Add comprehensive monitoring and alerting
- [ ] Create automated testing pipeline
- [ ] Implement feature flags system
- [ ] Add A/B testing capabilities
- [ ] Create admin dashboard for app management
- [ ] Implement advanced security measures
- [ ] Add data export and backup features

### Scalability & Growth

- [ ] Plan for multi-tenant architecture
- [ ] Design for international expansion
- [ ] Implement advanced user management
- [ ] Create content management system
- [ ] Add advanced search capabilities
- [ ] Implement real-time collaboration features

## 🎨 UI/UX Design Considerations (Future)

### Collection Selection UI (Epic 3+)

- **Current Implementation**: Collections show as buttons when ≤3, dropdown when >3
- **Future Challenge**: When groups are introduced, we'll need to distinguish between:
  - Personal collections (user's own)
  - Group collections (shared with friends)
  - Group collections by specific groups
- **Proposed Solution**: Consider implementing:
  - Grouped sections in dropdown (Personal Collections, Group Collections)
  - Visual indicators (icons, colors) to distinguish collection types
  - Search/filter functionality within collection selection
  - Recent collections or favorites at the top
- **Note**: This is a future consideration for Epic 3+ when group features are implemented

## 📝 Notes

- Items are organized by priority and estimated effort
- High priority items should be completed first
- Medium priority items can be worked on in parallel
- Low priority items should be evaluated based on user feedback
- Backlog items should be reviewed regularly and promoted based on value
- All items should maintain the mobile-first, PWA-ready architecture
- Cost optimization should be considered for all API integrations
