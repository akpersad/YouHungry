import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/restaurants/search',
  '/api/webhooks/clerk',
  '/api/decisions(.*)',
  '/api/collections(.*)',
  '/api/restaurants(.*)',
  '/api/address(.*)',
  '/api/graphql',
  '/push-test',
  '/pwa-explorer',
  '/api/pwa-status',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
