# You Hungry? App - Project Overview

## 🎯 Core Concept

**You Hungry?** is a mobile-first web application designed to solve the eternal question: "What should we eat tonight?" Born from the constant conversation between spouses about where to order food, the app helps users organize their favorite restaurants and make collaborative decisions with friends and family.

### The Problem

- Users forget about restaurants they wanted to try
- Difficulty organizing restaurants by mood/hunger level
- Group decision-making is time-consuming and often results in indecision
- No system to track what's been eaten recently to avoid repetition

### The Solution

A comprehensive restaurant management and decision-making platform that:

- Organizes restaurants into customizable collections
- Enables both individual and group decision-making
- Tracks eating history to prevent recent repeats
- Provides multiple decision methods (tiered voting, random selection)
- Supports both personal and social use cases

## 🏗️ App Architecture

### User Flows

The app supports two main user flows:

#### 1. Authenticated Users

- **Personal Collections**: Create and manage personal restaurant collections
- **Social Features**: Add friends and create groups for collaborative decisions
- **Decision Making**: Use tiered voting or random selection algorithms
- **History Tracking**: View past decisions and eating patterns

#### 2. Unauthenticated Users

- **Restaurant Search**: Browse and search restaurants without saving
- **App Discovery**: Learn about the app's features and benefits

## 🍽️ Core Features

### Personal Collections

- Create custom-named collections (e.g., "To try when I'm alone", "When I'm really hungry")
- Add restaurants to multiple collections
- Prevent duplicate restaurants within the same collection
- Custom restaurant fields: Price Range ($-$$$$) and Time to Pick Up (minutes)

### Group Management

- Add friends by email/username
- Create groups with custom names and descriptions
- Admin privileges for group management
- Members can add restaurants to group collections

### Decision Making

Two decision methods available:

#### Tiered Choice System

- Each member ranks their top 3 choices
- Majority vote determines selection
- Tie-breaking with member choice or random selection
- Re-ranking if no consensus after first round

#### Random Selection

- Weighted selection based on 30-day rolling history
- Choose from all collections or specific collections
- Exponential weighting (recently chosen restaurants have lower chance)
- Minimum chance for all restaurants to ensure variety

### History & Analytics

- Track all decisions (personal and group)
- 30-day rolling weight system
- Manual entry for decisions made outside the app
- Separate weighting for personal vs group decisions
- Group decisions appear in individual history with "group" label

## 🎨 User Experience

### Mobile-First Design

- Optimized for mobile devices
- Touch-friendly interactions
- Responsive design for all screen sizes
- PWA capabilities for app-like experience

### Key Pages

- **Landing Page**: App description and feature overview
- **Dashboard**: Personal collections and recent activity
- **Restaurant Search**: Find and add restaurants
- **Collections Management**: Create, edit, and manage collections
- **Group Management**: Friends, groups, and invitations
- **Decision Making**: Start and participate in decisions
- **History**: View past decisions and patterns
- **Profile**: User settings and preferences

## 🔧 Technical Requirements

### Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: MongoDB Atlas
- **Authentication**: Clerk
- **APIs**: Google Places, Google Address Validation, Twilio
- **Hosting**: Vercel
- **PWA**: Service Workers, App Manifest

### Performance & Cost Optimization

- Aggressive caching for API responses (30+ days)
- Batch API requests to minimize costs
- Stale-while-revalidate pattern
- Local database storage for frequently accessed data
- PWA offline capabilities

### Accessibility

- WCAG AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast color ratios

## 🚀 Future Vision

### Phase 1: Web Application

- Complete web app with all core features
- PWA implementation for mobile experience
- Focus on personal and small group use cases

### Phase 2: iOS App

- Native iOS application
- Enhanced mobile experience
- Native notifications instead of SMS
- Optimized for iOS-specific features

### Phase 3: Advanced Features

- Integration with food delivery services
- Advanced analytics and insights
- Social sharing and viral features
- Multi-language support

## 📋 Implementation Guidelines

### Development Principles

- **Incremental Development**: Build step-by-step, avoiding overwhelming complexity
- **Component Reusability**: Create reusable, well-documented components
- **Performance Optimization**: Implement memoization and efficient rendering
- **Cost Consciousness**: Minimize API calls through aggressive caching
- **Mobile-First**: Design for mobile devices first, then scale up

### Documentation Standards

- **Comprehensive Documentation**: Maintain detailed docs in promptFiles directory
- **Regular Updates**: Keep documentation current with implementation
- **Progress Tracking**: Document completed items and pending tasks
- **Decision Logging**: Record all architectural and feature decisions

### Quality Assurance

- **Unit Testing**: Comprehensive testing with React Testing Library
- **Accessibility**: WCAG AA compliance throughout
- **SEO Optimization**: Optimize for search engines and ATS scanners
- **Performance Monitoring**: Track and optimize app performance

## 🔑 Required Setup

### API Keys & Services

- **MongoDB Atlas**: Cluster connection string and database name
- **Clerk**: API keys for authentication and webhook secret
- **Google Places API**: For restaurant search and data
- **Google Address Validation API**: For address verification
- **Twilio**: Account SID, Auth Token, and phone number (SMS notifications)

### Database Collections

- `users` - User profiles and preferences
- `restaurants` - Restaurant data and metadata
- `collections` - Personal and group food collections
- `groups` - Group information and memberships
- `decisions` - Historical decision records
- `friendships` - Friend relationships

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/you-hungry?retryWrites=true&w=majority
MONGODB_DATABASE=you-hungry

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # Optional for development

# Google APIs
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### MongoDB Setup Clarification

- **MONGODB_URI**: The full connection string to your MongoDB Atlas cluster
- **MONGODB_DATABASE**: The specific database name within the cluster (e.g., "you-hungry")
- The cluster can contain multiple databases, but we'll use the "you-hungry" database for this project

## 📚 Documentation Structure

This project maintains comprehensive documentation in the `promptFiles/` directory:

- **general-outline.md** - This file (project overview and requirements)
- **epic-breakdown.md** - Sequential development plan with epics and stories
- **pending-items.md** - All planned items organized by priority
- **completed-items.md** - Track completed work and milestones
- **in-flight.md** - Current work in progress
- **questions-and-answers.md** - Decision log and Q&A reference
- **technical-architecture.md** - Detailed technical specifications
- **implementation-guidelines.md** - Coding standards and best practices
- **design-system.md** - Visual design system and component library
- **user-flows.md** - Complete user journey documentation
- **post-deployment.md** - Production setup and deployment checklist

## 🎯 Success Metrics

### Technical Goals

- **Performance**: Sub-3-second load times on mobile
- **Accessibility**: 100% WCAG AA compliance
- **Cost Efficiency**: Minimize API costs through smart caching
- **User Experience**: Intuitive, mobile-first interface

### Business Goals

- **User Engagement**: Regular use by target audience
- **Decision Success**: High completion rate for group decisions
- **User Retention**: Users return to make decisions
- **Showcase Quality**: Impressive portfolio piece for job applications

## 🚀 Next Steps

1. **Review Documentation**: Ensure all requirements are understood
2. **Set Up Environment**: Configure development environment and API keys
3. **Begin Epic 1**: Start with Foundation & Authentication
4. **Iterative Development**: Build incrementally with regular reviews
5. **Quality Assurance**: Test thoroughly at each milestone
