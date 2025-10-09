# Troubleshooting: Server Action Not Found Error

## The Error

```
Server Action "7fcca626a2e4f67ffc16cbaa2ad69aed654d257eec" was not found on the server.
Read more: https://nextjs.org/docs/messages/failed-to-find-server-action
```

## What Causes This?

This error typically occurs due to:

1. **Service Worker Caching** - PWA service workers caching stale pages with old Server Action IDs (most common!)
2. **Build Cache Issues** - Stale `.next` directory with outdated Server Action references
3. **Browser Cache** - Browser caching old pages with outdated Server Actions
4. **Hot Module Replacement (HMR) Issues** - Turbopack/Webpack dev mode cache conflicts
5. **Component Type Changes** - Converting Server Components to Client Components or vice versa
6. **Development Server State** - Server and client builds out of sync

## Quick Fix

Run this command to clear caches and restart:

```bash
npm run dev:fix
```

This will:

- Clear the `.next` directory
- Clear `node_modules/.cache`
- Kill any process on port 3000
- Restart the development server

**IMPORTANT:** After running this, you MUST also clear your browser caches:

### Clear Browser Cache (Critical!)

#### Chrome/Edge/Brave:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Under "Storage", click **Clear site data**
4. Check all boxes and click "Clear site data"

#### Alternative - Unregister Service Worker:

1. Visit `chrome://serviceworker-internals/`
2. Find "You Hungry" service worker
3. Click **Unregister**
4. Hard refresh the page (Ctrl/Cmd + Shift + R)

#### Safari:

1. Open DevTools
2. Go to **Storage** tab
3. Click **Clear Local Storage**
4. Hard refresh (Cmd + Shift + R)

## Manual Steps

If the quick fix doesn't work, try these steps:

### 1. Clear All Caches

```bash
# Clear Next.js build cache
rm -rf .next

# Clear node_modules cache
rm -rf node_modules/.cache

# Clear any temp files
rm -rf .turbo
```

### 2. Kill Port 3000

```bash
npm run dev:kill
```

### 3. Restart Dev Server

```bash
npm run dev
```

### 4. If Still Not Working - Full Reset

```bash
# Stop the dev server (Ctrl+C)

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear all caches
rm -rf .next node_modules/.cache .turbo

# Restart
npm run dev
```

## Prevention Tips

To avoid this error in the future:

### 1. Use Proper Component Boundaries

```tsx
// ❌ Bad - Mixing Server and Client Actions
'use client';

async function serverAction() {
  'use server';
  // This won't work!
}

// ✅ Good - Keep Server Actions in Server Components
// server-actions.ts
('use server');
export async function myServerAction() {
  // ...
}

// component.tsx
('use client');
import { myServerAction } from './server-actions';
```

### 2. Restart on Major Changes

Restart the dev server after:

- Creating new Server Actions
- Converting components between Server/Client
- Modifying API routes significantly
- Installing new dependencies

### 3. Use Webpack Instead of Turbopack (If Issues Persist)

Turbopack is still experimental and can have cache issues. To use Webpack:

```bash
# In package.json, change:
"dev": "next dev"  # Remove --turbopack flag

# Or run directly:
npm run dev:force -- --no-turbo
```

### 4. Keep Server Actions Separate

Create a dedicated file for Server Actions:

```tsx
// app/actions/user-actions.ts
'use server';

export async function updateUser(formData: FormData) {
  // Server action logic
}

export async function deleteUser(userId: string) {
  // Server action logic
}
```

Then import them in Client Components:

```tsx
// app/components/UserForm.tsx
'use client';

import { updateUser } from '@/app/actions/user-actions';

export function UserForm() {
  return <form action={updateUser}>{/* form fields */}</form>;
}
```

## Configuration

The `next.config.ts` has been updated with Server Actions configuration:

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '2mb',
    allowedOrigins: ['localhost:3000'],
  },
}
```

This helps prevent ID mismatch errors and provides better debugging.

## PWA Service Worker Issues

If you're using the PWA features, the service worker can cache stale pages:

### How It Happens

1. Service worker caches the home page with Server Action IDs
2. You clear `.next` and rebuild - new Server Action IDs are generated
3. Browser serves cached page with old Server Action IDs
4. Client tries to call old Server Action → 404 error

### Solution

The service worker has been updated to use **network-first** strategy for HTML pages. This means:

- Fresh pages are always fetched from the network
- Cache is only used when offline
- Service worker version bumped to v3 to clear old caches

**You still need to:**

1. Clear browser cache manually (see instructions above)
2. Wait for the service worker to update (automatic on next page load)
3. Or manually unregister the old service worker

### Prevent Future Issues

- Always clear browser cache when you see this error
- The updated service worker (v3) uses network-first for pages
- Service worker only caches for offline support now

## Related Issues

- [Next.js Issue #56558](https://github.com/vercel/next.js/issues/56558)
- [Next.js Issue #48748](https://github.com/vercel/next.js/issues/48748)
- [Turbopack Cache Issues](https://github.com/vercel/next.js/discussions/53074)

## Still Having Issues?

1. Check if you're running the latest Next.js version
2. Review the [Next.js Server Actions documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
3. Check the browser console and terminal for additional error messages
4. Try building for production to see if it's a dev-only issue: `npm run build`
