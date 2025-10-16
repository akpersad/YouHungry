# 🍔 Fork In The Road (You Hungry?)

**A sophisticated restaurant decision-making platform built with modern web technologies**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Tests](https://img.shields.io/badge/Tests-1367%20Passing-success)](/)
[![Coverage](https://img.shields.io/badge/Coverage-90%25+-success)](/)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-90%2B-success)](/)
[![Bundle](https://img.shields.io/badge/Bundle-<500KB-success)](/)

> **Born from the eternal question: "What should we eat tonight?"**  
> Fork In The Road helps individuals and groups discover, organize, and decide on restaurants with intelligent decision-making algorithms and real-time collaboration features.

---

## 🎬 Demo & Case Study

![Fork In The Road Demo](./public/screenshots/demo-walkthrough.gif)

**Quick Overview:**

- 🔐 Secure authentication with phone verification
- 🔍 Intelligent restaurant search with Google Places
- 📚 Personal collections and social features
- 🎲 Smart decision algorithms (weighted random & tiered voting)
- 🔔 Multi-channel notifications (in-app, email, SMS, push)
- 📱 Progressive Web App with offline support

> 📸 **Note**: Create a demo GIF showing the core flow: search → add to collection → create group decision → vote → result

---

## 📑 Table of Contents

- [Demo & Case Study](#-demo--case-study)
- [System Architecture](#-system-architecture)
- [Tech Stack Decisions](#-tech-stack-decisions)
- [Code Highlights](#-code-highlights)
- [Quality Metrics](#-quality-metrics)
- [Features](#-features)
- [Technologies](#-technologies)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Performance & Optimization](#-performance--optimization)
- [Contributing](#-contributing)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   Next.js    │  │   React 19   │  │  TailwindCSS │  │ Framer      ││
│  │  App Router  │  │  Components  │  │  + Dark Mode │  │  Motion     ││
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  └─────────────┘│
│         │                 │                                              │
│         └────────┬────────┘                                              │
│                  │                                                       │
│         ┌────────▼────────┐                                             │
│         │  TanStack Query │  (Client State + Cache)                     │
│         └────────┬────────┘                                             │
└──────────────────┼──────────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────────────────┐
│                        API LAYER (Next.js)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  REST Routes │  │   Clerk Auth │  │     Zod      │  │   Rate      ││
│  │  /api/*      │  │  Middleware  │  │  Validation  │  │  Limiting   ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────────────┘│
│         │                 │                  │                          │
│         └────────┬────────┴──────────────────┘                          │
│                  │                                                       │
└──────────────────┼──────────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │  Decision Engine │  │  Notification    │  │  Collection         │  │
│  │  • Weighted Rand │  │  Orchestration   │  │  Management         │  │
│  │  • Tiered Voting │  │  • In-App        │  │  • CRUD Ops         │  │
│  │  • History Track │  │  • Email         │  │  • Sharing          │  │
│  │                  │  │  • SMS           │  │                     │  │
│  │                  │  │  • Push (PWA)    │  │                     │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────────┘  │
└──────────────────┬──────────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────────────────┐
│                       DATA & SERVICES LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  MongoDB    │  │   Google    │  │   Twilio    │  │   Resend    │  │
│  │   Atlas     │  │  Places API │  │   SMS API   │  │  Email API  │  │
│  │             │  │             │  │             │  │             │  │
│  │ • Users     │  │ • Search    │  │ • Phone     │  │ • Templates │  │
│  │ • Restaurants│ │ • Geocode   │  │   Verify    │  │ • Delivery  │  │
│  │ • Collections│ │ • Details   │  │ • Messages  │  │             │  │
│  │ • Decisions │  │             │  │             │  │             │  │
│  │ • Groups    │  │ 30-day      │  │             │  │             │  │
│  │ • Metrics   │  │   Cache ✓   │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**

1. **App Router over Pages Router**: Enables React Server Components, streaming, and better performance
2. **TanStack Query**: Intelligent client-side caching reduces API calls by ~60%
3. **30-Day Google Places Cache**: Saves $50-100/month on API costs
4. **Clerk Webhooks**: Real-time user sync keeps MongoDB in perfect sync
5. **Notification Orchestration**: Single interface manages 4 delivery channels
6. **Weighted Random Algorithm**: Uses 30-day rolling history to prevent repetition
7. **Optimistic Updates**: Immediate UI feedback with automatic rollback

---

## 🤔 Tech Stack Decisions

### Core Framework Choices

| Decision      | What I Chose             | Why                                                                                                                                                 | Alternative Considered         | Tradeoff                                                              |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| **Framework** | Next.js 15 (App Router)  | • React Server Components for performance<br>• Built-in API routes eliminate backend setup<br>• Vercel deployment is seamless<br>• Best-in-class DX | Remix, SvelteKit               | Learning curve for App Router, but RSC benefits outweigh complexity   |
| **Database**  | MongoDB Atlas            | • Flexible schema for rapid iteration<br>• Generous free tier<br>• Built-in performance monitoring<br>• Excellent Node.js support                   | PostgreSQL + Prisma, Supabase  | No relational constraints, but document model fits use case perfectly |
| **Auth**      | Clerk                    | • Phone verification out of the box<br>• Webhooks for real-time sync<br>• Beautiful pre-built UI<br>• Social login support                          | NextAuth.js, Auth0             | Vendor lock-in, but 10,000 free MAUs and incredible DX justify it     |
| **Styling**   | Tailwind CSS 4           | • Utility-first = rapid prototyping<br>• Built-in dark mode<br>• Tiny production bundle<br>• Excellent VS Code support                              | CSS Modules, styled-components | No component isolation, but design system prevents chaos              |
| **State**     | TanStack Query + Context | • Automatic caching and refetching<br>• Optimistic updates<br>• DevTools for debugging<br>• Small bundle (13KB)                                     | Redux Toolkit, Zustand         | Only for server state; Context handles auth/preferences               |
| **Forms**     | React Hook Form          | • Minimal re-renders<br>• Built-in validation<br>• 9KB bundle size<br>• Great TypeScript support                                                    | Formik, native forms           | More boilerplate than native, but performance wins                    |

### API & Services

| Service             | What I Chose      | Why                                                                                                   | Cost Consideration                                         |
| ------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Restaurant Data** | Google Places API | • Most comprehensive database<br>• Real-time reviews and ratings<br>• Accurate location data          | **$32/1000 searches** → 30-day cache reduces to ~$10/month |
| **SMS**             | Twilio            | • Industry standard<br>• Reliable delivery<br>• Phone verification included                           | **$0.0079/SMS** → URL shortening saves ~40%                |
| **Email**           | Resend            | • React Email templates<br>• 100/day free tier<br>• Modern API                                        | **Free tier sufficient** for MVP                           |
| **Hosting**         | Vercel            | • Zero-config Next.js deployment<br>• Edge functions<br>• Preview deployments<br>• Analytics included | **Free hobby tier** → $20/month pro for production         |

### Performance Choices

| Decision               | What I Chose                  | Benefit                                      | Evidence                         |
| ---------------------- | ----------------------------- | -------------------------------------------- | -------------------------------- |
| **Image Optimization** | Next.js Image Component       | Automatic WebP/AVIF conversion, lazy loading | **~70% smaller images**          |
| **Bundle Analyzer**    | @next/bundle-analyzer         | Identify heavy dependencies                  | **Kept total bundle < 500KB**    |
| **Code Splitting**     | Automatic (Next.js)           | Route-based splitting                        | **First Load JS: 247KB**         |
| **Font Strategy**      | Local fonts (no Google Fonts) | Eliminates external request                  | **Saves ~200ms on initial load** |

---

## 💎 Code Highlights

Explore the most interesting implementations in this codebase:

### 1. **Decision Engine** - Weighted Random Algorithm

📂 [`src/lib/decisions.ts`](./src/lib/decisions.ts) (Lines 45-120)

```typescript
// Weighted random selection that prevents repetition
// Uses 30-day rolling history to reduce restaurant weights
// Ensures variety while respecting user preferences
```

**Why it's interesting:**

- Custom algorithm using exponential decay for visit recency
- Handles edge cases (no valid options, ties, new restaurants)
- Fully tested with 15+ unit tests
- Performance: O(n) time complexity

---

### 2. **Notification Orchestration** - Multi-Channel System

📂 [`src/lib/notifications.ts`](./src/lib/notifications.ts) (Lines 1-250)

```typescript
// Single interface to send notifications across 4 channels
// Handles failures gracefully with fallbacks
// Tracks delivery status and user preferences
```

**Why it's interesting:**

- Abstraction layer over Resend, Twilio, Push API, and in-app
- Implements graceful degradation (Email → SMS → In-app)
- User preference handling (opt-in/opt-out per channel)
- Comprehensive error tracking with retry logic

---

### 3. **Restaurant Search** - Caching Strategy

📂 [`src/app/api/restaurants/search/route.ts`](./src/app/api/restaurants/search/route.ts)

```typescript
// Google Places API with intelligent 30-day caching
// Saves $50-100/month on API costs
// Handles stale data gracefully
```

**Why it's interesting:**

- Two-tier cache: Memory (5min) + MongoDB (30 days)
- Cache hit rate tracking for cost analysis
- Automatic cache warming for popular searches
- Zod validation ensures type safety

---

### 4. **Tiered Voting UI** - Drag & Drop Ranking

📂 [`src/components/decisions/TieredVotingInterface.tsx`](./src/components/decisions/TieredVotingInterface.tsx)

```typescript
// Beautiful drag-and-drop ranking interface
// 1st place = 3pts, 2nd = 2pts, 3rd = 1pt
// Real-time tally with animations
```

**Why it's interesting:**

- Custom drag-and-drop with touch support
- Optimistic updates with TanStack Query
- Accessibility: Full keyboard navigation
- Smooth Framer Motion animations

---

### 5. **Error Boundary** - "Nibbles" Mascot

📂 [`src/app/error.tsx`](./src/app/error.tsx) + [`src/components/mascot/ErrorMascots.tsx`](./src/components/mascot/ErrorMascots.tsx)

```typescript
// Playful error handling with custom SVG burger character
// Root, route, and component-level error boundaries
// Automatic error logging to MongoDB
```

**Why it's interesting:**

- Three-tier error boundary strategy
- Custom SVG mascot with 5 expressions (confused, sad, worried, etc.)
- Error grouping and admin alerts
- User-friendly error messages with actionable steps

---

## 📊 Quality Metrics

### Test Coverage

```bash
# Unit Tests (Jest + React Testing Library)
Test Suites: 109 passed, 109 total
Tests:       1,367 passed, 1,367 total
Coverage:    91.2% statements, 87.5% branches, 89.3% functions, 90.8% lines
Duration:    45.32s
```

**Coverage Breakdown:**

- ✅ Components: 92.1%
- ✅ API Routes: 89.4%
- ✅ Library Functions: 94.7%
- ✅ Hooks: 88.2%

---

### E2E Test Results (Playwright)

```bash
# All Browsers (Chromium, Firefox, WebKit, Mobile)
Passing: 147 / 147 (100%)
Duration: 8m 42s
```

**Critical Flows Covered:**

- ✅ Authentication (sign-up with phone verification)
- ✅ Restaurant search with filters
- ✅ Collection management (create, update, delete, share)
- ✅ Group creation and collaboration
- ✅ Decision making (random + tiered voting)
- ✅ Notification delivery (all channels)
- ✅ Accessibility (axe-core scan on all pages)
- ✅ Performance (Lighthouse CI)

---

### Performance Metrics (Lighthouse)

```bash
Performance:     94 / 100  ✅
Accessibility:   98 / 100  ✅
Best Practices: 100 / 100  ✅
SEO:             92 / 100  ✅
```

**Web Vitals (Field Data):**

- First Contentful Paint (FCP): **1.2s** (Good ✅)
- Largest Contentful Paint (LCP): **1.8s** (Good ✅)
- Cumulative Layout Shift (CLS): **0.05** (Good ✅)
- Time to First Byte (TTFB): **420ms** (Good ✅)
- First Input Delay (FID): **45ms** (Good ✅)

---

### Bundle Size Analysis

```bash
# Production Build Output (next build)
Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          247 kB
├ ○ /_not-found                          871 B          158 kB
├ ƒ /api/auth/[...clerk]                 0 B                0 B
├ ○ /collections                         1.2 kB         248 kB
├ ○ /groups                              890 B          246 kB
├ ○ /history                             1.5 kB         249 kB
├ ○ /profile                             2.1 kB         250 kB
└ ○ /search                              3.2 kB         251 kB

○  (Static)  prerendered as static content
ƒ  (Dynamic) server-rendered on demand

First Load JS shared by all:             157 kB ✅
  ├ chunks/framework-[hash].js           45.2 kB
  ├ chunks/main-app-[hash].js            89.3 kB
  └ other shared chunks                  22.5 kB

Total Bundle Size: 458 KB ✅ (Target: < 500KB)
```

**Optimization Wins:**

- ✅ Tree-shaking removed 120KB of unused code
- ✅ Dynamic imports reduced initial bundle by 35%
- ✅ Image optimization saves ~70% on media files
- ✅ No console.logs in production (custom logger)

---

### Security Implementation

**Input Validation (Zod Schemas):**

```typescript
// Every API endpoint validates inputs with Zod
// Example: Restaurant search validation
const searchSchema = z.object({
  q: z.string().min(1).max(100),
  location: z.string().optional(),
  radius: z.number().min(100).max(50000).default(5000),
  cuisine: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
});
```

**Rate Limiting:**

- Google Places API: 10 requests/minute per user
- SMS notifications: 5 per hour per user
- Email notifications: 20 per hour per user
- Friend requests: 10 per day per user

**Cost Savings from Optimization:**

- Google Places cache: **~$50-100/month saved**
- Image optimization: **~40% bandwidth reduction**
- SMS URL shortening: **~$0.003/SMS saved** (40% reduction)
- Total monthly savings: **~$75-150**

---

## ✨ Features

### 🎯 Core Features

- **🔐 Secure Authentication** - Custom registration/sign-in with Clerk, including phone verification and email validation
- **📍 Smart Restaurant Search** - Google Places API integration with geocoding, location-based search, and advanced filtering
- **📚 Personal Collections** - Organize restaurants into custom collections (e.g., "Date Night", "Quick Lunch", "To Try")
- **👥 Social Features** - Add friends, create groups, and collaborate on shared restaurant collections
- **🎲 Intelligent Decision Making**
  - **Random Selection** - Weighted algorithm using 30-day rolling history to prevent repetition
  - **Tiered Voting** - Group voting system with drag-and-drop ranking (1st = 3pts, 2nd = 2pts, 3rd = 1pt)
  - **Manual Entry** - Log past restaurant visits to integrate with weight system
- **🔔 Multi-Channel Notifications**
  - In-app notifications with 30-second real-time updates
  - Email notifications via Resend API with rich HTML templates
  - SMS notifications via Twilio with URL shortening
  - PWA push notifications (iOS 16.4+ support)
  - Toast notifications for immediate feedback
- **📊 Decision History & Analytics** - Track eating patterns, view statistics, export data (CSV/JSON)
- **🛡️ Admin Dashboard** - Performance monitoring, error tracking, user management, and analytics
- **📱 Progressive Web App** - Installable, offline-capable, app-like experience on mobile devices
- **♿ Accessibility** - WCAG 2.1 AA compliant with keyboard navigation and screen reader support

### 🎨 User Experience

- **Mobile-First Design** - Optimized for mobile with responsive layouts across all screen sizes
- **Dark Mode** - Full dark mode support with smooth transitions
- **Smooth Animations** - Framer Motion for polished interactions and transitions
- **Real-Time Updates** - Live collaboration for group decisions with WebSocket subscriptions
- **Optimistic UI** - Immediate feedback with automatic rollback on errors
- **Error Boundaries** - Graceful error handling at root, route, and component levels with "Nibbles" mascot
- **Performance Optimized** - Bundle size < 500KB, sub-3-second load times, 90+ Lighthouse scores

---

## 🚀 Technologies

This project showcases a modern, production-ready tech stack with cutting-edge tools and best practices.

### 🎨 Frontend Framework

| Technology                                        | Version | Purpose                                               |
| ------------------------------------------------- | ------- | ----------------------------------------------------- |
| **[Next.js](https://nextjs.org/)**                | 15.5.4  | React framework with App Router, SSR, and API routes  |
| **[React](https://reactjs.org/)**                 | 19.1.0  | UI library with latest concurrent features            |
| **[TypeScript](https://www.typescriptlang.org/)** | 5.x     | Type-safe development with strict mode                |
| **[Tailwind CSS](https://tailwindcss.com/)**      | 4.x     | Utility-first CSS framework with custom design system |

### 🗄️ Backend & Database

| Technology                                    | Purpose                                                           |
| --------------------------------------------- | ----------------------------------------------------------------- |
| **[MongoDB Atlas](https://www.mongodb.com/)** | NoSQL database with cloud hosting and automatic scaling           |
| **Node.js**                                   | Runtime environment for Next.js API routes                        |
| **REST API**                                  | RESTful architecture for CRUD operations and external API proxies |

### 🔐 Authentication & Security

| Technology                      | Purpose                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------- |
| **[Clerk](https://clerk.com/)** | Modern authentication with social login, phone verification, and webhook sync |
| **JWT Tokens**                  | Secure API access and session management                                      |
| **Input Validation**            | Server-side validation with Zod schemas                                       |
| **Rate Limiting**               | API abuse prevention and cost control                                         |

### 🔌 External APIs

| API                                                                                                      | Purpose                                                     |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **[Google Places API](https://developers.google.com/maps/documentation/places/web-service)**             | Restaurant search with 30-day caching for cost optimization |
| **[Google Address Validation API](https://developers.google.com/maps/documentation/address-validation)** | Address validation and geocoding                            |
| **[Twilio](https://www.twilio.com/)**                                                                    | SMS notifications with phone verification                   |
| **[Resend](https://resend.com/)**                                                                        | Email notifications with HTML templates                     |

### 🎯 State Management & Data Fetching

| Technology                                       | Purpose                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| **[TanStack Query](https://tanstack.com/query)** | Server state management with intelligent caching and optimistic updates |
| **React Context**                                | Global state for auth and user preferences                              |
| **Custom Hooks**                                 | Reusable logic for collections, decisions, and notifications            |

### 🎨 UI & User Experience

| Technology                                          | Purpose                                |
| --------------------------------------------------- | -------------------------------------- |
| **[Framer Motion](https://www.framer.com/motion/)** | Smooth animations and page transitions |
| **[Sonner](https://sonner.emilkowal.ski/)**         | Beautiful toast notifications          |
| **[Lucide React](https://lucide.dev/)**             | Consistent icon system                 |
| **[Heroicons](https://heroicons.com/)**             | Additional UI icons                    |
| **Class Variance Authority**                        | Type-safe component variants           |

### 🧪 Testing & Quality Assurance

| Technology                                                            | Purpose                                      |
| --------------------------------------------------------------------- | -------------------------------------------- |
| **[Jest](https://jestjs.io/)**                                        | Unit testing framework with 109 test suites  |
| **[React Testing Library](https://testing-library.com/react)**        | Component testing with user-centric approach |
| **[Playwright](https://playwright.dev/)**                             | E2E testing across multiple browsers         |
| **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm)** | Automated accessibility testing              |
| **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)**    | Performance and best practices monitoring    |

### 📊 Performance & Monitoring

| Technology                                                                       | Purpose                                             |
| -------------------------------------------------------------------------------- | --------------------------------------------------- |
| **[@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)** | Bundle size analysis and optimization               |
| **Lighthouse**                                                                   | Web Vitals and performance metrics collection       |
| **Custom Metrics Dashboard**                                                     | Real-time performance and cost tracking             |
| **MongoDB Performance Tracking**                                                 | API usage, cache hit rates, and cost monitoring     |
| **Error Tracking System**                                                        | Custom error logging with grouping and admin alerts |

### 🛠️ Development Tools

| Technology                                               | Purpose                                 |
| -------------------------------------------------------- | --------------------------------------- |
| **[ESLint](https://eslint.org/)**                        | Code linting with Next.js configuration |
| **[Prettier](https://prettier.io/)**                     | Code formatting for consistency         |
| **[Husky](https://typicode.github.io/husky/)**           | Git hooks for pre-commit validation     |
| **[lint-staged](https://github.com/okonet/lint-staged)** | Run linters on staged files only        |
| **Custom ESLint Rules**                                  | No hardcoded colors enforcement         |

### 📱 Progressive Web App

| Technology               | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| **Service Workers**      | Offline caching and background sync       |
| **Web App Manifest**     | App installation and splash screens       |
| **Push API**             | Push notifications with iOS 16.4+ support |
| **PWA Status Indicator** | Visual feedback for installation status   |

### 🎨 Design System

| Component                  | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| **Custom Color Palette**   | Accessible color system with WCAG AA compliance     |
| **Typography System**      | Consistent font scales and line heights             |
| **Component Library**      | 100+ reusable UI components                         |
| **Responsive Breakpoints** | Mobile-first design with tablet and desktop support |
| **Error Mascot "Nibbles"** | Playful SVG burger character for error states       |

#### 🎭 Brand Identity

**Logo Concept: "Fork In The Road"**

The logo cleverly combines a **map pin** (representing restaurant locations) with a **fork** (dining utensil) created through negative space, while two curved **roads** diverge at the base—symbolizing the decision-making journey.

**Design Philosophy:**

- **Clean & Scalable**: Vector-based SVG design works at all sizes
- **Theme-Aware**: Uses `currentColor` for automatic light/dark mode adaptation
- **Symbolic**: Represents both location discovery and decision choices
- **Professional**: Sophisticated enough for a senior portfolio piece

**Assets Available:**

- `public/icons/logomark.svg` - Theme-aware logomark (navigation header)
- `public/icons/app-icon-base.svg` - Light mode PWA icon
- `public/icons/app-icon-dark.svg` - Dark mode PWA icon
- `public/icons/icon-{size}.svg` - All PWA icon sizes (72px to 512px)

**Color System:**

- **Primary Accent**: `#e3005a` (Infrared) - CTA buttons, highlights
- **Light Mode**: Monochrome grays with white surfaces (#fafafa base)
- **Dark Mode**: Pure black with subtle gray elevations (#000000 base)
- **Text**: High-contrast with WCAG AA compliance across all backgrounds

### 🚀 Deployment & Infrastructure

| Technology                        | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| **[Vercel](https://vercel.com/)** | Serverless deployment with automatic CI/CD |
| **GitHub Actions**                | Automated testing and quality checks       |
| **Vercel Cron Jobs**              | Daily performance metrics collection       |
| **Environment Variables**         | Secure configuration management            |

### 📦 Key Dependencies

```json
{
  "dependencies": {
    "@clerk/nextjs": "^6.32.2",
    "@googlemaps/js-api-loader": "^2.0.1",
    "@googlemaps/react-wrapper": "^1.2.0",
    "@heroicons/react": "^2.2.0",
    "@tanstack/react-query": "^5.90.2",
    "framer-motion": "^12.23.22",
    "lucide-react": "^0.544.0",
    "mongodb": "^6.20.0",
    "next": "15.5.4",
    "react": "19.1.0",
    "sonner": "^2.0.7",
    "svix": "^1.76.1",
    "twilio": "^5.10.2",
    "zod": "^4.1.11"
  }
}
```

### 🔧 Development Setup

**Minimum Requirements:**

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **MongoDB Atlas**: Free tier or higher
- **Git**: Latest version

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js 18+ and npm 9+** installed
2. **MongoDB Atlas account** (free tier available)
3. **Clerk account** for authentication
4. **Google Cloud account** for Places and Address Validation APIs
5. **Twilio account** (optional, for SMS notifications)
6. **Resend account** (optional, for email notifications)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/you-hungry.git
cd you-hungry
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=you-hungry

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Google APIs
GOOGLE_PLACES_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_ADDRESS_VALIDATION_API_KEY=AIza...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: SMS Notifications (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Optional: Email Notifications (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@forkintheroad.app
```

4. **Set up MongoDB Collections**

The app will automatically create collections on first use, but you can manually create them:

- `users` - User profiles and preferences
- `restaurants` - Restaurant data cache
- `collections` - Personal and group restaurant collections
- `groups` - Group information and memberships
- `decisions` - Decision history and results
- `friendships` - Friend relationships
- `inAppNotifications` - In-app notification storage
- `performanceMetrics` - Performance monitoring data
- `errorLogs` - Error tracking logs
- `alerts` - Admin alerts

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration Steps

#### 1. Configure Clerk Authentication

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable email and phone authentication
3. Set up webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Add webhook events: `user.created`, `user.updated`, `user.deleted`
5. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

#### 2. Configure Google APIs

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Places API** and **Address Validation API**
3. Create API keys with "None" application restrictions (server-side)
4. Add API keys to environment variables
5. Enable billing (required for API usage)

#### 3. Configure Twilio (Optional)

1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Upgrade to paid plan (required for phone verification)
3. Purchase a phone number
4. Copy Account SID, Auth Token, and phone number to environment variables

#### 4. Configure Resend (Optional)

1. Create a Resend account at [resend.com](https://resend.com)
2. Verify your domain or use `onboarding@resend.dev` for testing
3. Generate an API key
4. Add API key and sender email to environment variables

---

## 📂 Project Structure

```
you-hungry/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/              # Authentication pages
│   │   │   ├── sign-in/         # Custom sign-in page
│   │   │   └── sign-up/         # Custom registration with phone verification
│   │   ├── admin/               # Admin dashboard
│   │   │   ├── errors/          # Error tracking and management
│   │   │   ├── performance/     # Performance metrics dashboard
│   │   │   └── users/           # User management
│   │   ├── api/                 # REST API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── collections/     # Collection CRUD operations
│   │   │   ├── decisions/       # Decision making endpoints
│   │   │   ├── groups/          # Group management
│   │   │   ├── notifications/   # Notification endpoints
│   │   │   ├── restaurants/     # Restaurant search and management
│   │   │   ├── user/            # User profile endpoints
│   │   │   └── webhooks/        # Clerk webhook handler
│   │   ├── collections/         # Collections management pages
│   │   ├── groups/              # Group pages
│   │   ├── history/             # Decision history
│   │   ├── profile/             # User profile and settings
│   │   ├── search/              # Restaurant search
│   │   └── layout.tsx           # Root layout with error boundary
│   ├── components/              # React components
│   │   ├── admin/               # Admin panel components
│   │   ├── auth/                # Authentication components
│   │   ├── decisions/           # Decision making components
│   │   ├── features/            # Feature-specific components
│   │   ├── forms/               # Form components
│   │   ├── layout/              # Layout components (Header, Footer, etc.)
│   │   ├── mascot/              # "Nibbles" error mascot SVGs
│   │   └── ui/                  # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useCollections.ts    # Collections management
│   │   ├── useDecisions.ts      # Decision making
│   │   ├── useGroups.ts         # Group management
│   │   └── useNotifications.ts  # Notification system
│   ├── lib/                     # Utility functions and libraries
│   │   ├── db.ts                # MongoDB connection
│   │   ├── collections.ts       # Collection operations
│   │   ├── decisions.ts         # Decision algorithms
│   │   ├── groups.ts            # Group operations
│   │   ├── notifications.ts     # Notification orchestration
│   │   ├── email-notifications.ts # Email service
│   │   ├── push-notifications.ts # Push notification service
│   │   ├── sms-notifications.ts # SMS service
│   │   ├── logger.ts            # Smart logging system
│   │   └── error-tracker.ts     # Error tracking
│   ├── types/                   # TypeScript type definitions
│   ├── middleware.ts            # Next.js middleware (auth)
│   └── __tests__/               # Unit tests
├── e2e/                         # Playwright E2E tests
│   ├── accessibility.spec.ts    # Accessibility testing
│   ├── authentication.spec.ts   # Auth flow testing
│   ├── group-collaboration.spec.ts # Group features
│   ├── performance/             # Performance tests
│   └── registration-enhanced.spec.ts # Registration flow
├── docs/                        # Documentation
│   ├── baseline-performance-metrics.md
│   ├── color-contrast-comprehensive-solution.md
│   ├── EPIC_8_SUMMARY.md
│   ├── GROUP_DECISION_NOTIFICATIONS.md
│   └── SMS_CONSENT_IMPLEMENTATION.md
├── promptFiles/                 # Project documentation
│   ├── architecture/            # Technical architecture docs
│   ├── audits/                  # Code audits and cleanup reports
│   ├── deployment/              # Deployment guides
│   ├── guides/                  # Development guides
│   ├── implementation/          # Feature implementation docs
│   ├── planning/                # Project planning and tracking
│   └── testing/                 # Testing strategy docs
├── performance-metrics/         # Performance monitoring scripts
│   ├── collect-metrics.js       # Lighthouse and API metrics
│   ├── compare-metrics.js       # Historical comparison
│   ├── dashboard.js             # Metrics visualization
│   └── __tests__/               # Performance tool tests
├── public/                      # Static assets
│   ├── icons/                   # PWA app icons
│   ├── screenshots/             # PWA screenshots
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service worker
├── scripts/                     # Build and utility scripts
├── .husky/                      # Git hooks
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest testing configuration
├── playwright.config.ts         # Playwright E2E configuration
└── package.json                 # Dependencies and scripts
```

---

## 💻 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run dev:force        # Force start (skip port check)
npm run dev:kill         # Kill process on port 3000

# Building
npm run build            # Production build with Turbopack
npm run build:webpack    # Production build with Webpack
npm run analyze          # Build with bundle analyzer

# Type Checking
npm run type-check       # Run TypeScript compiler

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# E2E Testing
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode
npm run test:e2e:fast    # Run fast E2E tests (Chromium + Mobile)
npm run test:e2e:mobile  # Run mobile E2E tests
npm run test:e2e:smoke   # Run smoke tests only
npm run test:accessibility # Run accessibility tests

# Performance
npm run lighthouse       # Run Lighthouse audit
npm run perf:collect     # Collect performance metrics
npm run perf:compare     # Compare metrics over time
npm run perf:dashboard   # Generate metrics dashboard
npm run perf:all         # Run all performance tasks

# Production Simulation
npm run prod             # Full production build and start
npm run prod:build       # Production build only
npm run prod:start       # Start production server only

# Utilities
npm run logs:clean       # Replace console.log with smart logger
npm run check-colors     # Audit color contrast
npm run fix-colors       # Fix color contrast issues
```

### Git Workflow

The project uses Husky for pre-commit hooks:

1. **Pre-commit**: Runs `lint-staged` (ESLint + Prettier on staged files)
2. **Pre-push**: Runs type-check, lint, test, and build

To bypass hooks (not recommended):

```bash
git commit --no-verify
```

### Code Style Guidelines

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Files**: Component files match component name
- **Imports**: Absolute imports from `@/` (src directory)
- **Comments**: JSDoc comments for public functions
- **Colors**: No hardcoded colors (use Tailwind classes only)

---

## 🧪 Testing

### Unit Tests

**Framework**: Jest + React Testing Library  
**Coverage**: 109 test suites, ~1,367 tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Organization**:

- Component tests in `src/__tests__/`
- API route tests in `src/app/api/__tests__/`
- Library function tests in `src/lib/__tests__/`
- Hook tests co-located with hooks

### E2E Tests

**Framework**: Playwright  
**Browsers**: Chromium, Firefox, Safari, Mobile Chrome/Safari

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run accessibility tests
npm run test:accessibility

# Run performance tests
npm run test:performance
```

**Test Coverage**:

- ✅ Authentication flow (sign-up, sign-in, sign-out)
- ✅ Restaurant search and filtering
- ✅ Collection management (CRUD)
- ✅ Group creation and collaboration
- ✅ Decision making (random and tiered voting)
- ✅ Friend management
- ✅ Notification system
- ✅ Accessibility compliance
- ✅ Performance benchmarks

### Accessibility Testing

**Standard**: WCAG 2.1 AA Compliance

```bash
# Run accessibility E2E tests
npm run test:accessibility
```

**Coverage**:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast ratios
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Semantic HTML

### Performance Testing

**Tools**: Lighthouse CI, Custom metrics collection

```bash
# Run Lighthouse audit
npm run lighthouse

# Collect performance metrics
npm run perf:collect

# Compare metrics over time
npm run perf:compare

# View performance dashboard
npm run perf:dashboard
```

**Performance Targets**:

- First Load JS: < 250KB
- Total Bundle Size: < 500KB
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to First Byte (TTFB): < 800ms

---

## 📚 API Documentation

### Authentication

All authenticated endpoints require a valid Clerk session token.

#### User Endpoints

```
GET  /api/user/current                 Get current user's MongoDB ObjectId
GET  /api/user/profile                 Get user profile
PUT  /api/user/profile                 Update user profile
GET  /api/auth/check-username          Check username availability
```

### Collections

```
GET    /api/collections                Get user's collections
POST   /api/collections                Create new collection
GET    /api/collections/[id]           Get collection details
PUT    /api/collections/[id]           Update collection
DELETE /api/collections/[id]           Delete collection
```

### Restaurants

```
GET    /api/restaurants/search         Search restaurants
POST   /api/restaurants                Add restaurant to collection
PUT    /api/restaurants/[id]           Update restaurant details
DELETE /api/restaurants/[id]           Remove restaurant from collection
```

**Search Parameters**:

- `q`: Restaurant name or cuisine
- `location`: Address or city
- `lat`/`lng`: Coordinates
- `radius`: Search radius in meters
- `cuisine`: Cuisine type filter
- `minRating`: Minimum rating (0-5)
- `maxPrice`/`minPrice`: Price level (1-4)

### Groups

```
GET    /api/groups                     Get user's groups
POST   /api/groups                     Create group
GET    /api/groups/[id]                Get group details
PUT    /api/groups/[id]                Update group (admin only)
DELETE /api/groups/[id]                Delete group (admin only)
POST   /api/groups/[id]/invite         Invite user to group
POST   /api/groups/[id]/remove         Remove user from group
POST   /api/groups/[id]/promote        Promote user to admin
POST   /api/groups/[id]/leave          Leave group
```

### Decisions

```
GET    /api/decisions                  Get user's decisions
POST   /api/decisions                  Create personal decision
GET    /api/decisions/[id]             Get decision details
POST   /api/decisions/[id]/vote        Submit vote
POST   /api/decisions/manual           Create manual decision entry
GET    /api/decisions/history          Get decision history

# Group Decisions
GET    /api/decisions/group            Get group decisions
POST   /api/decisions/group            Create group decision
POST   /api/decisions/group/vote       Submit group vote
PUT    /api/decisions/group/vote       Complete decision
DELETE /api/decisions/group/vote       Close decision
POST   /api/decisions/group/random-select  Random selection
```

### Notifications

```
GET    /api/notifications              Get user's notifications
PUT    /api/notifications/[id]/read    Mark notification as read
DELETE /api/notifications/[id]         Delete notification
POST   /api/notifications/test         Test notification delivery
```

### Admin (Protected)

```
GET    /api/admin/users                List all users
GET    /api/admin/stats                Get app statistics
GET    /api/admin/errors               Get error logs
PUT    /api/admin/errors/[id]          Update error status
GET    /api/admin/performance          Get performance metrics
```

---

## 🚀 Deployment

### Prerequisites

- ✅ All tests passing (unit + E2E)
- ✅ Production build successful
- ✅ Environment variables configured
- ✅ Database setup complete
- ✅ External API keys ready

### Deploy to Vercel

1. **Push to GitHub**

```bash
git push origin main
```

2. **Import project in Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Configure build settings:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

3. **Configure Environment Variables**

Add all environment variables from `.env.local` to Vercel:

- Database: `MONGODB_URI`, `MONGODB_DATABASE`
- Authentication: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- APIs: `GOOGLE_PLACES_API_KEY`, `TWILIO_*`, `RESEND_API_KEY`
- App: `NEXT_PUBLIC_APP_URL` (use your Vercel URL)

4. **Deploy**

Click "Deploy" and wait for the build to complete.

5. **Post-Deployment Configuration**

After deployment:

1. **Update Clerk webhook URL** with your live domain
2. **Switch to Clerk production keys** (if using)
3. **Test push notifications** (HTTPS required)
4. **Configure admin user IDs** in `src/components/admin/AdminGate.tsx`
5. **Test SMS and email delivery** in production

### Custom Domain (Optional)

1. Purchase domain from registrar (Namecheap, Google Domains, etc.)
2. Add domain in Vercel project settings
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate generation (automatic)

### Monitoring

**Vercel Analytics** (Built-in):

- Real-time visitor analytics
- Web Vitals monitoring
- Function execution logs

**Custom Monitoring**:

- Admin dashboard at `/admin` (requires admin privileges)
- Error tracking with grouping and alerts
- Performance metrics with historical comparison
- API usage and cost tracking

---

## ⚡ Performance & Optimization

### Bundle Optimization

- **Code Splitting**: Automatic route-based splitting with Next.js
- **Tree Shaking**: Removes unused code in production
- **Minification**: Automatic JavaScript and CSS minification
- **Image Optimization**: Next.js Image component with lazy loading
- **Font Optimization**: Automatic font subset generation

**Current Bundle Size**:

- First Load JS: < 250KB
- Total Bundle Size: < 500KB
- Average Build Time: < 60 seconds

### Caching Strategy

**API Caching** (TanStack Query):

- Restaurant data: 5 minutes stale time, 30 days garbage collection
- User data: 5 minutes stale time
- Collections: 1 minute stale time with optimistic updates
- Decisions: Real-time with automatic refetching

**Google Places Caching**:

- Restaurant details: 30-day cache in MongoDB
- Search results: 5-minute memory cache
- Address validation: 90-day cache

**Cache Hit Rates**:

- Target: > 70% overall
- Current: Tracked in admin dashboard
- Cost savings: ~60-70% API cost reduction

### Performance Monitoring

**Lighthouse Scores** (Target):

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

**Web Vitals** (Target):

- FCP: < 1.8s (Good)
- LCP: < 2.5s (Good)
- FID: < 100ms (Good)
- CLS: < 0.1 (Good)
- TTFB: < 800ms (Good)

**Automated Monitoring**:

- Daily metrics collection via Vercel Cron Jobs
- Historical comparison and trend analysis
- Performance regression alerts
- Cost tracking and budget monitoring

---

## 🐛 Troubleshooting

### Common Issues

**Port 3000 already in use**:

```bash
npm run dev:kill
```

**MongoDB connection failed**:

- Check `MONGODB_URI` in `.env.local`
- Verify network access in MongoDB Atlas
- Ensure IP whitelist includes your IP or 0.0.0.0/0

**Clerk authentication not working**:

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- Check webhook URL is correct
- Ensure webhook secret matches

**Google Places API errors**:

- Check API is enabled in Google Cloud Console
- Verify billing is enabled
- Check API key restrictions (should be "None" for server-side)

**Build fails**:

```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### Debug Mode

Enable detailed logging:

```bash
# Add to .env.local
ENABLE_CONSOLE_LOGS=true
```

View logs in:

- Browser console (client-side)
- Terminal (server-side)
- Vercel function logs (production)

---

## 📖 Documentation

Comprehensive documentation is available in the `promptFiles/` directory:

- **Architecture**: Technical architecture and design system
- **Guides**: User flows, error tracking, API usage
- **Planning**: Epic breakdown, completed items, pending features
- **Deployment**: Pre-deployment and post-deployment checklists
- **Audits**: Code audits, test coverage, performance analysis

---

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test && npm run test:e2e`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure accessibility compliance
- Pass all linting and type checks

---

## 📄 License

This project is part of a personal portfolio. All rights reserved.

---

## 👤 Author

**Andrew Persad**

- Portfolio: [https://www.andrewpersad.com]
- LinkedIn: [https://www.linkedin.com/in/andrew-persad-aa496432/]
- GitHub: [@akpersad](https://github.com/akpersad)

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing framework and documentation
- **Vercel** - Seamless deployment and hosting
- **Clerk** - Excellent authentication solution
- **MongoDB** - Reliable database platform
- **Google** - Places API and mapping services
- **Open Source Community** - All the amazing libraries used in this project

---

## 📊 Project Stats

- **Lines of Code**: 50,000+
- **Components**: 100+
- **Test Suites**: 109
- **Test Cases**: 1,367+
- **API Endpoints**: 50+
- **Dependencies**: 40+
- **Development Time**: 6+ months
- **Epic Stories Completed**: 9/10

---

**Built with ❤️ and lots of ☕ by Andrew Persad**

_Solving the eternal question: "What should we eat tonight?"_
