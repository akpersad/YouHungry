# Authentication Redirect Implementation

## Overview

Implemented comprehensive authentication redirects with callback URLs to ensure users are redirected back to their originally requested page after signing in.

## Changes Made

### 1. Middleware (`src/middleware.ts`)

- Added comments explaining that `auth.protect()` automatically redirects unauthenticated users to `/sign-in` with a `redirect_url` parameter
- No code changes needed - Clerk middleware handles this automatically

### 2. Sign-In Page (`src/app/sign-in/[[...rest]]/page.tsx`)

- Added logic to read `redirect_url` from query parameters
- Pass the redirect URL to Clerk's `SignIn` component via `forceRedirectUrl` prop
- Falls back to `/dashboard` if no redirect URL is provided
- Fixed syntax error (missing opening parenthesis)

### 3. ProtectedRoute Component (`src/components/auth/ProtectedRoute.tsx`)

- Completely refactored to redirect users to `/sign-in` with callback URL instead of showing inline sign-in button
- Uses `useRouter` and `usePathname` to capture current page
- Redirects to `/sign-in?redirect_url=<current-page>` when user is not authenticated
- Shows loading spinner while redirecting for better UX

### 4. Profile Page (`src/app/profile/page.tsx`)

- Added `useRouter` import
- Implemented `useEffect` hook to redirect unauthenticated users to `/sign-in?redirect_url=/profile`
- Replaced manual sign-in button with loading spinner during redirect

### 5. Removed ProtectedRoute from Middleware-Protected Pages

Removed `ProtectedRoute` wrapper from pages that are handled by middleware to avoid conflicts:

- `/analytics` - Now handled by middleware only
- `/friends` - Now handled by middleware only
- `/history` - Now handled by middleware only
- `/groups` - Now handled by middleware only

### 6. Pages Using ProtectedRoute (Client-Side Protection)

These pages use `ProtectedRoute` for client-side authentication checks:

- `/dashboard` - Uses ProtectedRoute
- `/groups/[id]` - Uses ProtectedRoute
- `/groups/[id]/collections` - Uses ProtectedRoute
- `/restaurants` - Uses ProtectedRoute
- `/collections/[id]` - Uses ProtectedRoute
- `/admin` - Uses AdminGate
- `/profile` - Uses custom redirect logic

## Authentication Flow

### Before Sign-In

1. User tries to access protected route (e.g., `/profile`)
2. Middleware detects unauthenticated request via `auth.protect()`
3. Middleware redirects to `/sign-in?redirect_url=/profile`

### At Sign-In Page

1. Sign-in page reads `redirect_url` query parameter
2. Passes it to Clerk's `SignIn` component as `forceRedirectUrl`
3. Falls back to `/dashboard` if no redirect URL provided

### After Sign-In

1. Clerk completes authentication
2. Clerk redirects to the URL specified in `forceRedirectUrl`
3. User lands on the original page they were trying to access

## Protected vs Public Routes

### Public Routes (defined in middleware)

- `/` - Home page
- `/sign-in(.*)` - Sign-in page and sub-routes
- `/sign-up(.*)` - Sign-up page and sub-routes
- `/push-test` - Push notification test page
- `/pwa-explorer` - PWA explorer page
- `/api/restaurants/search` - Public restaurant search API
- `/api/webhooks/clerk` - Clerk webhook endpoint
- `/api/decisions(.*)` - Decision APIs
- `/api/collections(.*)` - Collection APIs
- `/api/restaurants(.*)` - Restaurant APIs
- `/api/address(.*)` - Address APIs
- `/api/pwa-status` - PWA status API

### Protected Routes

All other routes require authentication and will redirect to sign-in with callback URL.

## Testing Checklist

- [ ] Visit `/profile` while signed out - should redirect to `/sign-in?redirect_url=/profile`
- [ ] Sign in successfully - should redirect back to `/profile`
- [ ] Visit `/dashboard` while signed out - should redirect with callback
- [ ] Visit `/groups` while signed out - should redirect with callback
- [ ] Visit `/friends` while signed out - should redirect with callback
- [ ] Visit `/history` while signed out - should redirect with callback
- [ ] Visit `/analytics` while signed out - should redirect with callback
- [ ] Direct visit to `/sign-in` - should redirect to `/dashboard` after sign-in

## Benefits

1. **Better UX**: Users don't lose their place when forced to sign in
2. **Bookmarking**: Users can bookmark protected pages and sign in when accessing them
3. **Consistent Behavior**: All protected routes behave the same way
4. **Security**: Middleware ensures no protected content is accessed without authentication
5. **No Dead Ends**: Users always know where they'll end up after signing in
